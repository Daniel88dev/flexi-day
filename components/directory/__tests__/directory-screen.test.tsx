import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type {
  DirectoryOrganization,
  DirectoryPeople,
  DirectoryPerson,
  FormerDirectoryPerson,
} from "@/lib/api/directory";
import { DIRECTORY_VIEW_KEY } from "@/lib/directory/directory-view";
import { DirectoryScreen } from "../directory-screen";

let organizations: DirectoryOrganization[] = [];
let people: DirectoryPeople = { people: [], formerList: false };
let former: FormerDirectoryPerson[] = [];
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));

vi.mock("@/lib/api/queries", () => ({
  useDirectoryOrganizations: () => ({ data: organizations, isLoading: false, error: null }),
  useDirectoryState: () => ({ data: undefined }),
  useAcceptDirectoryAgreement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDirectoryPeople: (organizationId: string | null) => ({
    data: organizationId ? people : undefined,
    isLoading: false,
    error: null,
  }),
  useFormerDirectoryPeople: (_organizationId: string | null, enabled: boolean) => ({
    data: enabled ? former : undefined,
    isLoading: false,
    error: null,
  }),
}));

const org = (overrides: Partial<DirectoryOrganization>): DirectoryOrganization => ({
  organizationId: "org-1",
  name: "Acme",
  role: "MEMBER",
  enabled: false,
  writable: false,
  newAgreementVersionReady: false,
  ...overrides,
});

const person = (name: string, overrides: Partial<DirectoryPerson> = {}): DirectoryPerson => ({
  employmentId: `emp-${name}`,
  name,
  jobTitle: null,
  image: null,
  user: { id: `user-${name}`, name, initials: name.slice(0, 2), avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
  ...overrides,
});

const leaver = (name: string, endedAt: string): FormerDirectoryPerson => ({
  ...person(name),
  startedAt: "2024-01-01T08:00:00.000Z",
  endedAt,
});

describe("DirectoryScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    search = new URLSearchParams();
    organizations = [org({ enabled: true, writable: true })];
    people = {
      people: [
        person("Ada Novak"),
        person("Eli Ext", { markers: ["EXTERNAL_WORKER"] }),
        person("Jana Svobodová", { jobTitle: "Účetní" }),
      ],
      formerList: false,
    };
    former = [];
  });

  it("shows the people as cards by default, each linking to the profile", () => {
    renderWithClient(<DirectoryScreen />);

    const cards = screen.getByTestId("directory-cards");
    expect(within(cards).getAllByRole("link")).toHaveLength(3);
    expect(within(cards).getByRole("link", { name: /Ada Novak/ })).toHaveAttribute(
      "href",
      "/directory/person?organizationId=org-1&employmentId=emp-Ada%20Novak"
    );
    expect(screen.getByText("External worker")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("remembers the Table view in the browser", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithClient(<DirectoryScreen />);

    await user.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem(DIRECTORY_VIEW_KEY)).toBe("table");
    unmount();

    renderWithClient(<DirectoryScreen />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("directory-cards")).not.toBeInTheDocument();
  });

  it("searches on name, ignoring case and accents", async () => {
    const user = userEvent.setup();
    renderWithClient(<DirectoryScreen />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search by name or job title" }),
      "svobodova"
    );
    const cards = screen.getByTestId("directory-cards");
    expect(
      within(cards)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual([expect.stringContaining("Jana Svobodová")]);

    await user.clear(screen.getByRole("searchbox", { name: "Search by name or job title" }));
    await user.type(screen.getByRole("searchbox", { name: "Search by name or job title" }), "zed");
    expect(screen.getByText("Nobody matches “zed”.")).toBeInTheDocument();
  });

  it("searches on job title too, and shows it on the card and in the table", async () => {
    const user = userEvent.setup();
    renderWithClient(<DirectoryScreen />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search by name or job title" }),
      "ucetni"
    );
    const cards = screen.getByTestId("directory-cards");
    expect(within(cards).getAllByRole("link")).toHaveLength(1);
    expect(within(cards).getByText("Účetní")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getByRole("columnheader", { name: "Job title" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Účetní" })).toBeInTheDocument();
  });

  it("offers no Former tab to someone the list doesn't open it for", () => {
    renderWithClient(<DirectoryScreen />);
    expect(screen.queryByRole("tab", { name: "Former" })).not.toBeInTheDocument();
  });

  it("lists the Former tab latest end first, one row per spell", async () => {
    const user = userEvent.setup();
    people = { ...people, formerList: true };
    former = [
      leaver("Petra Early", "2025-11-30T12:00:00.000Z"),
      leaver("Rita Late", "2026-05-31T12:00:00.000Z"),
      leaver("Rita Late", "2024-06-30T12:00:00.000Z"),
    ];
    former[2]!.employmentId = "emp-rita-first";
    renderWithClient(<DirectoryScreen />);

    await user.click(screen.getByRole("tab", { name: "Former" }));

    const rows = within(screen.getByTestId("directory-former")).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0]!.textContent)).toEqual([
      "Rita Late",
      "Petra Early",
      "Rita Late",
    ]);
  });

  it("shows a lapsed organization's banner, with See plans for an admin", () => {
    organizations = [org({ enabled: true, writable: false, role: "ORGANIZATION_ADMIN" })];
    renderWithClient(<DirectoryScreen />);

    const banner = screen.getByTestId("directory-lapsed");
    expect(within(banner).getByRole("link", { name: "See plans" })).toHaveAttribute(
      "href",
      "/billing"
    );
    expect(screen.getByTestId("directory-cards")).toBeInTheDocument();
  });

  it("shows a member of a lapsed organization the banner without See plans", () => {
    organizations = [org({ enabled: true, writable: false })];
    renderWithClient(<DirectoryScreen />);

    const banner = screen.getByTestId("directory-lapsed");
    expect(within(banner).queryByRole("link")).not.toBeInTheDocument();
  });

  it("switches between Directory organizations, opening the one the link names", async () => {
    const user = userEvent.setup();
    organizations = [
      org({ enabled: true, writable: true }),
      org({ organizationId: "org-2", name: "Beta", enabled: true, writable: true }),
    ];
    search = new URLSearchParams("organizationId=org-2");
    renderWithClient(<DirectoryScreen />);

    const picker = screen.getByRole("group", { name: "Organization" });
    expect(within(picker).getByRole("button", { name: "Beta" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(within(picker).getByRole("button", { name: "Acme" }));
    expect(within(picker).getByRole("button", { name: "Acme" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("shows the owner on Pro the Enterprise upsell", () => {
    organizations = [org({ role: "OWNER" })];
    renderWithClient(<DirectoryScreen />);

    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
  });

  it("points an org admin on Enterprise at the owner", () => {
    organizations = [org({ role: "ORGANIZATION_ADMIN", writable: true })];
    renderWithClient(<DirectoryScreen />);

    expect(screen.getByText(/Only its owner can turn it on/)).toBeInTheDocument();
  });

  it("tells a member without a Directory organization there is none", () => {
    organizations = [org({})];
    renderWithClient(<DirectoryScreen />);

    expect(
      screen.getByText("The directory isn't on in any of your organizations.")
    ).toBeInTheDocument();
  });
});
