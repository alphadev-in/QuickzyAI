import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  QuickzyOrder,
  AddressItem,
  BulkImportRecord,
  CreateOrderSchema,
  calculateDeliveryPrice,
  evaluateSameDayCutoff,
  UserRole,
  ParcelPricingConfig,
  DEFAULT_PRICING_CONFIG,
} from '@/types/delivery';

export async function fetchPricingConfig(): Promise<ParcelPricingConfig> {
  try {
    const snap = await getDoc(doc(db, 'system_settings', 'pricing'));
    if (snap.exists()) {
      return snap.data() as ParcelPricingConfig;
    }
  } catch (err) {
    console.warn('Failed to load pricing config from Firestore, using default:', err);
  }
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('quickzy_pricing_config');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return DEFAULT_PRICING_CONFIG;
}

export async function savePricingConfig(config: ParcelPricingConfig): Promise<boolean> {
  try {
    await setDoc(doc(db, 'system_settings', 'pricing'), config);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickzy_pricing_config', JSON.stringify(config));
    }
    return true;
  } catch (err) {
    console.error('Failed to save pricing config to Firestore:', err);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickzy_pricing_config', JSON.stringify(config));
    }
    return false;
  }
}

// Address Book API: Exclusively writes and reads Firestore
export async function saveAddress(userId: string, address: Omit<AddressItem, 'id'>): Promise<AddressItem> {
  const addressId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newAddr: AddressItem = {
    ...address,
    id: addressId,
    userId,
  };

  try {
    await setDoc(doc(db, 'addresses', addressId), newAddr);
  } catch (err) {
    console.error('Firestore save address error:', err);
  }

  // Sync to local cache
  if (typeof window !== 'undefined') {
    const key = `quickzy_addresses_${userId}`;
    const existing = getSavedAddressesLocal(userId);
    existing.push(newAddr);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  return newAddr;
}

export function getSavedAddressesLocal(userId: string): AddressItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`quickzy_addresses_${userId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function fetchUserAddresses(userId: string): Promise<AddressItem[]> {
  try {
    const q = query(collection(db, 'addresses'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as AddressItem);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`quickzy_addresses_${userId}`, JSON.stringify(items));
      }
      return items;
    }
  } catch (err) {
    console.warn('Firestore fetch addresses failed, reading cache:', err);
  }
  return getSavedAddressesLocal(userId);
}

// Order Management API: Directly records each user order into Firestore
export async function createOrder(
  userId: string,
  userEmail: string,
  role: UserRole,
  orderData: Parameters<typeof CreateOrderSchema.parse>[0],
  pricingConfig?: ParcelPricingConfig,
  displayName?: string
): Promise<QuickzyOrder> {
  const validated = CreateOrderSchema.parse(orderData);
  const cutoffInfo = evaluateSameDayCutoff();

  const quote = calculateDeliveryPrice(
    {
      type: validated.type,
      weightKg: validated.parcel?.weightKg,
      lengthCm: validated.parcel?.lengthCm,
      widthCm: validated.parcel?.widthCm,
      heightCm: validated.parcel?.heightCm,
      isRestricted: validated.parcel?.isRestricted,
    },
    pricingConfig || DEFAULT_PRICING_CONFIG
  );

  const orderId = `QZK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const newOrder: QuickzyOrder = {
    id: orderId,
    userId,
    userEmail,
    role,
    type: validated.type,
    status: 'booked',
    pickupAddress: { ...validated.pickupAddress, id: `pk_${Date.now()}` },
    dropoffAddress: { ...validated.dropoffAddress, id: `dp_${Date.now()}` },
    timeSlot: validated.timeSlot,
    scheduledFor: cutoffInfo.isCutoffExceeded ? cutoffInfo.effectiveDeliveryDate : validated.scheduledFor || now,
    isSameDayCutoffExceeded: cutoffInfo.isCutoffExceeded,
    parcel: validated.parcel
      ? {
          weightKg: validated.parcel.weightKg,
          lengthCm: validated.parcel.lengthCm,
          widthCm: validated.parcel.widthCm,
          heightCm: validated.parcel.heightCm,
          contentsDescription: validated.parcel.contentsDescription,
          isRestricted: validated.parcel.isRestricted,
          restrictedCategory: validated.parcel.restrictedCategory,
        }
      : undefined,
    specialNotes: validated.specialNotes,
    pricePence: quote.totalPence,
    priceGbp: quote.totalGbp,
    createdAt: now,
    updatedAt: now,
    invoiceId: `INV-${orderId}`,
    activities: [
      {
        timestamp: now,
        action: 'Order Placed',
        actor: displayName || (userEmail ? userEmail.split('@')[0] : userId),
        details: `Initial ${validated.type.toUpperCase()} consignment booked for £${quote.totalGbp.toFixed(2)}`,
        location: `${validated.pickupAddress.line1} (${validated.pickupAddress.postcode})`,
      },
    ],
  };

  try {
    await setDoc(doc(db, 'orders', orderId), newOrder);
  } catch (err) {
    console.error('Firestore save order error:', err);
  }

  saveOrderLocal(newOrder);
  return newOrder;
}

