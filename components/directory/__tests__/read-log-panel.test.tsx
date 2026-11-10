import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { ReadLogEntry, ReadLogPage } from "@/lib/api/directory";
import { ReadLogPanel } from "../read-log-panel";

let page: ReadLogPage;

vi.mock("@/lib/api/queries", () => ({
  useReadLog: () => ({
    data: { pages: [page] },
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}));

const read = (id: string, reader: string, channel: ReadLogEntry["channel"]): ReadLogEntry => ({
  id,
  kind: "read",
  at: "2026-11-02T09:00:00.000Z",
  reader: { userId: `user-${id}`, name: reader },
  person: { employmentId: "emp-1", name: "Mia Member" },
  sections: ["CONTACT"],
  audience: "OWNER",
  channel,
});

const rowOf = (reader: string) => screen.getByText(reader).closest("tr")!;

describe("ReadLogPanel", () => {
  beforeEach(() => {
    page = {
      entries: [
        read("1", "Olga Owner", "app"),
        read("2", "Ada Admin", "assistant"),
        read("3", "Hugo Hr", "mcp"),
      ],
      nextBefore: null,
      people: [{ employmentId: "emp-1", name: "Mia Member" }],
      readers: [],
    };
  });

  afterEach(() => {
    window.localStorage.removeItem("flexiday-locale");
  });

  it("names the channel of a read made through the Assistant or an AI app", () => {
    renderWithClient(<ReadLogPanel organizationId="org-1" />);

    expect(within(rowOf("Ada Admin")).getByText("through the Assistant")).toBeInTheDocument();
    expect(within(rowOf("Hugo Hr")).getByText("through an AI app")).toBeInTheDocument();
    expect(within(rowOf("Olga Owner")).queryByText(/through/)).not.toBeInTheDocument();
  });

  it("names it in Czech", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    renderWithClient(
      <I18nProvider>
        <ReadLogPanel organizationId="org-1" />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(within(rowOf("Ada Admin")).getByText("přes Asistenta")).toBeInTheDocument()
    );
    expect(within(rowOf("Hugo Hr")).getByText("přes AI aplikaci")).toBeInTheDocument();
  });
});
