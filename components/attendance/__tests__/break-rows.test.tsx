import { describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BreakRows, useBreakDrafts } from "../break-rows";

const noop = () => undefined;

describe("BreakRows", () => {
  it("says there are none, and adds one on request", async () => {
    const onAdd = vi.fn();
    render(
      <BreakRows breaks={[]} messageFor={noop} onChange={noop} onRemove={noop} onAdd={onAdd} />
    );

    expect(screen.getByText("No breaks recorded.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Add break" }));
    expect(onAdd).toHaveBeenCalled();
  });

  it("marks a new row and shows its error under it", () => {
    render(
      <BreakRows
        breaks={[{ id: "new-1", startedAt: "15:00", endedAt: "15:20", isNew: true }]}
        messageFor={() => "Has to end after it starts."}
        onChange={noop}
        onRemove={noop}
      />
    );

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Has to end after it starts.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add break" })).not.toBeInTheDocument();
  });
});

describe("useBreakDrafts", () => {
  it("adds new rows, edits and removes them, and marks one saved under its server id", () => {
    const { result } = renderHook(() => useBreakDrafts());

    act(() => result.current.add());
    act(() => result.current.add());
    const [first, second] = result.current.breaks;
    act(() => result.current.change(first!.id, { startedAt: "15:00", endedAt: "15:20" }));
    act(() => result.current.remove(second!.id));
    act(() => result.current.markSaved(first!.id, "server-1"));

    expect(result.current.breaks).toEqual([
      { id: "server-1", startedAt: "15:00", endedAt: "15:20" },
    ]);
  });
});
