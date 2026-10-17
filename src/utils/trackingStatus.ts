/**
 * Shared tracking status normalization, timeline derivation, and ST Courier event mappings.
 * Used by both Customer Order Details and Track Order screens.
 */

export type DeliveryMilestone =
  | 'placed'
  | 'confirmed'
  | 'shipped'          // In Transit while package travels
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_attempt' // Unsuccessful delivery attempt
  | 'cancelled'
  | 'return';

export interface NormalizedTrackingEvent {
  eventId?: string;
  statusCode: string;
  statusText: string;
  plainDescription: string;
  rawStatus: string;
  location: string;
  date: Date | null;
  formattedDate: string;
  isLatest?: boolean;
}

export interface TrackingStep {
  step: number;        // 0 to 4
  title: string;       // Order Placed, Confirmed, Shipped/In Transit, Out for Delivery, Delivered
  statusKey: DeliveryMilestone;
  completed: boolean;
  current: boolean;
  timestamp: string | null;  // Only real timestamps, never fabricated
  description: string | null;
}

export interface TrackingSummary {
  milestone: DeliveryMilestone;
  currentStepIndex: number;  // 0 to 4 (-1 for cancelled/return)
  headline: string;
  subheadline: string;
  latestLocation: string | null;
  lastUpdatedFormatted: string | null;
  expectedDeliveryDate: string | null; // Only if supplied by API
  steps: TrackingStep[];
  events: NormalizedTrackingEvent[];
  courierName: string;
  awbNo: string | null;
  isDelivered: boolean;
  isOutForDelivery: boolean;
  isInTransit: boolean;
  isUnsuccessfulAttempt: boolean;
  isReturnFlow: boolean;
  isCancelled: boolean;
}

/** Known ST Courier status codes and aliases */
export const ST_STATUS_ALIASES: Record<string, string> = {
  INTRANSIT: 'INT',
  TRANSIT: 'INT',
  IT: 'INT',
  BOOKED: 'BK',
  OUTFORDELIVERY: 'DRS',
  TD: 'DRS',
  DELIVERED: 'DLV',
  UNDELIVERED: 'UD',
  RTOINTRANSIT: 'RINT',
  RTOOUTFORDELIVERY: 'RDRS',
  RTODELIVERED: 'RDL',
  RETURNTODELIVERY: 'RDL',
};

/** Plain-language customer-facing translations for technical courier descriptions */
export const COURIER_PLAIN_DESCRIPTIONS: Record<string, string> = {
  BK: 'Shipment booked with courier and prepared for pickup',
  INT: 'Package forwarded to the next courier facility',
  IT: 'Package forwarded to the next courier facility',
  DRS: 'Package is out for delivery with local courier executive',
  TD: 'Package is out for delivery with local courier executive',
  DLV: 'Package delivered successfully',
  UD: 'Delivery attempt was unsuccessful; rescheduling underway',
  RTO: 'Package return to origin has been initiated',
  RINT: 'Package in transit returning to origin facility',
  RDRS: 'Package out for return delivery to sender',
  RDL: 'Package returned to sender',
  AD: 'Delivery delayed: Address clarification required by courier',
  DL: 'Delivery attempt unsuccessful: Premise locked',
  HD: 'Delivery paused: Regional public holiday',
  PO: 'Delivery rescheduled: Customer requested later delivery',
  PS: 'Delivery delayed: Customer address change noted',
  WN: 'Delivery delayed: Contact number could not be reached',
  OD: 'Shipment held at branch for pickup',
  SH: 'Shipment check in progress at sorting facility',
  TU: 'Office hours ended; delivery will be attempted on next working day',
  DG: 'Shipment inspection in progress at courier center',
  ID: 'Government ID verification required for package handover',
  HO: 'Package securely held at local delivery hub',
  SI: 'Transit clearance processing at regional hub',
  MM: 'Package route updated; moving toward correct destination hub',
  RF: 'Consignee verification required by delivery team',
  CN: 'Delivery attempt: Consignee phone call was unanswered',
  IS: 'Documentation verification in progress',
  DR: 'Delivery rescheduled per customer request',
  HF: 'Partial return processing at facility',
  OA: 'Package arriving at outer regional delivery hub',
  HR: 'Delivery delay due to severe weather / heavy rain',
  VD: 'Transit delay due to courier vehicle transit schedule',
  HS: 'Shipment safely stored at courier service center',
  RH: 'Delivery rescheduled: Business/office premises closed',
  PD: 'Partial shipment delivered; remainder in transit',
  HT: 'Package queued for regional transit connection',
  NR: 'Awaiting package handover at hub',
  HL: 'Transit delayed due to load arrival schedule',
  WU: 'Package assigned to courier delivery agent',
  TS: 'Package in transshipment to regional hub',
  HA: 'Hub clearance check completed',
  DT: 'Customs / local clearance in progress',
  AG: 'Dispatched to remote area delivery network',
  CF: 'Awaiting consignee clearance response',
  ND: 'Courier requested alternate contact number',
  CR: 'Consignee not reachable by local hub',
  CU: 'Local courier agent dispatched for delivery',
  CE: 'Clearance event logged by courier',
};

