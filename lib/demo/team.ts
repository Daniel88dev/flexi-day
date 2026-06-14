// Static placeholders used only on the public landing page (avatars + hero calendar preview).
// Authenticated app surfaces use real API data — do not import this from anywhere under app/(app).
import { VacationKind } from "@/lib/api/types";
import type { LeaveTypeKey } from "./leave-meta";

const AV = {
  violet: "linear-gradient(135deg,#8b6ce8,#6d4fd0)",
  coral: "linear-gradient(135deg,#f0916b,#e26d4e)",
  teal: "linear-gradient(135deg,#3fb6a8,#2a8f86)",
  amber: "linear-gradient(135deg,#e9b15a,#d8973a)",
  rose: "linear-gradient(135deg,#ec7a8f,#d65574)",
  green: "linear-gradient(135deg,#74c08a,#4ea36c)",
  blue: "linear-gradient(135deg,#6aa6f0,#477fd6)",
  plum: "linear-gradient(135deg,#b27ad0,#9257b8)",
  sand: "linear-gradient(135deg,#cbb48f,#b39a6e)",
  slate: "linear-gradient(135deg,#8893ad,#69748f)",
};

export interface DemoPerson {
  id: string;
  name: string;
  first: string;
  initials: string;
  role: string;
  group: string;
  av: string;
  me?: boolean;
}

export const DEMO_TEAM: DemoPerson[] = [
  {
    id: "dh",
    name: "Dana Holt",
    first: "Dana",
    initials: "DH",
    role: "Product Lead",
    group: "Product",
    av: AV.violet,
    me: true,
  },
  {
    id: "mr",
    name: "Marco Rossi",
    first: "Marco",
    initials: "MR",
    role: "Staff Engineer",
    group: "Engineering",
    av: AV.teal,
  },
  {
    id: "ak",
    name: "Aisha Khan",
    first: "Aisha",
    initials: "AK",
    role: "Product Designer",
    group: "Design",
    av: AV.coral,
  },
  {
    id: "lo",
    name: "Liam O'Brien",
    first: "Liam",
    initials: "LO",
    role: "Backend Engineer",
    group: "Engineering",
    av: AV.blue,
  },
  {
    id: "sa",
    name: "Sofia Almeida",
    first: "Sofia",
    initials: "SA",
    role: "Brand Marketer",
    group: "Marketing",
    av: AV.rose,
  },
  {
    id: "nw",
    name: "Noah Weber",
    first: "Noah",
    initials: "NW",
    role: "Account Executive",
    group: "Sales",
    av: AV.amber,
  },
  {
    id: "yt",
    name: "Yuki Tanaka",
    first: "Yuki",
    initials: "YT",
    role: "Motion Designer",
    group: "Design",
    av: AV.plum,
  },
  {
    id: "pn",
    name: "Priya Nair",
    first: "Priya",
    initials: "PN",
    role: "People Ops",
    group: "People",
    av: AV.green,
  },
  {
    id: "tb",
    name: "Tom Becker",
    first: "Tom",
    initials: "TB",
    role: "Frontend Engineer",
    group: "Engineering",
    av: AV.slate,
  },
  {
    id: "ep",
    name: "Elena Petrova",
    first: "Elena",
    initials: "EP",
    role: "Product Manager",
    group: "Product",
    av: AV.sand,
  },
];

export const demoById = (id: string): DemoPerson | undefined => DEMO_TEAM.find((p) => p.id === id);

export interface DemoLeave {
  id: string;
  who: string;
  type: LeaveTypeKey;
  from: number;
  to: number;
  note?: string;
}

export const DEMO_LEAVE: DemoLeave[] = [
  { id: "l1", who: "mr", type: VacationKind.Vacation, from: 8, to: 19, note: "Sardinia" },
  { id: "l2", who: "sa", type: VacationKind.Vacation, from: 11, to: 16, note: "Family trip" },
  { id: "l3", who: "lo", type: VacationKind.Sick, from: 9, to: 9, note: "Flu" },
  { id: "l4", who: "ak", type: VacationKind.HomeOffice, from: 15, to: 17, note: "Focus week" },
  { id: "l5", who: "tb", type: VacationKind.HomeOffice, from: 10, to: 10 },
  { id: "l6", who: "tb", type: VacationKind.HomeOffice, from: 17, to: 17 },
  { id: "l7", who: "yt", type: VacationKind.PaidTimeOff, from: 22, to: 23, note: "Long weekend" },
  { id: "l8", who: "nw", type: VacationKind.Vacation, from: 24, to: 30, note: "Wedding" },
  { id: "l9", who: "ep", type: VacationKind.Vacation, from: 29, to: 30 },
  { id: "l10", who: "pn", type: VacationKind.PaidTimeOff, from: 18, to: 18 },
  {
    id: "l11",
    who: "all",
    type: VacationKind.BankHoliday,
    from: 1,
    to: 1,
    note: "Spring Bank Holiday",
  },
  { id: "l12", who: "dh", type: VacationKind.HomeOffice, from: 12, to: 12 },
];

export const DEMO_MONTH = { year: 2026, monthIdx: 5, label: "June 2026", today: 13 };