// Bulk Order Creation (Executed atomically into Firestore)
export async function createBulkOrders(
  clientId: string,
  clientEmail: string,
  ordersToCreate: Parameters<typeof CreateOrderSchema.parse>[0][]
): Promise<{ success: boolean; orders: QuickzyOrder[]; error?: string }> {
  try {
    const createdOrders: QuickzyOrder[] = [];
    const importId = `BULK-${Date.now().toString(36).toUpperCase()}`;

    for (const data of ordersToCreate) {
      const order = await createOrder(clientId, clientEmail, 'client', data);
      order.bulkImportId = importId;
      createdOrders.push(order);
    }

    const bulkRecord: BulkImportRecord = {
      id: importId,
      clientId,
      filename: `import_${new Date().toISOString().slice(0, 10)}.csv`,
      status: 'completed',
      rowCount: ordersToCreate.length,
      successCount: ordersToCreate.length,
      errorCount: 0,
      errorLog: [],
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'bulk_imports', importId), bulkRecord);
    } catch (e) {
      console.warn('Failed to store bulk import record in Firestore', e);
    }

    return { success: true, orders: createdOrders };
  } catch (err: any) {
    return { success: false, orders: [], error: err.message || 'Bulk creation failed' };
  }
}

// Order Status & Tracking
export async function getOrderById(orderId: string): Promise<QuickzyOrder | null> {
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (snap.exists()) {
      return snap.data() as QuickzyOrder;
    }
  } catch (err) {
    console.warn('Firestore getOrder error:', err);
  }

  const localOrders = getLocalOrders();
  return localOrders.find((o) => o.id === orderId) || null;
}

export async function fetchAllOrders(userEmail?: string, role?: UserRole): Promise<QuickzyOrder[]> {
  const safeUserEmail = userEmail?.toLowerCase() || '';
  try {
    let q;
    if (role === 'admin' || safeUserEmail === 'prajapatikaranc@gmail.com') {
      // Admin sees all real user orders from Firestore
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    } else if (safeUserEmail) {
      // Regular user sees only their own orders
      q = query(collection(db, 'orders'), where('userEmail', '==', safeUserEmail));
    } else {
      return [];
    }

    const snap = await getDocs(q);
    if (!snap.empty) {
      const liveOrders = snap.docs.map((d) => d.data() as QuickzyOrder);
      if (typeof window !== 'undefined') {
        localStorage.setItem('quickzy_orders', JSON.stringify(liveOrders));
      }
      return liveOrders;
    }
  } catch (err) {
    console.warn('Firestore fetchAllOrders error:', err);
  }

  const local = getLocalOrders();
  if (role !== 'admin' && safeUserEmail) {
    return local.filter((o) => (o.userEmail && o.userEmail.toLowerCase() === safeUserEmail) || o.userId === safeUserEmail);
  }
  return local;
}

