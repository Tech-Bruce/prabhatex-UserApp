import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeCourierStatusCode,
  getPlainCourierDescription,
  parseCourierDate,
  formatIndianDateTime,
  cleanLocationName,
  sortAndDeduplicateEvents,
  deriveMilestoneAndSteps,
  identifyCourierPartner,
} from './trackingStatus.ts';

const TEST_AWB = '53048275210';

test('1. Status normalization maps BK, INT, DRS, DLV, UD', () => {
  assert.equal(normalizeCourierStatusCode('BK'), 'BK');
  assert.equal(normalizeCourierStatusCode('Booked'), 'BK');
  assert.equal(normalizeCourierStatusCode('In-Transit'), 'INT');
  assert.equal(normalizeCourierStatusCode('IN TRANSIT'), 'INT');
  assert.equal(normalizeCourierStatusCode('it'), 'INT');
  assert.equal(normalizeCourierStatusCode('DRS'), 'DRS');
  assert.equal(normalizeCourierStatusCode('Out for Delivery'), 'DRS');
  assert.equal(normalizeCourierStatusCode('td'), 'DRS');
  assert.equal(normalizeCourierStatusCode('DLV'), 'DLV');
  assert.equal(normalizeCourierStatusCode('Delivered'), 'DLV');
  assert.equal(normalizeCourierStatusCode('UD'), 'UD');
  assert.equal(normalizeCourierStatusCode('Un Delivered'), 'UD');
});

test('2. Translates technical courier descriptions to customer-friendly plain English', () => {
  assert.equal(
    getPlainCourierDescription('INT'),
    'Package forwarded to the next courier facility'
  );
  assert.equal(
    getPlainCourierDescription('DRS'),
    'Package is out for delivery with local courier executive'
  );
  assert.equal(
    getPlainCourierDescription('DLV'),
    'Package delivered successfully'
  );
  assert.equal(
    getPlainCourierDescription('UD'),
    'Delivery attempt was unsuccessful; rescheduling underway'
  );
  assert.equal(
    getPlainCourierDescription('BK'),
    'Shipment booked with courier and prepared for pickup'
  );
});

test('3. Parses offsetless IST timestamps with +05:30 correctly', () => {
  const d = parseCourierDate('2026-09-06 10:00:00');
  assert.ok(d != null);
  // 10:00 AM IST (+05:30) is 04:30 AM UTC
  assert.equal(d.toISOString(), '2026-09-06T04:30:00.000Z');

  const formatted = formatIndianDateTime('2026-09-06 10:00:00');
  assert.ok(formatted.includes('6 Sept') || formatted.includes('6 Sep'));
  assert.ok(formatted.includes('10:00'));
});

test('4. Cleans courier facility location names', () => {
  assert.equal(cleanLocationName('5304-Chennai Hub'), 'Chennai Hub');
  assert.equal(cleanLocationName('coimbatore hub'), 'Coimbatore Hub');
  assert.equal(cleanLocationName('ST Courier Network'), 'ST Courier Network');
});

test('5. Local fixture AWB 53048275210: INT -> In Transit', () => {
  const order = {
    id: 'ord-71',
    orderNumber: '71',
    status: 'shipped',
    awbNo: TEST_AWB,
    createdAt: '2026-09-05T04:30:00.000Z',
  };
  const tracking = {
    awbno: TEST_AWB,
    shippingStatus: 'In Transit',
    result: [
      {
        statusCode: 'INT',
        location: 'Chennai Hub',
        date: '2026-09-06 10:00:00',
      },
      {
        statusCode: 'BK',
        location: 'Tirupur Origin Hub',
        date: '2026-09-05 18:00:00',
      },
    ],
  };

  const summary = deriveMilestoneAndSteps(order, tracking);
  assert.equal(summary.milestone, 'shipped');
  assert.equal(summary.currentStepIndex, 2);
  assert.equal(summary.headline, 'Your package is on the way.');
  assert.equal(summary.isInTransit, true);
  assert.equal(summary.steps[2].title, 'In Transit'); // highlighted as In Transit while travelling
  assert.equal(summary.steps[2].current, true);
  assert.equal(summary.steps[0].completed, true);
  assert.equal(summary.steps[1].completed, true);
  assert.equal(summary.steps[3].completed, false);
  assert.equal(summary.steps[4].completed, false);
  assert.equal(summary.latestLocation, 'Chennai Hub');
});

test('6. Local fixture AWB 53048275210: DRS -> Out for Delivery', () => {
  const order = {
    id: 'ord-71',
    orderNumber: '71',
    status: 'shipped',
    awbNo: TEST_AWB,
    createdAt: '2026-09-05T04:30:00.000Z',
  };
  const tracking = {
    awbno: TEST_AWB,
    shippingStatus: 'Out for Delivery',
    result: [
      {
        statusCode: 'DRS',
        location: 'Coimbatore Hub',
        date: '2026-09-07 09:30:00',
      },
      {
        statusCode: 'INT',
        location: 'Chennai Hub',
        date: '2026-09-06 10:00:00',
      },
    ],
  };

  const summary = deriveMilestoneAndSteps(order, tracking);
  assert.equal(summary.milestone, 'out_for_delivery');
  assert.equal(summary.currentStepIndex, 3);
  assert.equal(summary.headline, 'Your package is out for delivery.');
  assert.equal(summary.isOutForDelivery, true);
  assert.equal(summary.steps[2].title, 'Shipped'); // previous milestone was Shipped
  assert.equal(summary.steps[2].completed, true);
  assert.equal(summary.steps[3].current, true);
  assert.equal(summary.steps[4].completed, false);
  assert.equal(summary.latestLocation, 'Coimbatore Hub');
});

