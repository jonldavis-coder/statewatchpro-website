export const SALE_BADGE = "Limited-time 50% off";

export const MEMBER_PLANS = [
  {
    id: "trial",
    name: "One-week trial",
    sale: "$64",
    regular: "$129",
    cadence: "7 days · 1 user",
    seats: false,
    blurb: "7 days of access for one user across the states StateWatchPro covers. The quarterly report, the quarterly webinar, and the yearly free FOIA request are not included. The trial fee is credited toward an annual plan bought within 7 days.",
  },
  {
    id: "monthly",
    name: "Monthly",
    sale: "$99",
    regular: "$199",
    cadence: "per user / month",
    seats: true,
    blurb: "Alerts, digests, and the member desk, billed monthly per seat. Monthly membership does not include the quarterly report, the quarterly webinar, or the yearly free FOIA request.",
  },
  {
    id: "annual",
    name: "Annual",
    sale: "$999",
    regular: "$1,999",
    cadence: "per user / year",
    seats: true,
    blurb: "The full desk plus the quarterly State Government Trends Report, the quarterly webinar, and one free FOIA request per year.",
  },
];

export const FOIA_PRODUCTS = [
  {
    id: "foia",
    name: "FOIA filing",
    sale: "$199",
    cadence: "per request",
    blurb: "Legal staff draft, submit, confirm receipt, and track one FOIA request. The request is sent from our parent company, so your company information is not disclosed.",
  },
  {
    id: "foia5",
    name: "FOIA 5-pack",
    sale: "$899",
    cadence: "5 requests",
    blurb: "Five FOIA filings, each drafted, submitted, receipt-confirmed, and tracked. Credits stay on your account until you use them.",
  },
];

export function checkoutSpec(planId, seats, prices) {
  if (planId === "trial") return { price: prices.trial, mode: "payment", quantity: 1 };
  if (planId === "monthly") return { price: prices.monthly, mode: "subscription", quantity: seats };
  if (planId === "annual") return { price: prices.annual, mode: "subscription", quantity: seats };
  if (planId === "foia") return { price: prices.foia, mode: "payment", quantity: 1 };
  if (planId === "foia5") return { price: prices.foia5, mode: "payment", quantity: 1 };
  return null;
}

export function parseSeats(value, planId) {
  if (planId === "trial" || planId === "foia" || planId === "foia5") return 1;
  const seats = Number(value);
  if (!Number.isInteger(seats) || seats < 1 || seats > 200) return null;
  return seats;
}
