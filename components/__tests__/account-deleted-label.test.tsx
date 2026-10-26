import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountDeletedLabel } from "../account-deleted-label";

describe("AccountDeletedLabel", () => {
  it("reads Account deleted", () => {
    render(<AccountDeletedLabel />);
    expect(screen.getByTestId("account-deleted")).toHaveTextContent("Account deleted");
  });
});
