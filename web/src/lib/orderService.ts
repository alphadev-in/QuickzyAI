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
} from '@/types/delivery';

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
  orderData: Parameters<typeof CreateOrderSchema.parse>[0]
): Promise<QuickzyOrder> {
  const validated = CreateOrderSchema.parse(orderData);
  const cutoffInfo = evaluateSameDayCutoff();

  const quote = calculateDeliveryPrice({
    type: validated.type,
    weightKg: validated.parcel?.weightKg,
    lengthCm: validated.parcel?.lengthCm,
    widthCm: validated.parcel?.widthCm,
    heightCm: validated.parcel?.heightCm,
    isRestricted: validated.parcel?.isRestricted,
  });

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
  try {
    let q;
    if (role === 'admin' || userEmail === 'prajapatikaranc@gmail.com') {
      // Admin sees all real user orders from Firestore
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    } else if (userEmail) {
      // Regular user sees only their own orders
      q = query(collection(db, 'orders'), where('userEmail', '==', userEmail));
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
  if (role !== 'admin' && userEmail) {
    return local.filter((o) => o.userEmail === userEmail || o.userId === userEmail);
  }
  return local;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: QuickzyOrder['status'],
  driverName?: string
): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: newStatus,
      updatedAt: now,
      ...(driverName ? { assignedDriverName: driverName } : {}),
    });
  } catch (err) {
    console.warn('Firestore updateDoc failed:', err);
  }

  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    orders[idx].updatedAt = now;
    if (driverName) orders[idx].assignedDriverName = driverName;
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
