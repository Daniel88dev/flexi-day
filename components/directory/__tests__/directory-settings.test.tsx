import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type {
  DirectoryOrganization,
  DirectoryGeneralSettings,
  DirectoryRoles,
  ReadLogPage,
  PermissionHistoryEntry,
  PermissionTable,
  PermissionTableCell,
} from "@/lib/api/directory";
import { DirectorySettings } from "../directory-settings";

vi.mock("../directory-lists-panel", () => ({
  DirectoryListsPanel: () => <div data-testid="lists-panel" />,
}));

const updateCell = vi.fn();
const setRoles = vi.fn();
let table: PermissionTable;
let roles: DirectoryRoles;
let history: PermissionHistoryEntry[] = [];
const updateNotice = vi.fn();
let general: DirectoryGeneralSettings;
let readLog: ReadLogPage;
const readLogFilters: unknown[] = [];

vi.mock("@/lib/api/queries", () => ({
  usePermissionTable: () => ({ data: table, isLoading: false, error: null }),
  usePermissionHistory: () => ({ data: history, isLoading: false, error: null }),
  useDirectoryRoles: () => ({ data: roles, isLoading: false, error: null }),
  useUpdatePermissionCell: () => ({ mutate: updateCell, isPending: false, error: null }),
  useSetDirectoryRoles: () => ({ mutate: setRoles, isPending: false, error: null }),
  useDirectoryGeneralSettings: () => ({ data: general, isLoading: false, error: null }),
  useUpdateDirectoryGeneralSettings: () => ({
    mutate: updateNotice,
    isPending: false,
    isSuccess: false,
    error: null,
  }),
  useRetentionSettings: () => ({
    data: {
      editable: false,
      periods: {
        CARD: "UNTIL_ERASED",
        PHOTO: "YEAR_1",
        WORK_CONTACT: "DAYS_30",
        JOB: "UNTIL_ERASED",
        CONTACT: "MONTHS_6",
        PERSONAL: "YEARS_3",
      },
      defaults: {
        CARD: "UNTIL_ERASED",
        PHOTO: "YEAR_1",
        WORK_CONTACT: "DAYS_30",
        JOB: "UNTIL_ERASED",
        CONTACT: "DAYS_30",
        PERSONAL: "YEARS_3",
      },
    },
    isLoading: false,
    error: null,
  }),
  useUpdateRetentionPeriod: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useRetentionPreview: () => ({ data: undefined, isLoading: false, error: null }),
  useReadLog: (_organizationId: string, filter: unknown) => {
    readLogFilters.push(filter);
    return { data: { pages: [readLog] }, error: null, hasNextPage: false };
  },
}));

const organization: DirectoryOrganization = {
  organizationId: "org-1",
  name: "Acme",
  role: "OWNER",
  enabled: true,
  writable: true,
  newAgreementVersionReady: false,
};

const cell = (
  row: PermissionTableCell["row"],
  audience: PermissionTableCell["audience"],
  value: PermissionTableCell["value"],
  options: PermissionTableCell["options"],
  fixed = false
): PermissionTableCell => ({ row, audience, value, options, fixed });

const cells: PermissionTableCell[] = [
  cell("JOB", "OWNER", "WRITE", ["WRITE"], true),
  cell("JOB", "SELF", "READ", ["READ"], true),
  cell("JOB", "COLLEAGUE", "NONE", ["NONE", "READ"]),
  cell("JOB", "LEADERSHIP", "READ", ["NONE", "READ", "WRITE"]),
  cell("END_EMPLOYMENT", "OWNER", "ALLOWED", ["ALLOWED"], true),
  cell("END_EMPLOYMENT", "HR", "ALLOWED", ["NO", "ALLOWED"]),
];

