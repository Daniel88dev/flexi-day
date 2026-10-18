import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SettingsTab } from "../settings-tab";
import { QuotasTab } from "../quotas-tab";
import { InvitesTab } from "../invites-tab";
import { MirroringTab } from "../mirroring-tab";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { Group } from "@/lib/api/types";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";

const cs = dictionaries.cs;
const READ_ONLY_EN = "This group is read-only on your current plan";

const readOnly402 = () =>
  new ApiError(402, READ_ONLY_EN, null, [
    { message: READ_ONLY_EN, context: { reason: "READ_ONLY", limit: 3, current: 4 } as never },
  ]);

const memberCap402 = () =>
  new ApiError(402, "Member limit reached", null, [
    {
      message: "Member limit reached",
      context: { reason: "PLAN_LIMIT", limit: 10, current: 10 } as never,
    },
  ]);

const mutations = {
  workingDays: vi.fn(),
  holidayCountry: vi.fn(),
  groupQuotas: vi.fn(),
  userQuota: vi.fn(),
  invite: vi.fn(),
  mirrors: vi.fn(),
};

const toast = vi.fn();
vi.mock("@/components/toast", () => ({ pushToast: (...args: unknown[]) => toast(...args) }));

const mutation = (fn: ReturnType<typeof vi.fn>) => ({ mutateAsync: fn, isPending: false });

vi.mock("@/lib/api/queries", () => ({
  useBankHolidayCountries: () => ({ data: [] }),
  useUpdateGroupWorkingDays: () => mutation(mutations.workingDays),
  useUpdateGroupHolidayCountry: () => mutation(mutations.holidayCountry),
  useQuotas: () => ({ data: [], isLoading: false, error: null }),
  useGroupUsers: () => ({
    data: [
      {
        id: "gu-1",
        userId: "u-1",
        user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(1 65% 50%)" },
      },
    ],
    isLoading: false,
    error: null,
  }),
  useSetUserQuota: () => mutation(mutations.userQuota),
  useUpdateGroupQuotas: () => mutation(mutations.groupQuotas),
  useGroupInvites: () => ({ data: [], isLoading: false, error: null }),
  useCreateGroupInvite: () => mutation(mutations.invite),
  useRevokeGroupInvite: () => mutation(vi.fn()),
  useGroup: () => ({ data: undefined }),
  useSubscription: () => ({ data: undefined }),
  useGroupMirrors: () => ({
    isLoading: false,
    error: null,
    data: {
      groupId: "g-1",
      canManage: true,
      members: [
        {
          userId: "u-1",
          email: "dana@example.com",
          user: { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "hsl(1 65% 50%)" },
          candidates: [{ groupId: "g-2", groupName: "Ops", mirrored: false, manageable: true }],
        },
      ],
    },
  }),
  useSetGroupMirrors: () => mutation(mutations.mirrors),
}));

const group: Group = {
  id: "g-1",
  organizationId: "org-1",
  organization: {
    id: "org-1",
    name: "Acme",
    plan: "FREE",
    status: "active",
    active: true,
    sickDayBenefitActive: false,
  },
  groupName: "Platform",
  defaultVacationDays: 20,
  defaultHomeOfficeDays: 0,
  defaultSickDays: 0,
  workingDays: [1, 2, 3, 4, 5],
  holidayCountry: null,
  managerUserId: "u-owner",
  mainApprovalUser: null,
  tempApprovalUser: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const renderCs = (ui: ReactElement) =>
  renderWithClient(
    <I18nContext value={{ locale: "cs", setLocale: () => {}, t: cs, localeReady: true }}>
      {ui}
    </I18nContext>
  );

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

const sendInvite = () => {
  fireEvent.change(screen.getByLabelText(cs.groupDetail.invites.emailLabel), {
    target: { value: "qa@example.com" },
  });
  click(cs.groupDetail.invites.send);
};

async function expectReadOnlyMessage() {
  expect(await screen.findByText(cs.billing.readOnlyGroup)).toBeInTheDocument();
  expect(screen.queryByText(READ_ONLY_EN)).not.toBeInTheDocument();
}

describe("group detail saves refused by a plan limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const fn of Object.values(mutations)) fn.mockRejectedValue(readOnly402());
  });

  it("explains a refused working days save in the user's language", async () => {
    renderCs(<SettingsTab group={group} />);
    click(cs.groupDetail.saveWorkingDays);
    await expectReadOnlyMessage();
  });

  it("explains a refused holiday country save in the user's language", async () => {
    renderCs(<SettingsTab group={group} />);
    click(cs.groupDetail.saveHolidayCountry);
    await expectReadOnlyMessage();
  });

  it("explains a refused group quota defaults save in the user's language", async () => {
    renderCs(<QuotasTab groupId="g-1" group={group} isAdmin />);
    click(cs.groupDetail.saveDefaults);
    await expectReadOnlyMessage();
  });

  it("explains a refused member quota save in the user's language", async () => {
    renderCs(<QuotasTab groupId="g-1" group={group} isAdmin />);
    click(cs.common.edit);
    click(cs.common.save);
    await expectReadOnlyMessage();
  });

  it("explains a refused mirroring save in the user's language", async () => {
    renderCs(<MirroringTab groupId="g-1" groupName="Platform" />);
    fireEvent.click(screen.getByRole("checkbox"));
    click(cs.groupDetail.mirroring.save);
    await expectReadOnlyMessage();
    expect(toast).toHaveBeenCalledWith(cs.billing.readOnlyGroup, "danger");
  });

  it("explains an invite refused for a read-only group in the user's language", async () => {
    renderCs(<InvitesTab groupId="g-1" isAdmin />);
    sendInvite();
    await expectReadOnlyMessage();
  });

  it("explains an invite refused for the member cap with the limit", async () => {
    mutations.invite.mockRejectedValue(memberCap402());
    renderCs(<InvitesTab groupId="g-1" isAdmin />);
    sendInvite();
    expect(await screen.findByText(cs.billing.memberLimitReached(10))).toBeInTheDocument();
    expect(screen.queryByText("Member limit reached")).not.toBeInTheDocument();
  });

  it("keeps showing the backend's message for errors that are not plan limits", async () => {
    mutations.workingDays.mockRejectedValue(new ApiError(500, "Something broke"));
    renderCs(<SettingsTab group={group} />);
    click(cs.groupDetail.saveWorkingDays);
    expect(await screen.findByText("Something broke")).toBeInTheDocument();
  });
});
