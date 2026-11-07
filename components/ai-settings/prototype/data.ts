// PROTOTYPE (T-680): sample data for the owner settings, usage and AI connections design.
// Lives on prototype/* branches only. Nothing here calls the backend.

export const ORG = "Novák Logistics";
export const OWNER = "Jana Nováková";
/** The prototype's "now": Thursday 12 Nov 2026, 08:52 Prague time, as in the chat prototype. */
export const NOW_LABEL = "Thu 12 Nov, 08:52";
/** Monday 00:00 UTC is 01:00 in Prague in November. */
export const RESET_LABEL = "Monday 16 Nov at 01:00";
export const WEEKLY_LIMIT = 10;

export type Plan = "enterprise" | "pro" | "free";
export type Role = "owner" | "admin";
export type ConnectionsSetting = "off" | "read" | "write";

/** Every state the screens are walked through, `?state=`. */
export const STATES = [
  { key: "on", name: "Enterprise, both on" },
  { key: "first", name: "Enterprise, both off" },
  { key: "limit", name: "Weekly limit reached" },
  { key: "read", name: "AI connections read only" },
  { key: "pro", name: "Pro plan" },
  { key: "free", name: "Free plan" },
  { key: "admin", name: "Org admin, not owner" },
  { key: "fresh", name: "Just turned on, no usage" },
] as const;
export type StateKey = (typeof STATES)[number]["key"];

export type Scenario = {
  plan: Plan;
  role: Role;
  assistant: boolean;
  connections: ConnectionsSetting;
  used: number;
  limitReachedAt: string | null;
  empty: boolean;
};

export function scenario(state: string | null): Scenario {
  const base: Scenario = {
    plan: "enterprise",
    role: "owner",
    assistant: true,
    connections: "write",
    used: 6.42,
    limitReachedAt: null,
    empty: false,
  };
  switch (state as StateKey) {
    case "first":
      return { ...base, assistant: false, connections: "off", used: 0, empty: true };
    case "limit":
      return { ...base, used: 10, limitReachedAt: "Thu 12 Nov at 08:14" };
    case "read":
      return { ...base, connections: "read" };
    case "pro":
      return { ...base, plan: "pro", assistant: false, used: 0 };
    case "free":
      return { ...base, plan: "free", assistant: false, connections: "off", used: 0, empty: true };
    case "admin":
      return { ...base, role: "admin" };
    case "fresh":
      return { ...base, used: 0, empty: true };
    default:
      return base;
  }
}

export type PersonUsage = {
  id: string;
  name: string;
  initials: string;
  /** Settled cost plus open reservations, USD. */
  used: number;
  turns: number;
  rejected: number;
  /** Tool calls from the member's AI connections today. */
  callsToday: number;
  deleted?: boolean;
};

export const PEOPLE: PersonUsage[] = [
  {
    id: "jana",
    name: "Jana Nováková",
    initials: "JN",
    used: 2.18,
    turns: 31,
    rejected: 0,
    callsToday: 212,
  },
  {
    id: "petr",
    name: "Petr Svoboda",
    initials: "PS",
    used: 1.64,
    turns: 24,
    rejected: 1,
    callsToday: 940,
  },
  {
    id: "lucie",
    name: "Lucie Dvořáková",
    initials: "LD",
    used: 1.12,
    turns: 17,
    rejected: 0,
    callsToday: 0,
  },
  {
    id: "tomas",
    name: "Tomáš Černý",
    initials: "TČ",
    used: 0.71,
    turns: 9,
    rejected: 4,
    callsToday: 1000,
  },
  {
    id: "eva",
    name: "Eva Králová",
    initials: "EK",
    used: 0.38,
    turns: 6,
    rejected: 0,
    callsToday: 0,
  },
  {
    id: "deleted",
    name: "Deleted account",
    initials: "",
    used: 0.39,
    turns: 5,
    rejected: 0,
    callsToday: 0,
    deleted: true,
  },
];

export type Week = {
  label: string;
  used: number;
  limitReachedAt?: string;
  /** Per-user weekly totals keep the user for 180 days; older weeks are organization totals only. */
  perUser: boolean;
};

