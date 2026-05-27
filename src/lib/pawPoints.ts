import { collection, addDoc, updateDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { isPreviewDemoMode } from './demoMode';

export const CLINIC_WHATSAPP = '919004290923';
export const CLINIC_PHONE = '9004290923';
export const CLINIC_TEL_URL = `tel:+91${CLINIC_PHONE}`;

const PAW_POINT_TO_INR = 0.25;
const FREE_GENERAL_CHECKUP_POINTS = 500;

export type BookingService = {
  id: number;
  name: string;
  points: number;
};

export const PAWLINA_SERVICES: BookingService[] = [
  { id: 1, name: 'General Checkup', points: 1000 },
  { id: 2, name: 'Full Grooming', points: 800 },
  { id: 3, name: 'Vaccinations', points: 750 },
  { id: 4, name: 'Ear Cleaning', points: 200 },
  { id: 5, name: 'Haircut', points: 200 },
];

export function getPointsMultiplier(plan: string | undefined | null): number {
  switch (plan?.toLowerCase()) {
    case 'essential': return 1;
    case 'advanced': return 1.5;
    case 'premium':
    case 'prestige': return 2;
    case 'free': return 0;
    default: return 0;
  }
}

export function getProfilePlan(profile: any): string {
  return profile?.currentPlan || profile?.petProfile?.currentPlan || 'free';
}

function isGeneralCheckupService(service: BookingService): boolean {
  const name = service.name.toLowerCase().replace(/check-up/g, 'checkup');
  return name.includes('checkup') && (name.includes('general') || name.includes('wellness'));
}

export function calculateBookingPoints(
  services: BookingService[],
  plan: string | undefined | null,
): number {
  if ((plan || 'free').toLowerCase() === 'free') {
    return services.some(isGeneralCheckupService)
      ? FREE_GENERAL_CHECKUP_POINTS
      : 0;
  }

  const base = services.reduce((sum, s) => sum + s.points, 0);
  return base * getPointsMultiplier(plan);
}

export function calculateINRValue(points: number): number {
  return points * PAW_POINT_TO_INR;
}

export function formatINR(points: number): string {
  return '₹' + calculateINRValue(points).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildWhatsAppMessage(
  parentName: string,
  petName: string,
  services: string[],
  date: string,
  time: string,
): string {
  const serviceNamesText = services.length > 0 ? services.join(', ') : '';
  return `Hey Planet Animal Hospital team! I am ${parentName}, ${petName}'s parent. I would like to book an appointment for: ${serviceNamesText} on ${date} at ${time}. Please get back to me as soon as you see this message. Thank you!`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string): void {
  window.open(buildWhatsAppUrl(message), '_blank');
}

export function callClinic(): void {
  window.location.href = CLINIC_TEL_URL;
}

export interface AppointmentRequest {
  id: string;
  userId: string;
  patient: string;
  reason: string;
  date: string;
  time: string;
  points: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: unknown;
}

export async function createBookingRequest(
  userId: string,
  patient: string,
  reason: string,
  date: string,
  time: string,
  points: number,
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'requests'), {
      userId,
      patient,
      reason,
      date,
      time,
      points,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to create booking request:', error);
    return null;
  }
}

export async function awardPendingPoints(
  userId: string,
  parentName: string,
  petName: string,
  serviceName: string,
  points: number,
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'pointsQueue'), {
      userId,
      parent: parentName,
      pet: petName,
      service: serviceName,
      points,
      status: 'pending',
      actionId: `booking-${Date.now()}`,
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to award pending points:', error);
    return null;
  }
}

export async function cancelBookingRequest(requestId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'requests', requestId);
    await updateDoc(docRef, { status: 'cancelled' });
    return true;
  } catch (error) {
    console.error('Failed to cancel booking request:', error);
    return false;
  }
}

export async function rescheduleBookingRequest(
  requestId: string,
  newDate: string,
  newTime: string,
): Promise<boolean> {
  try {
    const docRef = doc(db, 'requests', requestId);
    await updateDoc(docRef, { date: newDate, time: newTime });
    return true;
  } catch (error) {
    console.error('Failed to reschedule booking request:', error);
    return false;
  }
}

export async function getUserBookings(
  userId: string,
): Promise<AppointmentRequest[]> {
  try {
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('userId', '==', userId),
      where('status', '!=', 'cancelled'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AppointmentRequest[];
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    return [];
  }
}

export function getCurrentUserBookingSupport(): {
  userId: string;
  isDemo: boolean;
  parentName: string;
  petName: string;
} | null {
  const currentUser = auth.currentUser;
  const isDemo = isPreviewDemoMode(window.location.search, window.location.pathname);

  if (isDemo) {
    const saved = localStorage.getItem('planet_animal_demo_profile');
    const profile = saved ? JSON.parse(saved) : null;
    return {
      userId: 'demo-user',
      isDemo: true,
      parentName: profile?.parentName || 'Pet Parent',
      petName: profile?.petName || profile?.name || 'Pet',
    };
  }

  if (!currentUser) return null;

  return {
    userId: currentUser.uid,
    isDemo: false,
    parentName: currentUser.displayName || 'Pet Parent',
    petName: 'Pet',
  };
}
