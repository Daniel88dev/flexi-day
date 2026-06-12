export type LeaveType = "vacation" | "sick" | "remote" | "holiday";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}

export interface LeaveRequest {
  id: string;
  memberId: string;
  type: LeaveType;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;
  notes?: string;
  status: RequestStatus;
  submittedAt: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: "Vacation / PTO",
  sick: "Sick Leave",
  remote: "Remote Work",
  holiday: "Public Holiday",
};

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  vacation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sick: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  remote: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  holiday: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "Alice Chen", role: "Frontend Dev", avatarColor: "bg-pink-500" },
  { id: "2", name: "Bob Martinez", role: "Backend Dev", avatarColor: "bg-blue-500" },
  { id: "3", name: "Carol Smith", role: "Designer", avatarColor: "bg-purple-500" },
  { id: "4", name: "David Park", role: "DevOps", avatarColor: "bg-orange-500" },
  { id: "5", name: "Eva Johnson", role: "Product Manager", avatarColor: "bg-green-500" },
];

export const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: "r1",
    memberId: "1",
    type: "vacation",
    startDate: "2026-06-16",
    endDate: "2026-06-20",
    notes: "Summer trip to Portugal",
    status: "approved",
    submittedAt: "2026-06-01",
  },
  {
    id: "r2",
    memberId: "2",
    type: "sick",
    startDate: "2026-06-12",
    endDate: "2026-06-13",
    status: "approved",
    submittedAt: "2026-06-12",
  },
  {
    id: "r3",
    memberId: "3",
    type: "remote",
    startDate: "2026-06-15",
    endDate: "2026-06-19",
    notes: "Working from home office in Krakow",
    status: "pending",
    submittedAt: "2026-06-10",
  },
  {
    id: "r4",
    memberId: "4",
    type: "vacation",
    startDate: "2026-06-22",
    endDate: "2026-06-26",
    notes: "Annual leave",
    status: "pending",
    submittedAt: "2026-06-08",
  },
  {
    id: "r5",
    memberId: "5",
    type: "holiday",
    startDate: "2026-06-19",
    endDate: "2026-06-19",
    status: "approved",
    submittedAt: "2026-05-30",
  },
  {
    id: "r6",
    memberId: "1",
    type: "sick",
    startDate: "2026-05-28",
    endDate: "2026-05-29",
    status: "approved",
    submittedAt: "2026-05-28",
  },
  {
    id: "r7",
    memberId: "2",
    type: "vacation",
    startDate: "2026-07-07",
    endDate: "2026-07-18",
    notes: "Summer holidays",
    status: "pending",
    submittedAt: "2026-06-05",
  },
];

export function getMemberById(id: string): TeamMember | undefined {
  return TEAM_MEMBERS.find((m) => m.id === id);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function countBusinessDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