export const PAST_WEEKS: Week[] = [
  { label: "2–8 Nov", used: 8.91, perUser: true },
  { label: "26 Oct–1 Nov", used: 10, limitReachedAt: "Fri 30 Oct, 15:06", perUser: true },
  { label: "19–25 Oct", used: 7.35, perUser: true },
  { label: "12–18 Oct", used: 5.02, perUser: true },
  { label: "5–11 Oct", used: 6.6, perUser: true },
  { label: "28 Sep–4 Oct", used: 3.18, perUser: true },
  { label: "21–27 Sep", used: 2.4, perUser: true },
  { label: "14–20 Sep", used: 1.12, perUser: true },
];

export const OLD_WEEKS_NOTE = "Weeks before 14 May show the organization total only.";

/** External AI apps: tool calls per day against the daily AI connection limit. */
export const DAILY_CONNECTION_LIMIT = { enterprise: 20000, pro: 5000 } as const;
export const MEMBER_DAILY_LIMIT = 1000;
export const CALLS_TODAY = 2364;

export const CALL_DAYS: { label: string; calls: number; limitReached?: boolean }[] = [
  { label: "30 Oct", calls: 3120 },
  { label: "31 Oct", calls: 410 },
  { label: "1 Nov", calls: 260 },
  { label: "2 Nov", calls: 4880 },
  { label: "3 Nov", calls: 5210 },
  { label: "4 Nov", calls: 20000, limitReached: true },
  { label: "5 Nov", calls: 6040 },
  { label: "6 Nov", calls: 3980 },
  { label: "7 Nov", calls: 520 },
  { label: "8 Nov", calls: 300 },
  { label: "9 Nov", calls: 4410 },
  { label: "10 Nov", calls: 5120 },
  { label: "11 Nov", calls: 4730 },
  { label: "12 Nov", calls: CALLS_TODAY },
];

export type AppId = "claude" | "chatgpt" | "cursor" | "unknown";

export const APPS: Record<AppId, { name: string; host: string; mark: string; verified: boolean }> =
  {
    claude: { name: "Claude", host: "claude.ai", mark: "C", verified: true },
    chatgpt: { name: "ChatGPT", host: "chatgpt.com", mark: "G", verified: true },
    cursor: { name: "Cursor", host: "localhost", mark: "Cu", verified: false },
    unknown: { name: "Leave Helper", host: "leavehelper.app", mark: "L", verified: false },
  };

export type Connection = {
  id: string;
  person: string;
  personId: string;
  app: AppId;
  access: "read" | "write";
  connected: string;
  lastUsed: string;
};

export const CONNECTIONS: Connection[] = [
  {
    id: "c1",
    person: "Jana Nováková",
    personId: "jana",
    app: "claude",
    access: "write",
    connected: "2 Nov",
    lastUsed: "Today, 08:40",
  },
  {
    id: "c2",
    person: "Petr Svoboda",
    personId: "petr",
    app: "chatgpt",
    access: "write",
    connected: "28 Oct",
    lastUsed: "Today, 08:31",
  },
  {
    id: "c3",
    person: "Petr Svoboda",
    personId: "petr",
    app: "cursor",
    access: "read",
    connected: "5 Nov",
    lastUsed: "Yesterday, 17:02",
  },
  {
    id: "c4",
    person: "Tomáš Černý",
    personId: "tomas",
    app: "unknown",
    access: "read",
    connected: "10 Nov",
    lastUsed: "Today, 07:58",
  },
  {
    id: "c5",
    person: "Eva Králová",
    personId: "eva",
    app: "claude",
    access: "read",
    connected: "19 Oct",
    lastUsed: "3 Nov",
  },
];

/** The viewer's own AI connections, across organizations, for account settings. */
export const MY_CONNECTIONS: {
  id: string;
  app: AppId;
  org: string;
  access: "read" | "write";
  connected: string;
  lastUsed: string;
}[] = [
  {
    id: "m1",
    app: "claude",
    org: "Novák Logistics",
    access: "write",
    connected: "2 Nov",
    lastUsed: "Today, 08:40",
  },
  {
    id: "m2",
    app: "chatgpt",
    org: "Brightline Studio",
    access: "read",
    connected: "14 Oct",
    lastUsed: "29 Oct",
  },
];

export const money = (usd: number) => `$${usd.toFixed(2)}`;
export const count = (n: number) => n.toLocaleString("en-US");
