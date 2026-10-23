import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { AddressItem, CustomerRecord } from '@/types/delivery';

// Customer module: each signed-in user manages their own customers at customers/{id}.
// Errors are thrown (not swallowed) so the UI can show them.

const COLLECTION = 'customers';

export async function fetchCustomers(ownerEmail: string): Promise<CustomerRecord[]> {
  const owner = ownerEmail.toLowerCase();
  const snap = await getDocs(query(collection(db, COLLECTION), where('ownerEmail', '==', owner)));
  return snap.docs
    .map((d) => d.data() as CustomerRecord)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CustomerInput {
  id?: string;
  name: string;
  addresses: AddressItem[];
  createdAt?: string;
}

export async function saveCustomer(ownerEmail: string, input: CustomerInput): Promise<CustomerRecord> {
  const now = new Date().toISOString();
  const id = input.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const record: CustomerRecord = {
    id,
    ownerEmail: ownerEmail.toLowerCase(),
    name: input.name.trim(),
    addresses: input.addresses.map((a) => ({ ...a, userId: ownerEmail.toLowerCase() })),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTION, id), record);
  return record;
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
