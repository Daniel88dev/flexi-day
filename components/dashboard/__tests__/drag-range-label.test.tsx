import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DragRangeLabel } from "../drag-range-label";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";

const range = { from: "2026-10-07", to: "2026-10-15" };
const pointer = { x: 200, y: 300 };

describe("DragRangeLabel", () => {
  it("names the range and its working days, beside the pointer", () => {
    render(
      <DragRangeLabel range={range} pointer={pointer} holidays={new Set()} booked={new Set()} />
    );

    const label = screen.getByTestId("drag-range-label");
    expect(label).toHaveTextContent(/^7\s–\s15 Oct · 7 days$/);
    expect(label).toHaveStyle({ left: "214px", top: "318px", position: "fixed" });
  });

  it("skips holidays in the count and adds a line for days already booked", () => {
    render(
      <DragRangeLabel
        range={range}
        pointer={pointer}
        holidays={new Set(["2026-10-08"])}
        booked={new Set(["2026-10-14", "2026-10-15", "2026-10-20"])}
      />
    );

    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(/6 days/);
    expect(screen.getByText("2 already booked")).toBeInTheDocument();
  });

  it("says one day in the singular", () => {
    render(
      <DragRangeLabel
        range={{ from: "2026-10-07", to: "2026-10-07" }}
        pointer={pointer}
        holidays={new Set()}
        booked={new Set()}
      />
    );

    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(/^7 Oct · 1 day$/);
    expect(screen.queryByText(/already booked/)).toBeNull();
  });

  it("speaks Czech", () => {
    render(
      <I18nContext
        value={{ locale: "cs", setLocale: () => {}, t: dictionaries.cs, localeReady: true }}
      >
        <DragRangeLabel
          range={range}
          pointer={pointer}
          holidays={new Set()}
          booked={new Set(["2026-10-13", "2026-10-14", "2026-10-15"])}
        />
      </I18nContext>
    );

    expect(screen.getByTestId("drag-range-label")).toHaveTextContent(
      /^7\.\s10\.\s–\s15\.\s10\. · 7 dní/
    );
    expect(screen.getByText("Už zadáno: 3 dny")).toBeInTheDocument();
  });
});
