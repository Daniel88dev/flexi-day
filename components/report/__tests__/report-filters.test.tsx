import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { ReportFiltersBar } from "@/components/report/report-filters";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { ReportScope } from "@/lib/api/report-types";

const scope: ReportScope = {
  groups: [{ groupId: "g1", groupName: "Engineering", access: "all", canEditQuotas: true }],
  members: [
    {
      id: "u1",
      name: "Ada Lovelace",
      initials: "AL",
      avatarColor: "hsl(200, 65%, 50%)",
      groupId: "g1",
    },
  ],
  years: [2026, 2025],
};

describe("ReportFiltersBar", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("lists every type in Czech when the Czech locale is active", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");

    renderWithClient(
      <I18nProvider>
        <ReportFiltersBar scope={scope} filters={{ year: 2026 }} onChange={vi.fn()} />
      </I18nProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Typy volna" }));

    for (const label of [
      "Dovolená",
      "Home Office",
      "Nemoc",
      "Státní svátek",
      "Neplacené volno",
      "Placené volno",
      "Nemocenská",
      "Studijní volno",
      "Ostatní",
    ]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("offers the rolling window alongside each year when a period is controlled", () => {
    renderWithClient(
      <ReportFiltersBar
        scope={scope}
        filters={{ year: 2026 }}
        onChange={vi.fn()}
        period="rolling"
        onPeriodChange={vi.fn()}
      />
    );

    expect(screen.getByRole("combobox", { name: "Period" })).toHaveTextContent("Last 12 months");
    expect(screen.queryByRole("combobox", { name: "Year" })).not.toBeInTheDocument();
  });

  it("falls back to a plain year picker for callers with no period", () => {
    // The export dialog reuses this bar, and a workbook is always one year.
    renderWithClient(
      <ReportFiltersBar scope={scope} filters={{ year: 2025 }} onChange={vi.fn()} />
    );

    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2025");
    expect(screen.queryByRole("combobox", { name: "Period" })).not.toBeInTheDocument();
  });
});