describe("DirectorySettings", () => {
  beforeEach(() => {
    updateCell.mockReset();
    setRoles.mockReset();
    table = { editable: true, writable: true, cells };
    roles = {
      editable: true,
      writable: true,
      people: [
        { employmentId: "emp-hana", name: "Hana Human", roles: ["HR"] },
        { employmentId: "emp-leo", name: "Leo Lead", roles: [] },
      ],
    };
    history = [];
  });

  it("lets the owner change a cell at once, and shows fixed cells locked", async () => {
    renderWithClient(<DirectorySettings organization={organization} />);

    const leadership = screen.getByRole("combobox", { name: "Job, Leadership" });
    await userEvent.selectOptions(leadership, "WRITE");

    expect(updateCell).toHaveBeenCalledWith({ row: "JOB", audience: "LEADERSHIP", value: "WRITE" });
    expect(screen.queryByRole("combobox", { name: "Job, Owner" })).toBeNull();
    expect(screen.getByLabelText("Write, fixed")).toBeInTheDocument();
    const colleague = screen.getByRole("combobox", { name: "Job, Colleague" });
    expect(
      within(colleague)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["None", "Read"]);
    expect(screen.queryByRole("combobox", { name: "End an Employment, Group admin" })).toBeNull();
  });

  it("shows an org admin or HR the table read-only", () => {
    table = { ...table, editable: false };
    renderWithClient(
      <DirectorySettings organization={{ ...organization, role: "ORGANIZATION_ADMIN" }} />
    );

    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(
      screen.getByText("Only the owner changes the table and the directory roles.")
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Job, Leadership: Read" })).toBeInTheDocument();
  });

  it("lets a lapsed owner narrow a cell but not widen it", () => {
    table = { ...table, writable: false };
    renderWithClient(<DirectorySettings organization={{ ...organization, writable: false }} />);

    expect(
      screen.getByText("On this plan you can narrow cells but not widen them.")
    ).toBeInTheDocument();
    const leadership = screen.getByRole("combobox", { name: "Job, Leadership" });
    const option = (name: string) =>
      within(leadership).getByRole<HTMLOptionElement>("option", { name });
    expect(option("None").disabled).toBe(false);
    expect(option("Write").disabled).toBe(true);
    const hr = screen.getByRole("combobox", { name: "End an Employment, HR" });
    expect(within(hr).getByRole<HTMLOptionElement>("option", { name: "No" }).disabled).toBe(false);
  });

  it("lists the permission history beside the table", () => {
    history = [
      {
        kind: "ROLE",
        id: "h2",
        at: "2026-09-04T09:30:00.000Z",
        actorName: "Olga Owner",
        role: "HR",
        employmentId: "emp-hana",
        personName: "Hana Human",
        before: false,
        after: true,
        reason: "OWNER",
      },
      {
        kind: "CELL",
        id: "h1",
        at: "2026-09-02T10:14:00.000Z",
        actorName: "Olga Owner",
        row: "JOB",
        audience: "GROUP_ADMIN",
        before: "NONE",
        after: "READ",
      },
      {
        kind: "ROLE",
        id: "h3",
        at: "2026-09-05T09:30:00.000Z",
        actorName: null,
        role: "LEADERSHIP",
        employmentId: null,
        personName: null,
        before: true,
        after: false,
        reason: "EMPLOYMENT_ENDED",
      },
    ];
    renderWithClient(<DirectorySettings organization={organization} />);

    const list = screen.getByRole("list", { name: "Permission history" });
    const lines = within(list)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(lines[0]).toContain("Assigned HR to Hana Human");
    expect(lines[1]).toContain("Job · Group admin: None → Read");
    expect(lines[2]).toContain("Leadership ended with an erased person's Employment");
    expect(lines[2]).toContain("Flexi Day");
  });

  describe("the Directory roles panel", () => {
    it("lets the owner give a person a role", async () => {
      renderWithClient(<DirectorySettings organization={organization} />);
      await userEvent.click(screen.getByRole("button", { name: "Directory roles" }));

      await userEvent.click(screen.getByRole("checkbox", { name: "Leadership for Hana Human" }));

      expect(setRoles).toHaveBeenCalledWith({
        employmentId: "emp-hana",
        roles: ["HR", "LEADERSHIP"],
      });
    });

    it("keeps removing open on a lapsed plan and assigning closed", async () => {
      roles = { ...roles, writable: false };
      renderWithClient(<DirectorySettings organization={{ ...organization, writable: false }} />);
      await userEvent.click(screen.getByRole("button", { name: "Directory roles" }));

      expect(screen.getByRole("checkbox", { name: "HR for Hana Human" })).toBeEnabled();
      expect(screen.getByRole("checkbox", { name: "Leadership for Hana Human" })).toBeDisabled();
    });

    it("shows anyone else only the people who hold a role, read-only", async () => {
      roles = { ...roles, editable: false };
      renderWithClient(<DirectorySettings organization={{ ...organization, role: "MEMBER" }} />);
      await userEvent.click(screen.getByRole("button", { name: "Directory roles" }));

      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(screen.getByText("Hana Human")).toBeInTheDocument();
      expect(screen.queryByText("Leo Lead")).toBeNull();
    });
  });

  describe("the General and Read log panels", () => {
    beforeEach(() => {
      updateNotice.mockReset();
      readLogFilters.length = 0;
      general = {
        editable: true,
        emergencyContactNotice: { en: null, cs: "Vlastní text {period}." },
        defaults: { en: "Default {organization} {period}.", cs: "Výchozí {period}." },
        period: { en: "30 days", cs: "30 dní" },
      };
      readLog = {
        entries: [
          {
            id: "r1",
            kind: "read",
            at: "2026-10-26T09:00:00.000Z",
            reader: { userId: "u-hana", name: "Hana Human" },
            person: { employmentId: "emp-jana", name: "Jana Member" },
            sections: ["CONTACT"],
            audience: "HR",
          },
          {
            id: "r2",
            kind: "export",
            at: "2026-10-25T09:00:00.000Z",
            reader: { userId: "u-olga", name: "Olga Owner" },
            person: { employmentId: "emp-gone", name: null },
            sections: null,
            audience: "OWNER",
          },
        ],
        nextBefore: null,
        people: [{ employmentId: "emp-jana", name: "Jana Member" }],
        readers: [
          { userId: "u-hana", name: "Hana Human" },
          { userId: "u-olga", name: "Olga Owner" },
        ],
      };
    });

    it("edits the notice per language and sends null for a text set back to the default", async () => {
      const user = userEvent.setup();
      renderWithClient(<DirectorySettings organization={organization} />);
      await user.click(screen.getByRole("button", { name: "General" }));

      expect(screen.getByLabelText("English")).toHaveValue("Default {organization} {period}.");
      expect(screen.getByLabelText("Czech")).toHaveValue("Vlastní text {period}.");
      expect(screen.getByText(/now 30 days/)).toBeInTheDocument();
      await user.clear(screen.getByLabelText("English"));
      await user.type(screen.getByLabelText("English"), "Our text");
      await user.click(screen.getByRole("button", { name: "Use the default: Czech" }));
      expect(screen.getByLabelText("Czech")).toHaveValue("Výchozí {period}.");
      await user.click(screen.getByRole("button", { name: "Save notice" }));

      expect(updateNotice).toHaveBeenCalledWith({ en: "Our text", cs: null });
    });

    it("shows the read log to the owner with names, never values, and filters by person and reader", async () => {
      const user = userEvent.setup();
      renderWithClient(<DirectorySettings organization={organization} />);
      await user.click(screen.getByRole("button", { name: "Read log" }));

      const rows = screen.getAllByRole("row").slice(1);
      expect(within(rows[0]!).getByText("Hana Human")).toBeInTheDocument();
      expect(within(rows[0]!).getByText("Opened Contact")).toBeInTheDocument();
      expect(within(rows[0]!).getByText("HR")).toBeInTheDocument();
      expect(within(rows[1]!).getByText("Exported")).toBeInTheDocument();
      expect(within(rows[1]!).getByText("An erased person")).toBeInTheDocument();

      await user.selectOptions(screen.getByLabelText("Person"), "emp-jana");
      await user.selectOptions(screen.getByLabelText("Reader"), "u-hana");
      expect(readLogFilters.at(-1)).toEqual({ employmentId: "emp-jana", readerUserId: "u-hana" });
    });

    it("leaves the Read log out for HR who is not an org admin, and shows them the retention periods", async () => {
      const user = userEvent.setup();
      renderWithClient(<DirectorySettings organization={{ ...organization, role: "MEMBER" }} />);

      expect(screen.getByRole("button", { name: "General" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Retention" }));
      expect(screen.getByText("Retention periods")).toBeInTheDocument();
      expect(screen.getByText("6 months")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Read log" })).not.toBeInTheDocument();
    });
  });

  it("opens Departments and locations as its own panel, without the permission history", async () => {
    renderWithClient(<DirectorySettings organization={organization} />);
    await userEvent.click(screen.getByRole("button", { name: "Departments and locations" }));

    expect(screen.getByTestId("lists-panel")).toBeInTheDocument();
    expect(screen.queryByText("Permission history")).toBeNull();
  });
});