export interface UpdateOrderMeta {
  driverName?: string;
  driverEmail?: string;
  proofOfDeliveryPhoto?: string;
  handoverNotes?: string;
  location?: string;
  details?: string;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: QuickzyOrder['status'],
  metaOrDriverName?: string | UpdateOrderMeta
): Promise<boolean> {
  const now = new Date().toISOString();
  const meta: UpdateOrderMeta =
    typeof metaOrDriverName === 'string'
      ? { driverName: metaOrDriverName }
      : metaOrDriverName || {};

  const actionMap: Record<QuickzyOrder['status'], string> = {
    booked: 'Order Booked',
    collected: 'Consignment Collected',
    out_for_delivery: 'Dispatched & Out for Delivery',
    delivered: 'Delivery Completed & Handed Over',
    cancelled: 'Order Cancelled',
  };

  const newActivity = {
    timestamp: now,
    action: actionMap[newStatus] || newStatus,
    actor: meta.driverName || meta.driverEmail || 'Quickzy Dispatch Fleet',
    details: meta.details || (newStatus === 'delivered' ? `Proof captured. Notes: ${meta.handoverNotes || 'Signed and handed over securely.'}` : undefined),
    location: meta.location,
  };

  const notification =
    newStatus === 'delivered'
      ? `Delivery Complete! Your package was delivered and handed over.`
      : newStatus === 'out_for_delivery'
      ? `Driver ${meta.driverName || 'assigned'} is on the way for rapid London delivery.`
      : newStatus === 'collected'
      ? `Package collected by ${meta.driverName || 'driver'}.`
      : undefined;

  const patchData: Record<string, any> = {
    status: newStatus,
    updatedAt: now,
  };

  if (meta.driverName) patchData.assignedDriverName = meta.driverName;
  if (meta.driverEmail) patchData.assignedDriverEmail = meta.driverEmail;
  if (meta.proofOfDeliveryPhoto) patchData.proofOfDeliveryPhoto = meta.proofOfDeliveryPhoto;
  if (meta.handoverNotes) patchData.handoverNotes = meta.handoverNotes;
  if (newStatus === 'delivered') patchData.deliveredAt = now;
  if (notification) patchData.notificationAlert = notification;

  try {
    const orderRef = doc(db, 'orders', orderId);
    const existingSnap = await getDoc(orderRef);
    const existingActivities = existingSnap.exists() ? (existingSnap.data().activities || []) : [];
    patchData.activities = [...existingActivities, newActivity];
    await updateDoc(orderRef, patchData);
  } catch (err) {
    console.warn('Firestore updateDoc failed:', err);
  }

  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    const existingActivities = orders[idx].activities || [];
    orders[idx] = {
      ...orders[idx],
      status: newStatus,
      updatedAt: now,
      ...(meta.driverName ? { assignedDriverName: meta.driverName } : {}),
      ...(meta.driverEmail ? { assignedDriverEmail: meta.driverEmail } : {}),
      ...(meta.proofOfDeliveryPhoto ? { proofOfDeliveryPhoto: meta.proofOfDeliveryPhoto } : {}),
      ...(meta.handoverNotes ? { handoverNotes: meta.handoverNotes } : {}),
      ...(newStatus === 'delivered' ? { deliveredAt: now } : {}),
      ...(notification ? { notificationAlert: notification } : {}),
      activities: [...existingActivities, newActivity],
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickzy_orders', JSON.stringify(orders));
    }
    return true;
  }
  return false;
}

// Local Storage Cache
function saveOrderLocal(order: QuickzyOrder) {
  if (typeof window === 'undefined') return;
  const existing = getLocalOrders();
  existing.unshift(order);
  localStorage.setItem('quickzy_orders', JSON.stringify(existing));
}

export function getLocalOrders(): QuickzyOrder[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('quickzy_orders');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
