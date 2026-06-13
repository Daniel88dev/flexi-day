import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaveTag } from "../leave-tag";
import { VacationKind } from "@/lib/api/types";

describe("LeaveTag", () => {
  it("renders the leave type label", () => {
    render(<LeaveTag type={VacationKind.Vacation} />);
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });
});
