import { CareError, type Actor } from './domain.js';
import { normalizeWallet, WALLET_POLICY, type Invoice, type Reservation, type Wallet } from './wallet.js';

export type RedemptionTier = { id: string; points: number; percent: number };
export type RedemptionPolicy = { version: string; basis: 'entire-bill'; status: 'draft' | 'active'; tiers: RedemptionTier[]; approvedBy: string | null; approvedAt: number | null };
export function validateRedemptionPolicy(value: any, actor: Actor, now: number): RedemptionPolicy {
  if (actor.role !== 'manager') throw new CareError(403, 'Manager access is required to configure redemption.');
  if (!value || !/^[\w-]{1,100}$/.test(value.version) || value.basis !== 'entire-bill' || !['draft','active'].includes(value.status) || !Array.isArray(value.tiers) || value.tiers.length > 12) throw new CareError(400, 'Enter a versioned whole-bill discount policy.');
  if (value.status === 'active' && (!value.tiers.length || value.confirmCommercialApproval !== true)) throw new CareError(400, 'Confirm the clinic-approved thresholds and percentages before activation.');
  const ids = new Set<string>(); let lastPoints = 0; let lastPercent = 0;
  const tiers = value.tiers.map((tier: any) => {
    if (!tier || !/^[\w-]{1,50}$/.test(tier.id) || ids.has(tier.id) || !Number.isSafeInteger(tier.points) || tier.points <= lastPoints || tier.points > 100000000 || !Number.isInteger(tier.percent) || tier.percent <= lastPercent || tier.percent > 100) throw new CareError(400, 'Use unique tier IDs, increasing positive whole-point thresholds and increasing percentages up to 100.');
    ids.add(tier.id); lastPoints = tier.points; lastPercent = tier.percent;
    return { id: tier.id, points: tier.points, percent: tier.percent };
  });
  return { version: value.version, basis: 'entire-bill', status: value.status, tiers, approvedBy: value.status === 'active' ? actor.uid : null, approvedAt: value.status === 'active' ? now : null };
}
export function reserveWholeBill(walletValue: Wallet, invoice: Invoice, policy: RedemptionPolicy | null, tierId: string, id: string, invoiceId: string, actor: Actor, now: number) {
  if (!policy || policy.status !== 'active' || !policy.approvedBy) throw new CareError(409, 'The clinic must activate its whole-bill points thresholds before redemption. Your points remain unchanged.');
  const tier = policy.tiers.find(t => t.id === tierId);
  if (!tier) throw new CareError(400, 'Select a listed redemption tier.');
  if (invoice.ownerUid !== actor.uid) throw new CareError(403, 'This invoice belongs to another account.');
  if (invoice.status !== 'open') throw new CareError(409, 'This invoice is not open for redemption.');
  if (!Number.isSafeInteger(invoice.totalPaise) || (!invoice.totalPaise || invoice.totalPaise < 0) || invoice.totalPaise > 100000000) throw new CareError(409, 'Billing staff must record the entire invoice total, including all line items and taxes.');
  const wallet = normalizeWallet(walletValue, now);
  if (wallet.reconciliationRequired || wallet.points - wallet.reservedPoints < tier.points) throw new CareError(409, 'Enough verified, available points are required for this tier.');
  const paise = Math.floor(invoice.totalPaise * tier.percent / 100);
  if (!paise) throw new CareError(400, 'The invoice is too small for this discount.');
  wallet.reservedPoints += tier.points; wallet.monthlyPaise += paise; wallet.revision++;
  const reservation: Reservation = { id, invoiceId, points: tier.points, paise, status:'reserved', expiresAt:now + WALLET_POLICY.reservationMs, month:wallet.month, actorUid:actor.uid, basis:'entire-bill', totalPaise:invoice.totalPaise, percent:tier.percent, tierId, policyVersion:policy.version };
  return { wallet, reservation };
}