/** Normalize ST Courier status codes and text labels */
export function normalizeCourierStatusCode(codeOrStatus?: string | null): string {
  if (!codeOrStatus) return '';
  const trimmed = String(codeOrStatus).trim().toUpperCase();
  const aliasKey = trimmed.replace(/[\s_-]+/g, '');
  return ST_STATUS_ALIASES[aliasKey] || trimmed;
}

/** Translate technical status codes or status strings into plain English */
export function getPlainCourierDescription(rawCodeOrDesc?: string | null): string {
  if (!rawCodeOrDesc) return 'Status update logged';
  const norm = normalizeCourierStatusCode(rawCodeOrDesc);
  if (COURIER_PLAIN_DESCRIPTIONS[norm]) {
    return COURIER_PLAIN_DESCRIPTIONS[norm];
  }
  const s = String(rawCodeOrDesc).toLowerCase();
  if (s.includes('deliver') && !s.includes('un') && !s.includes('out') && !s.includes('fail')) {
    return 'Package delivered successfully';
  }
  if (s.includes('out for delivery') || s === 'drs' || s === 'td') {
    return 'Package is out for delivery with local courier executive';
  }
  if (s.includes('transit') || s === 'int' || s === 'it') {
    return 'Package forwarded to the next courier facility';
  }
  if (s.includes('book') || s === 'bk') {
    return 'Shipment booked with courier and prepared for pickup';
  }
  if (s.includes('unsuccessful') || s.includes('undelivered') || s.includes('not delivered') || s === 'ud') {
    return 'Delivery attempt was unsuccessful; rescheduling underway';
  }
  if (s.includes('return') || s.includes('rto') || s === 'rdl') {
    return 'Shipment return process initiated';
  }
  return rawCodeOrDesc;
}

/**
 * Parses timestamps with ST Courier Indian Standard Time (IST +05:30) offset support.
 * Offsetless timestamps (e.g. "2026-09-06 10:00:00") are parsed as IST.
 */
export function parseCourierDate(value?: string | number | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Local offsetless format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  const localMatch = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)$/.exec(trimmed);
  const iso = localMatch ? `${localMatch[1]}T${localMatch[2]}+05:30` : trimmed;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** Formats date into Asia/Kolkata human-readable string */
