import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';

export type MedicalRecordType =
  | 'prescription'
  | 'vaccine'
  | 'lab_result'
  | 'surgery'
  | 'visit_note'
  | 'other';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export interface MedicalRecord {
  id: string;
  type: MedicalRecordType;
  title: string;
  date: Timestamp;
  vetName: string;
  clinicName: string;
  description: string;
  tags: string[];

  imageRef: string;
  pdfRef: string;

  ocrRawText: string;
  medications: Medication[];
  instructions: string;
  diagnosis: string;
  followUpDate: string;

  appointmentId: string | null;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MedicalRecordInput {
  type: MedicalRecordType;
  title: string;
  date: Date;
  vetName: string;
  clinicName: string;
  description: string;
  tags: string[];
  imageRef: string;
  pdfRef: string;
  ocrRawText: string;
  medications: Medication[];
  instructions: string;
  diagnosis: string;
  followUpDate: string;
  appointmentId: string | null;
  verified: boolean;
}

const recordsCollection = (userId: string) =>
  collection(db, 'users', userId, 'medicalRecords');

function docToRecord(id: string, data: any): MedicalRecord {
  return {
    id,
    type: data.type || 'other',
    title: data.title || '',
    date: data.date,
    vetName: data.vetName || '',
    clinicName: data.clinicName || '',
    description: data.description || '',
    tags: data.tags || [],
    imageRef: data.imageRef || '',
    pdfRef: data.pdfRef || '',
    ocrRawText: data.ocrRawText || '',
    medications: data.medications || [],
    instructions: data.instructions || '',
    diagnosis: data.diagnosis || '',
    followUpDate: data.followUpDate || '',
    appointmentId: data.appointmentId || null,
    verified: data.verified || false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getRecords(userId: string, type?: MedicalRecordType): Promise<MedicalRecord[]> {
  let q = query(recordsCollection(userId), orderBy('date', 'desc'));
  if (type) {
    q = query(recordsCollection(userId), where('type', '==', type), orderBy('date', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToRecord(d.id, d.data()));
}

export async function getRecord(userId: string, recordId: string): Promise<MedicalRecord | null> {
  const snap = await getDoc(doc(recordsCollection(userId), recordId));
  if (!snap.exists()) return null;
  return docToRecord(snap.id, snap.data());
}

export async function createRecord(userId: string, input: MedicalRecordInput): Promise<string> {
  const docRef = await addDoc(recordsCollection(userId), {
    ...input,
    date: Timestamp.fromDate(input.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateRecord(
  userId: string,
  recordId: string,
  updates: Partial<MedicalRecordInput>,
): Promise<void> {
  await updateDoc(doc(recordsCollection(userId), recordId), {
    ...updates,
    date: updates.date ? Timestamp.fromDate(updates.date) : undefined,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecord(userId: string, recordId: string): Promise<void> {
  const record = await getRecord(userId, recordId);
  if (record) {
    if (record.imageRef) {
      try { await deleteObject(ref(storage, record.imageRef)); } catch {}
    }
    if (record.pdfRef) {
      try { await deleteObject(ref(storage, record.pdfRef)); } catch {}
    }
  }
  await deleteDoc(doc(recordsCollection(userId), recordId));
}

export async function uploadRecordFile(
  userId: string,
  recordId: string,
  file: Blob,
  filename: string,
): Promise<string> {
  const path = `medical-records/${userId}/${recordId}/${filename}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return path;
}

export async function getFileDownloadUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

export async function getRecentMedicationsContext(userId: string): Promise<string> {
  const records = await getRecords(userId, 'prescription');
  if (!records.length) return '';

  return records.slice(0, 10).map((r) => {
    const dateStr = r.date?.toDate?.() ? r.date.toDate().toLocaleDateString('en-IN') : 'Unknown date';
    const meds = r.medications.map((m) => `${m.name} ${m.dosage} (${m.frequency}, ${m.duration})`).join('; ');
    return `[${dateStr}] ${r.title} | Vet: ${r.vetName} | Meds: ${meds || 'None'} | Instructions: ${r.instructions || 'None'}`;
  }).join('\n');
}
