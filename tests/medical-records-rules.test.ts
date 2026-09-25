import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, deleteDoc, where } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Firestore emulator required; refusing to test production.');

const manualRecord = (changes: Record<string, unknown> = {}) => ({
  type: 'vaccine', title: 'Synthetic vaccine record', date: Timestamp.fromDate(new Date('2026-09-01')),
  vetName: '', clinicName: '', description: 'Synthetic test data', tags: [],
  imageRef: '', pdfRef: '', ocrRawText: '', medications: [], instructions: '',
  diagnosis: '', followUpDate: '', appointmentId: null, verified: false,
  createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...changes,
});

test('medical records: owner and trusted staff reads; parent-only manual writes; clinical fields immutable', async () => {
  for (const file of ['firestore.rules', '../live-medical-records.rules']) {
    const environment = await initializeTestEnvironment({
      projectId: 'demo-planet-care',
      firestore: { host: '127.0.0.1', port: 8088, rules: readFileSync(resolve(file), 'utf8') },
    });
    try {
      await environment.clearFirestore();
      const owner = environment.authenticatedContext('parent').firestore();
      const outsider = environment.authenticatedContext('other').firestore();
      const vet = environment.authenticatedContext('vet', { clinicId: 'planet-animal', clinicRole: 'veterinarian' }).firestore();
      const coordinator = environment.authenticatedContext('coordinator', { clinicId: 'planet-animal', clinicRole: 'coordinator' }).firestore();
      const fakeVet = environment.authenticatedContext('fake', { clinicId: 'other', clinicRole: 'veterinarian' }).firestore();
      const anonymous = environment.unauthenticatedContext().firestore();
      const path = 'users/parent/medicalRecords/manual-1';
      const ownerRecord = doc(owner, path);

      await assertSucceeds(setDoc(ownerRecord, manualRecord()));
      await assertSucceeds(getDoc(ownerRecord));
      await assertSucceeds(getDocs(query(collection(owner, 'users/parent/medicalRecords'), orderBy('date', 'desc'))));
      await assertSucceeds(getDocs(query(collection(owner, 'users/parent/medicalRecords'), where('type', '==', 'vaccine'))));
      await assertSucceeds(getDoc(doc(vet, path)));
      await assertSucceeds(getDocs(collection(coordinator, 'users/parent/medicalRecords')));
      await assertFails(getDoc(doc(outsider, path)));
      await assertFails(getDocs(collection(outsider, 'users/parent/medicalRecords')));
      await assertFails(getDoc(doc(anonymous, path)));
      await assertFails(getDoc(doc(fakeVet, path)));
      await assertFails(setDoc(doc(outsider, 'users/parent/medicalRecords/foreign'), manualRecord()));
      await assertFails(setDoc(doc(vet, 'users/parent/medicalRecords/staff-write'), manualRecord()));

      await assertFails(setDoc(doc(owner, 'users/parent/medicalRecords/forged'), manualRecord({ verified: true })));
      await assertFails(setDoc(doc(owner, 'users/parent/medicalRecords/prescription'), manualRecord({ type: 'prescription' })));
      await assertFails(setDoc(doc(owner, 'users/parent/medicalRecords/extra'), manualRecord({ careApproved: true })));
      await assertFails(updateDoc(ownerRecord, { verified: true, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(ownerRecord, { appointmentId: 'made-up', updatedAt: serverTimestamp() }));
      await assertSucceeds(updateDoc(ownerRecord, { title: 'Updated synthetic record', updatedAt: serverTimestamp() }));

      await environment.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'users/parent/medicalRecords/verified'), {
          ...manualRecord(), verified: true, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
        });
      });
      await assertFails(deleteDoc(doc(owner, 'users/parent/medicalRecords/verified')));
      await assertFails(updateDoc(doc(owner, 'users/parent/medicalRecords/verified'), { title: 'Forgery' }));
      await assertSucceeds(deleteDoc(ownerRecord));
      assert.equal((await getDoc(ownerRecord)).exists(), false);
    } finally {
      await environment.cleanup();
    }
  }
});
