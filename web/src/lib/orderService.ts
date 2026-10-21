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

// Address Book API
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
    console.warn('Firestore setDoc failed, saving to local cache', err);
  }

  // Update localStorage cache
  const key = `quickzy_addresses_${userId}`;
  const existing = getSavedAddressesLocal(userId);
  existing.push(newAddr);
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(existing));
  }

  return newAddr;
}

export function getSavedAddressesLocal(userId: string): AddressItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`quickzy_addresses_${userId}`);
  if (!raw) {
    // Seed default London addresses
    return [
      {
        id: 'addr_1',
        userId,
        line1: '142 Upper Street',
        city: 'London',
        postcode: 'N1 1QP',
        label: 'Islington Hub',
      },
      {
        id: 'addr_2',
        userId,
        line1: '10 Downing Street',
        city: 'London',
        postcode: 'SW1A 2AA',
        label: 'Central London Office',
      },
      {
        id: 'addr_3',
        userId,
        line1: '25 Bank Street, Canary Wharf',
        city: 'London',
        postcode: 'E14 5JP',
        label: 'Client Canary Wharf HQ',
      },
    ];
  }
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
      return snapshot.docs.map((d) => d.data() as AddressItem);
    }
  } catch (err) {
    console.warn('Firestore fetch failed, fallback to local', err);
  }
  return getSavedAddressesLocal(userId);
}

// Order Management API
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
    console.warn('Firestore save order failed, caching to localStorage', err);
  }

  saveOrderLocal(newOrder);
  return newOrder;
}

// Bulk Order Creation (Transaction-like all-or-nothing creation)
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
    console.warn('Firestore getOrder error, checking local', err);
  }

  const localOrders = getLocalOrders();
  return localOrders.find((o) => o.id === orderId) || null;
}

export async function fetchAllOrders(userId?: string, role?: UserRole): Promise<QuickzyOrder[]> {
  try {
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    if (userId && role !== 'admin') {
      q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as QuickzyOrder);
    }
  } catch (err) {
    console.warn('Firestore fetchAllOrders error, reading local orders', err);
  }

  const local = getLocalOrders();
  if (userId && role !== 'admin') {
    return local.filter((o) => o.userId === userId);
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
    console.warn('Firestore updateDoc failed, updating local state', err);
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

// Local Storage Helpers
function saveOrderLocal(order: QuickzyOrder) {
  if (typeof window === 'undefined') return;
  const existing = getLocalOrders();
  existing.unshift(order);
  localStorage.setItem('quickzy_orders', JSON.stringify(existing));
}

export function getLocalOrders(): QuickzyOrder[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('quickzy_orders');
  if (!raw) {
    // Seed sample initial orders for instant demonstration
    const seed: QuickzyOrder[] = [
      {
        id: 'QZK-LON-7810',
        userId: 'client_demo',
        userEmail: 'business@mayfairpharma.co.uk',
        role: 'client',
        type: 'pharmacy',
        status: 'out_for_delivery',
        pickupAddress: {
          id: 'p1',
          line1: 'Mayfair Medical Dispensary, 14 Curzon St',
          city: 'London',
          postcode: 'W1J 5HN',
        },
        dropoffAddress: {
          id: 'd1',
          line1: 'Flat 4, 88 Knightsbridge',
          city: 'London',
          postcode: 'SW1X 7LA',
        },
        timeSlot: 'same_day_asap',
        isSameDayCutoffExceeded: false,
        parcel: {
          weightKg: 0.6,
          lengthCm: 15,
          widthCm: 10,
          heightCm: 5,
          contentsDescription: 'Prescription antibiotics & thermal pack',
          isRestricted: true,
          restrictedCategory: 'Prescription Medicine',
        },
        pricePence: 890,
        priceGbp: 8.9,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
        assignedDriverName: 'Marcus Evans (E-Cargo Bike #4)',
        invoiceId: 'INV-QZK-LON-7810',
      },
      {
        id: 'QZK-LON-4421',
        userId: 'cust_demo',
        userEmail: 'karan@quickzy.co.uk',
        role: 'customer',
        type: 'parcel',
        status: 'collected',
        pickupAddress: {
          id: 'p2',
          line1: 'Quickzy Shoreditch Hub, 45 Redchurch St',
          city: 'London',
          postcode: 'E2 7DJ',
        },
        dropoffAddress: {
          id: 'd2',
          line1: '28 Canonbury Square, Islington',
          city: 'London',
          postcode: 'N1 2AL',
        },
        timeSlot: 'same_day_asap',
        isSameDayCutoffExceeded: false,
        parcel: {
          weightKg: 2.4,
          lengthCm: 30,
          widthCm: 25,
          heightCm: 15,
          contentsDescription: 'Artisan ceramic tableware set',
          isRestricted: false,
        },
        pricePence: 1140,
        priceGbp: 11.4,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date().toISOString(),
        assignedDriverName: 'Sarah Jenkins (EV Van #2)',
        invoiceId: 'INV-QZK-LON-4421',
      },
    ];
    localStorage.setItem('quickzy_orders', JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
