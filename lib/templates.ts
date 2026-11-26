export type ColumnLabels = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

export type ExtraField = { key: string; label: string; placeholder?: string };

export type SampleItem = {
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceTemplate = {
  id: string;
  name: string;
  description: string;
  title: string;
  accent: string; // hex colour used on preview + PDF
  columnLabels: ColumnLabels;
  extraFields: ExtraField[];
  sampleItems: SampleItem[];
  notes?: string;
  terms?: string;
};

export const TEMPLATES: InvoiceTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "A clean general-purpose invoice.",
    title: "Invoice",
    accent: "#334155",
    columnLabels: { description: "Item", quantity: "Qty", unitPrice: "Rate", amount: "Amount" },
    extraFields: [],
    sampleItems: [{ description: "", quantity: 1, unitPrice: 0 }],
  },
  {
    id: "developer",
    name: "Software Developer",
    description: "Hourly development work billed by task.",
    title: "Invoice",
    accent: "#4f46e5",
    columnLabels: { description: "Task", quantity: "Hours", unitPrice: "Hourly rate", amount: "Amount" },
    extraFields: [
      { key: "project", label: "Project", placeholder: "Mobile app v2" },
      { key: "sprint", label: "Sprint / milestone", placeholder: "Sprint 14" },
      { key: "repository", label: "Repository", placeholder: "github.com/acme/app" },
    ],
    sampleItems: [
      { description: "Feature development", details: "User authentication and profile screens", quantity: 24, unitPrice: 95 },
      { description: "Bug fixes", details: "Issues #112, #118, #121", quantity: 6, unitPrice: 95 },
      { description: "Code review and deployment", quantity: 3, unitPrice: 95 },
    ],
    notes: "Thank you for your business.",
    terms: "Payment due within 15 days.",
  },
  {
    id: "web-development",
    name: "Web Development",
    description: "Website design, build, hosting and maintenance.",
    title: "Invoice",
    accent: "#0891b2",
    columnLabels: { description: "Service", quantity: "Qty", unitPrice: "Rate", amount: "Amount" },
    extraFields: [
      { key: "project", label: "Project", placeholder: "Company website redesign" },
      { key: "website", label: "Website URL", placeholder: "https://example.com" },
    ],
    sampleItems: [
      { description: "UI/UX design", details: "Wireframes and 5 page mock-ups", quantity: 1, unitPrice: 1200 },
      { description: "Front-end development", details: "Responsive pages", quantity: 5, unitPrice: 350 },
      { description: "CMS setup and training", quantity: 1, unitPrice: 600 },
      { description: "Hosting and domain (12 months)", quantity: 1, unitPrice: 240 },
    ],
    notes: "Includes 30 days of post-launch support.",
    terms: "50% deposit received. Balance due on launch.",
  },
  {
    id: "travel-agency",
    name: "Travel Agency",
    description: "Trips, bookings and travel packages.",
    title: "Travel Invoice",
    accent: "#ea580c",
    columnLabels: { description: "Booking", quantity: "Travelers", unitPrice: "Price per person", amount: "Amount" },
    extraFields: [
      { key: "traveler", label: "Lead traveler", placeholder: "Jane Doe" },
      { key: "destination", label: "Destination", placeholder: "Cancún, Mexico" },
      { key: "travelDates", label: "Travel dates", placeholder: "Feb 10 – Feb 17, 2027" },
      { key: "bookingRef", label: "Booking reference", placeholder: "ABC123" },
    ],
    sampleItems: [
      { description: "Round-trip flight", details: "YYZ – CUN, economy", quantity: 2, unitPrice: 650 },
      { description: "Hotel, 7 nights", details: "All-inclusive, ocean view", quantity: 2, unitPrice: 1100 },
      { description: "Airport transfers", quantity: 2, unitPrice: 45 },
      { description: "Travel insurance", quantity: 2, unitPrice: 89 },
    ],
    terms: "Final payment is due 45 days before departure. Cancellation fees may apply.",
  },
  {
    id: "consulting-agency",
    name: "Consulting Agency",
    description: "Advisory engagements billed by hour or deliverable.",
    title: "Invoice",
    accent: "#15803d",
    columnLabels: { description: "Service", quantity: "Hours", unitPrice: "Rate", amount: "Amount" },
    extraFields: [
      { key: "engagement", label: "Engagement", placeholder: "Q1 growth strategy" },
      { key: "consultant", label: "Consultant", placeholder: "Your name" },
      { key: "period", label: "Service period", placeholder: "Jan 1 – Jan 31, 2027" },
    ],
    sampleItems: [
      { description: "Strategy sessions", quantity: 8, unitPrice: 175 },
      { description: "Market analysis report", quantity: 1, unitPrice: 2500 },
      { description: "Leadership workshop", details: "Half day, on-site", quantity: 1, unitPrice: 1800 },
    ],
    terms: "Net 30.",
  },
  {
    id: "it-service",
    name: "IT Service",
    description: "Managed IT, support hours and hardware.",
    title: "Invoice",
    accent: "#be123c",
    columnLabels: { description: "Service / product", quantity: "Qty", unitPrice: "Unit price", amount: "Amount" },
    extraFields: [
      { key: "contract", label: "Contract / ticket #", placeholder: "MSP-2027-004" },
      { key: "period", label: "Service period", placeholder: "January 2027" },
      { key: "site", label: "Service location", placeholder: "Head office" },
    ],
    sampleItems: [
      { description: "Managed IT support (monthly)", details: "Up to 25 devices", quantity: 1, unitPrice: 899 },
      { description: "On-site support", details: "Network troubleshooting", quantity: 3, unitPrice: 120 },
      { description: "Business laptop", details: "Including setup", quantity: 2, unitPrice: 1350 },
    ],
    terms: "Payment due within 30 days.",
  },
];

export function getTemplate(id: string | null | undefined): InvoiceTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "MXN", "AUD"];
