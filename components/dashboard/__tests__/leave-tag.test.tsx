import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaveTag } from "../leave-tag";
import { AWAY_RECORD_TYPE, CalendarRecordType } from "@/lib/api/types";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

describe("LeaveTag", () => {
  it("renders the leave type label", () => {
    render(<LeaveTag type={CalendarRecordType.Vacation} />);
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });
});

describe("LeaveTag for a teammate's Away", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("labels Away in a neutral colour of its own, never Sick's or the unknown-type grey", () => {
    render(<LeaveTag type={AWAY_RECORD_TYPE} />);

    const tag = screen.getByText("Away");
    expect(tag.getAttribute("style")).not.toContain("var(--text-muted)");
    expect(tag.getAttribute("style")).not.toContain("var(--c-sick)");
    expect(screen.queryByText("AWAY")).not.toBeInTheDocument();
  });

  it("labels Away in Czech", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    render(
      <I18nProvider>
        <LeaveTag type={AWAY_RECORD_TYPE} />
      </I18nProvider>
    );

    expect(await screen.findByText("Pryč")).toBeInTheDocument();
  });
});
