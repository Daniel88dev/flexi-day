import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VacationDetailHost } from "../vacation-detail-host";
import { renderWithClient } from "@/lib/test-utils";

const replaceSpy = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  usePathname: () => "/dashboard/",
  useRouter: () => ({ replace: replaceSpy, push: vi.fn() }),
}));

vi.mock("@/lib/api/queries", () => ({
  useVacation: (id: string | null) => ({
    data: id === null ? undefined : { ...detail, id },
    isLoading: false,
    error: null,
  }),
  useApproveVacations: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRejectVacations: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelVacations: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCommentVacation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const detail = {
  id: "v-1",
  userId: "u-1",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-08-12",
  rangeStart: "2026-08-12",
  rangeEnd: "2026-08-12",
  vacationIds: ["v-1"],
  startTime: null,
  endTime: null,
  vacationType: "VACATION",
  halfDay: false,
  note: null,
  rejectionReason: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-07-20T09:00:00.000Z",
  user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(270 60% 60%)" },
  approvedByUser: null,
  rejectedByUser: null,
  canApprove: false,
  canCancel: false,
  history: [],
};

describe("VacationDetailHost", () => {
  // The hook reads the live query off `window.location` when it rewrites it,
  // so the mocked search params and jsdom's URL have to agree.
  function atQuery(query: string) {
    search = new URLSearchParams(query);
    window.history.replaceState({}, "", `/dashboard/${query ? `?${query}` : ""}`);
  }

  beforeEach(() => {
    replaceSpy.mockClear();
    atQuery("");
  });

  it("stays closed without a vacationId in the query", () => {
    renderWithClient(<VacationDetailHost />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the request named by the query", () => {
    atQuery("vacationId=v-1");
    renderWithClient(<VacationDetailHost />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dana Holt")).toBeInTheDocument();
  });

  it("drops the query parameter when the dialog is closed", async () => {
    atQuery("tab=quotas&vacationId=v-1");
    renderWithClient(<VacationDetailHost />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(replaceSpy).toHaveBeenCalledWith("/dashboard/?tab=quotas", { scroll: false });
  });
});