export function formatIndianDateTime(dateOrStr?: string | number | Date | null): string {
  const d = parseCourierDate(dateOrStr);
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Clean courier location string (removes facility code prefixes and capitalizes) */
export function cleanLocationName(location?: string | null): string {
  if (!location) return '';
  const cleaned = String(location)
    .replace(/^[A-Z0-9]+-/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(' ')
    .map((word) => {
      if (word.toLowerCase() === 'hub') return 'Hub';
      if (word.toUpperCase() === 'ST') return 'ST';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Sort events newest first, filter invalid/duplicates, and parse timestamps */
export function sortAndDeduplicateEvents(rawEvents?: any[]): NormalizedTrackingEvent[] {
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) return [];

  const parsedEvents = rawEvents
    .map((ev: any, idx: number) => {
      const rawCode = ev.statusCode || ev.status_code || ev.status || ev.Status || ev.Activity || '';
      const normCode = normalizeCourierStatusCode(rawCode);
      const rawText = ev.status || ev.Status || ev.trans_for || ev.Activity || normCode;
      const rawLocation = ev.location || ev.Location || ev.trans_from || ev.trans_to || ev.city || '';
      const location = cleanLocationName(rawLocation);
      const dateVal = ev.date || ev.DateTime || ev.time || ev.trans_dtm || ev.timestamp || null;
      const date = parseCourierDate(dateVal);

      return {
        eventId: ev.eventId || String(idx),
        statusCode: normCode,
        statusText: normCode || rawText,
        plainDescription: getPlainCourierDescription(rawCode || rawText),
        rawStatus: String(rawText),
        location,
        date,
        formattedDate: date ? formatIndianDateTime(date) : '',
      };
    })
    .filter((ev) => ev.statusCode || ev.rawStatus);

  // Sort descending by date (latest first). Undated events go to the bottom.
  parsedEvents.sort((a, b) => {
    const tA = a.date ? a.date.getTime() : 0;
    const tB = b.date ? b.date.getTime() : 0;
    return tB - tA;
  });

  // Filter exact duplicates (same normalized status code, same location, same timestamp)
  const uniqueEvents: NormalizedTrackingEvent[] = [];
  for (const ev of parsedEvents) {
    const isDuplicate = uniqueEvents.some((u) => {
      const sameCode = u.statusCode === ev.statusCode;
      const sameLoc = u.location.toLowerCase() === ev.location.toLowerCase();
      const sameTime =
        (u.date && ev.date && u.date.getTime() === ev.date.getTime()) ||
        (!u.date && !ev.date);
      return sameCode && sameLoc && sameTime;
    });
    if (!isDuplicate) {
      uniqueEvents.push(ev);
    }
  }

  // Mark latest event
  if (uniqueEvents.length > 0) {
    uniqueEvents[0].isLatest = true;
  }

  return uniqueEvents;
}

/** Identify courier name cleanly */
export function identifyCourierPartner(order?: any, tracking?: any, awbNo?: string): string {
  const candidates = [
    order?.courierPartner,
    order?.courierName,
    tracking?.courierName,
    tracking?.courierPartner,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      if (/st\s*courier/i.test(c)) return 'ST Courier';
      return c.trim();
    }
  }
  const cleanAwb = String(awbNo || order?.awbNo || tracking?.awbno || '').trim();
  // ST Courier standard numerical AWB format (e.g. 53048275210) or ST prefix
  if (/^530\d{6,9}$/.test(cleanAwb) || /^ST/i.test(cleanAwb)) {
    return 'ST Courier';
  }
  return 'ST Courier';
}

/**
 * Derives consistent milestone and 5-step timeline for both screens.
 * Steps:
 * 0: Order Placed
 * 1: Confirmed
 * 2: Shipped (highlighted as "In Transit" while traveling)
 * 3: Out for Delivery
 * 4: Delivered
 */
export function deriveMilestoneAndSteps(order?: any, tracking?: any): TrackingSummary {
  const rawEvents =
    tracking?.result ||
    tracking?.events ||
    tracking?.tracking_details ||
    order?.trackingHistory ||
    [];

  const events = sortAndDeduplicateEvents(rawEvents);
  const latestEvent = events.length > 0 ? events[0] : null;

  const awbNo =
    tracking?.awbno ||
    tracking?.awbNo ||
    order?.awbNo ||
    null;

  const courierName = identifyCourierPartner(order, tracking, awbNo || undefined);

  // Normalized order fulfillment status and courier shipping status
  const orderStatus = String(order?.status || tracking?.status || '').toLowerCase().trim();
  const shippingStatus = String(
    tracking?.shippingStatus ||
      order?.shippingStatus ||
      tracking?.statusCode ||
      order?.courierMeta?.lastWebhookStatusCode ||
      ''
  ).toLowerCase().trim();

  const latestStatusCode = latestEvent?.statusCode || normalizeCourierStatusCode(shippingStatus);

  // Return flow detection
  const isReturnFlow =
    orderStatus === 'returned' ||
    orderStatus === 'return' ||
    shippingStatus.includes('return') ||
    shippingStatus.includes('rto') ||
    ['RTO', 'RINT', 'RDRS', 'RUD', 'RDL'].includes(latestStatusCode) ||
    events.some((e) => ['RTO', 'RINT', 'RDRS', 'RUD', 'RDL'].includes(e.statusCode));

  // Cancellation detection
  const isCancelled = orderStatus === 'cancelled' || shippingStatus === 'cancelled';

  // Delivery attempt detection (unsuccessful)
  const isUnsuccessfulAttempt =
    latestStatusCode === 'UD' ||
    latestEvent?.rawStatus.toLowerCase().includes('unsuccessful') ||
    latestEvent?.rawStatus.toLowerCase().includes('undelivered') ||
    shippingStatus.includes('unsuccessful') ||
    shippingStatus.includes('undelivered');

  // Find earliest event for timestamps
  const getEventTime = (codePrefixes: string[]): string | null => {
    // Find chronologically earliest event matching any of codePrefixes
    const matches = events
      .filter((e) => codePrefixes.includes(e.statusCode))
      .filter((e) => e.date != null);
    if (matches.length === 0) return null;
    matches.sort((a, b) => a.date!.getTime() - b.date!.getTime());
    return matches[0].formattedDate;
  };

  const placedTimestamp = order?.createdAt ? formatIndianDateTime(order.createdAt) : null;
  const confirmedTimestamp = order?.confirmedAt ? formatIndianDateTime(order.confirmedAt) : null;
  const shippedTimestamp = getEventTime(['BK', 'INT', 'IT']) || (orderStatus === 'shipped' || orderStatus === 'delivered' ? formatIndianDateTime(order?.updatedAt) : null);
  const outForDeliveryTimestamp = getEventTime(['DRS', 'TD']);
  const deliveredTimestamp = getEventTime(['DLV']) || (orderStatus === 'delivered' ? formatIndianDateTime(order?.updatedAt) : null);

  // Determine highest forward milestone reached
  let currentStepIndex = 0;
  let milestone: DeliveryMilestone = 'placed';

  if (isCancelled) {
    milestone = 'cancelled';
    currentStepIndex = -1;
  } else if (isReturnFlow) {
    milestone = 'return';
    currentStepIndex = -1;
  } else if (
    orderStatus === 'delivered' ||
    latestStatusCode === 'DLV' ||
    shippingStatus === 'delivered' ||
    events.some((e) => e.statusCode === 'DLV')
  ) {
    milestone = 'delivered';
    currentStepIndex = 4;
  } else if (
    isUnsuccessfulAttempt
  ) {
    milestone = 'delivery_attempt';
    currentStepIndex = 3;
  } else if (
    latestStatusCode === 'DRS' ||
    latestStatusCode === 'TD' ||
    shippingStatus.includes('out for delivery') ||
    events.some((e) => e.statusCode === 'DRS' || e.statusCode === 'TD')
  ) {
    milestone = 'out_for_delivery';
    currentStepIndex = 3;
  } else if (
    latestStatusCode === 'INT' ||
    latestStatusCode === 'IT' ||
    latestStatusCode === 'BK' ||
    shippingStatus.includes('in transit') ||
    shippingStatus.includes('booked') ||
    orderStatus === 'shipped' ||
    events.some((e) => ['INT', 'IT', 'BK'].includes(e.statusCode))
  ) {
    milestone = 'shipped';
    currentStepIndex = 2;
  } else if (
    orderStatus === 'processing' ||
    orderStatus === 'confirmed' ||
    orderStatus === 'paid'
  ) {
    milestone = 'confirmed';
    currentStepIndex = 1;
  } else {
    milestone = 'placed';
    currentStepIndex = 0;
  }

  // Generate the 5 unified steps
  const steps: TrackingStep[] = [
    {
      step: 0,
      title: 'Order Placed',
      statusKey: 'placed',
      completed: currentStepIndex >= 0 && !isCancelled,
      current: currentStepIndex === 0,
      timestamp: placedTimestamp,
      description: placedTimestamp ? `Order received on ${placedTimestamp}` : 'Order received',
    },
    {
      step: 1,
      title: 'Confirmed',
      statusKey: 'confirmed',
      completed: currentStepIndex >= 1,
      current: currentStepIndex === 1,
      timestamp: confirmedTimestamp,
      description: currentStepIndex >= 1 ? 'Order verified and packed by Prabha Tex' : 'Awaiting confirmation',
    },
    {
      step: 2,
      // While package is travelling, highlight Shipped with the label "In Transit"
      title: currentStepIndex === 2 ? 'In Transit' : 'Shipped',
      statusKey: 'shipped',
      completed: currentStepIndex >= 2,
      current: currentStepIndex === 2,
      timestamp: shippedTimestamp,
      description: currentStepIndex >= 2
        ? awbNo
          ? `Dispatched with ${courierName} (AWB: ${awbNo})`
          : 'Package dispatched'
        : 'Preparing for courier dispatch',
    },
    {
      step: 3,
      title: 'Out for Delivery',
      statusKey: 'out_for_delivery',
      completed: currentStepIndex >= 3 && !isUnsuccessfulAttempt,
      current: currentStepIndex === 3,
      timestamp: outForDeliveryTimestamp,
      description: isUnsuccessfulAttempt
        ? 'Delivery attempt was unsuccessful; rescheduling underway'
        : currentStepIndex >= 3
        ? 'Courier delivery agent is en route to your address'
        : 'Awaiting arrival at local delivery hub',
    },
    {
      step: 4,
      title: 'Delivered',
      statusKey: 'delivered',
      completed: currentStepIndex === 4,
      current: currentStepIndex === 4,
      timestamp: deliveredTimestamp,
      description: currentStepIndex === 4
        ? 'Package delivered successfully'
        : 'Final delivery to customer address',
    },
  ];

  // Prominent Status Summary Card headline & subheadline
  let headline = 'Your order has been placed.';
  let subheadline = 'We are processing your order details.';

  if (isCancelled) {
    headline = 'Your order has been cancelled.';
    subheadline = 'This order has been cancelled. Please contact support if you have questions.';
  } else if (isReturnFlow) {
    headline = 'Your package is returning to sender.';
    subheadline = 'Return transit is in progress. Our support team will update you.';
  } else if (milestone === 'delivered') {
    headline = 'Your package has been delivered.';
    subheadline = 'Delivered to your address. Thank you for shopping with Prabha Tex!';
  } else if (milestone === 'delivery_attempt') {
    headline = 'Delivery attempt was unsuccessful.';
    subheadline = 'The courier was unable to complete delivery and will reattempt soon.';
  } else if (milestone === 'out_for_delivery') {
    headline = 'Your package is out for delivery.';
    subheadline = 'The delivery executive is on the way to your shipping address.';
  } else if (milestone === 'shipped') {
    headline = 'Your package is on the way.';
    subheadline = `In transit with ${courierName}.`;
  } else if (milestone === 'confirmed') {
    headline = 'Your order has been confirmed.';
    subheadline = 'Your order has been verified and is being packed for courier pickup.';
  }

  // Latest Location
  const latestLocation = latestEvent?.location || (events.length > 0 ? events[0].location : null);

  // Last Updated timestamp
  const lastUpdatedRaw =
    latestEvent?.date ||
    parseCourierDate(tracking?.lastSyncAt) ||
    parseCourierDate(order?.updatedAt);
  const lastUpdatedFormatted = lastUpdatedRaw ? formatIndianDateTime(lastUpdatedRaw) : null;

  // Expected Delivery Date: ONLY if supplied by API, NEVER invented
  const rawExpected =
    tracking?.expectedDeliveryDate ||
    order?.expectedDeliveryDate ||
    tracking?.estimatedDeliveryDate ||
    null;
  const expectedDeliveryDate = rawExpected ? formatIndianDateTime(rawExpected) : null;

  return {
    milestone,
    currentStepIndex,
    headline,
    subheadline,
    latestLocation: latestLocation && latestLocation.trim() ? latestLocation.trim() : null,
    lastUpdatedFormatted,
    expectedDeliveryDate,
    steps,
    events,
    courierName,
    awbNo: awbNo ? String(awbNo).trim() : null,
    isDelivered: milestone === 'delivered',
    isOutForDelivery: milestone === 'out_for_delivery',
    isInTransit: milestone === 'shipped',
    isUnsuccessfulAttempt,
    isReturnFlow,
    isCancelled,
  };
}