test('7. Local fixture AWB 53048275210: DLV -> Delivered', () => {
  const order = {
    id: 'ord-71',
    orderNumber: '71',
    status: 'delivered',
    awbNo: TEST_AWB,
    createdAt: '2026-09-05T04:30:00.000Z',
  };
  const tracking = {
    awbno: TEST_AWB,
    shippingStatus: 'Delivered',
    result: [
      {
        statusCode: 'DLV',
        location: 'Coimbatore Destination',
        date: '2026-09-07 14:00:00',
      },
      {
        statusCode: 'DRS',
        location: 'Coimbatore Hub',
        date: '2026-09-07 09:30:00',
      },
    ],
  };

  const summary = deriveMilestoneAndSteps(order, tracking);
  assert.equal(summary.milestone, 'delivered');
  assert.equal(summary.currentStepIndex, 4);
  assert.equal(summary.headline, 'Your package has been delivered.');
  assert.equal(summary.isDelivered, true);
  assert.equal(summary.steps[4].completed, true);
  assert.equal(summary.steps[4].current, true);
  assert.equal(summary.latestLocation, 'Coimbatore Destination');
});

test('8. Older and duplicate events cannot move status backwards', () => {
  const order = {
    id: 'ord-71',
    status: 'shipped',
    awbNo: TEST_AWB,
    createdAt: '2026-09-05T04:30:00.000Z',
  };
  // Events arriving out of order: an older BK event is placed first, but DRS is also present
  const tracking = {
    awbno: TEST_AWB,
    shippingStatus: 'Booked', // older badge in response
    result: [
      {
        statusCode: 'BK',
        location: 'Tirupur Hub',
        date: '2026-09-05 10:00:00',
      },
      {
        statusCode: 'DRS',
        location: 'Coimbatore Hub',
        date: '2026-09-07 09:30:00',
      },
      {
        statusCode: 'BK', // duplicate
        location: 'Tirupur Hub',
        date: '2026-09-05 10:00:00',
      },
    ],
  };

  const summary = deriveMilestoneAndSteps(order, tracking);
  // Status cannot regress back to Booked / Placed; it recognizes DRS
  assert.equal(summary.milestone, 'out_for_delivery');
  assert.equal(summary.currentStepIndex, 3);
  assert.equal(summary.events.length, 2); // duplicate removed
  assert.equal(summary.events[0].statusCode, 'DRS'); // newest first
});

test('9. Unsuccessful delivery attempt is handled distinctly and never marked as Delivered', () => {
  const order = {
    id: 'ord-71',
    status: 'shipped',
    awbNo: TEST_AWB,
  };
  const tracking = {
    awbno: TEST_AWB,
    shippingStatus: 'Un Delivered',
    result: [
      {
        statusCode: 'UD',
        status: 'Delivery Attempt Unsuccessful',
        location: 'Customer Address Door Lock',
        date: '2026-09-07 16:00:00',
      },
      {
        statusCode: 'DRS',
        location: 'Coimbatore Hub',
        date: '2026-09-07 09:00:00',
      },
    ],
  };

  const summary = deriveMilestoneAndSteps(order, tracking);
  assert.equal(summary.isUnsuccessfulAttempt, true);
  assert.equal(summary.isDelivered, false);
  assert.notEqual(summary.currentStepIndex, 4);
  assert.equal(summary.headline, 'Delivery attempt was unsuccessful.');
});

test('10. Fixes case where shipment history has INT but order.status was processing/pending', () => {
  const order = {
    id: 'ord-71',
    status: 'processing', // backend order status hasn't updated yet
    awbNo: TEST_AWB,
    createdAt: '2026-09-05T04:30:00.000Z',
  };
  const tracking = {
    awbno: TEST_AWB,
    result: [
      {
        statusCode: 'INT',
        location: 'Madurai Hub',
        date: '2026-09-06 14:00:00',
      },
    ],
  };

  const summary = deriveMilestoneAndSteps(order, tracking);
  // Must NOT remain at Order Placed (0) or Confirmed (1)! It must advance to In Transit (2)!
  assert.equal(summary.milestone, 'shipped');
  assert.equal(summary.currentStepIndex, 2);
  assert.equal(summary.isInTransit, true);
  assert.equal(summary.headline, 'Your package is on the way.');
});

test('11. Identifies ST Courier for 11-digit AWB 53048275210', () => {
  assert.equal(identifyCourierPartner({}, {}, TEST_AWB), 'ST Courier');
  assert.equal(
    identifyCourierPartner({ courierPartner: 'ST Courier' }),
    'ST Courier'
  );
});
