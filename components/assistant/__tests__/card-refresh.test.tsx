import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequestsPage from "@/app/(app)/requests/page";
import { ApprovalsWidget } from "@/components/dashboard/widgets/approvals-widget";
import { renderWithClient } from "@/lib/test-utils";
import type { PendingCard } from "@/lib/api/assistant";
import * as client from "@/lib/api/client";
import { CalendarRecordType, type PendingApproval, type VacationListItem } from "@/lib/api/types";
import { ConfirmCard } from "../confirm-card";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: vi.fn() };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "approver-1" } } }),
}));

vi.mock("@/lib/viewer/use-viewer-roles", () => ({
  useViewerRoles: () => ({ isLoading: false, isApprover: true }),
}));

const requester = { id: "u-ann", name: "Ann Member", initials: "AM", avatarColor: "hsl(0 0% 50%)" };

const waiting: PendingApproval = {
  vacationIds: ["v-1", "v-2"],
  user: requester,
  groupId: "g-1",
  groupName: "Acme Team",
  vacationType: CalendarRecordType.Vacation,
  from: "2027-06-07",
  to: "2027-06-08",
  businessDays: 2,
  note: null,
  submittedAt: "2027-05-20T10:00:00.000Z",
};

const day = (id: string, requestedDay: string, approved: boolean): VacationListItem => ({
  id,
  userId: requester.id,
  groupId: "g-1",
  requestId: "r-1",
  requestedDay,
  startTime: null,
  endTime: null,
  vacationType: CalendarRecordType.Vacation,
  halfDay: false,
  note: null,
  rejectionReason: null,
  approvedAt: approved ? "2027-05-21T09:00:00.000Z" : null,
  approvedBy: approved ? "approver-1" : null,
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  deletedByUserId: null,
  createdByUserId: null,
  createdAt: "2027-05-20T10:00:00.000Z",
  updatedAt: "2027-05-20T10:00:00.000Z",
  user: requester,
  canApprove: !approved,
});

const approveCard: PendingCard = {
  id: "card-1",
  chatId: "chat-1",
  toolUseId: "sevt_approve",
  tool: "approve_request",
  status: "open",
  preview: {
    action: "approve_request",
    requestId: "r-1",
    requester: { id: requester.id, name: requester.name },
    group: { id: "g-1", name: "Acme Team" },
    type: "VACATION",
    firstDay: "2027-06-07",
    lastDay: "2027-06-08",
    decidedDays: ["2027-06-07", "2027-06-08"],
    days: 2,
    note: null,
    noteAuthor: null,
    reason: null,
    balances: [],
  },
  authorNames: [],
  result: null,
  error: null,
  createdAt: "2027-05-21T08:00:00.000Z",
  decidedAt: null,
};

const APPROVALS = "/api/users/me/approvals";
const decidePath = (decision: string) =>
  `/api/assistant/pending-actions/${approveCard.id}/${decision}`;

function mockBackend() {
  let approved = false;
  vi.mocked(client.api).mockImplementation(async (path: string) => {
    if (path === decidePath("confirm")) {
      approved = true;
      return {
        card: { ...approveCard, status: "confirmed", result: { status: "approved" } },
        turnRunning: false,
      };
    }
    if (path === decidePath("decline")) {
      return { card: { ...approveCard, status: "declined" }, turnRunning: false };
    }
    if (path === APPROVALS) return approved ? [] : [waiting];
    if (path === "/api/users/me/pending-requests") return [];
    if (path === "/api/group") return [{ id: waiting.groupId, groupName: waiting.groupName }];
    if (path === "/api/reports/scope") {
      return {
        groups: [{ groupId: waiting.groupId, groupName: waiting.groupName, access: "all" }],
      };
    }
    if (path.startsWith("/api/vacation?")) {
      return [day("v-1", "2027-06-07", approved), day("v-2", "2027-06-08", approved)];
    }
    throw new Error(`unexpected request: ${path}`);
  });
}

function showAppBesideCard() {
  renderWithClient(
    <>
      <section aria-label="dashboard">
        <ApprovalsWidget />
      </section>
      <section aria-label="requests">
        <RequestsPage />
      </section>
      <section aria-label="assistant">
        <ConfirmCard card={approveCard} />
      </section>
    </>
  );
  return {
    dashboard: within(screen.getByRole("region", { name: "dashboard" })),
    requests: within(screen.getByRole("region", { name: "requests" })),
    assistant: within(screen.getByRole("region", { name: "assistant" })),
  };
}

describe("ConfirmCard beside the app", () => {
  beforeEach(() => {
    vi.mocked(client.api).mockReset();
    mockBackend();
  });

  it("should refresh the Dashboard approvals and the Requests page when a card is confirmed", async () => {
    const user = userEvent.setup();
    const { dashboard, requests, assistant } = showAppBesideCard();

    expect(await dashboard.findByText("1 to review")).toBeInTheDocument();
    expect(await requests.findByRole("button", { name: "Approve" })).toBeInTheDocument();

    await user.click(assistant.getByRole("button", { name: "Approve" }));

    expect(await dashboard.findByText("All caught up — nothing waiting.")).toBeInTheDocument();
    expect(dashboard.queryByText("1 to review")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(requests.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument()
    );
  });

  it("should leave the app's data alone when a card is declined", async () => {
    const user = userEvent.setup();
    const { dashboard, requests, assistant } = showAppBesideCard();
    await dashboard.findByText("1 to review");
    await requests.findByRole("button", { name: "Approve" });
    const approvalReads = () =>
      vi.mocked(client.api).mock.calls.filter(([path]) => path === APPROVALS).length;
    const readsBefore = approvalReads();

    await user.click(assistant.getByRole("button", { name: "Not now" }));

    await waitFor(() =>
      expect(assistant.getByTestId("assistant-card")).toHaveAttribute("data-status", "declined")
    );
    expect(approvalReads()).toBe(readsBefore);
    expect(dashboard.getByText("1 to review")).toBeInTheDocument();
  });
});
