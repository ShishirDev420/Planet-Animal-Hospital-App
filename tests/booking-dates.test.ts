import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingQuickDate, indiaCalendarDate } from '../src/lib/bookingDates.js';

test('booking dates use India day boundaries even when the viewer is elsewhere', () => {
  assert.equal(indiaCalendarDate(new Date('2026-09-24T18:29:59Z')), '2026-09-24');
  assert.equal(indiaCalendarDate(new Date('2026-09-24T18:30:00Z')), '2026-09-25');
  assert.equal(bookingQuickDate(1, new Date('2026-09-30T18:29:59Z')).value, '2026-10-01');
  assert.equal(bookingQuickDate(0, new Date('2026-12-31T18:30:00Z')).value, '2027-01-01');
});
