import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger } from "../tabs";

describe("Tabs", () => {
  it("marks the current value active and reports a change on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs value="Vacation" onValueChange={onValueChange}>
        <TabsList aria-label="Type">
          <TabsTrigger value="Vacation">Vacation</TabsTrigger>
          <TabsTrigger value="Sick">Sick</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole("tab", { name: "Vacation" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "Sick" }));
    expect(onValueChange).toHaveBeenCalledWith("Sick");
  });
});
