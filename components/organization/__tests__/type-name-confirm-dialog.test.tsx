import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { TypeNameConfirmDialog } from "../type-name-confirm-dialog";

const genericFailure = () => "It failed.";

function Harness({
  onConfirm,
  failure = genericFailure,
}: {
  onConfirm: (typed: string) => Promise<void>;
  failure?: (error: unknown) => string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Reopen</Button>
      <TypeNameConfirmDialog
        open={open}
        onOpenChange={setOpen}
        name="Acme Ltd"
        inputId="confirm-name"
        title="Delete everything"
        description="This cannot be undone."
        nameLabel="Type Acme Ltd to confirm"
        mismatch="That isn't the name."
        confirmLabel="Delete for good"
        pending={false}
        onConfirm={onConfirm}
        failureMessage={failure}
      >
        <p>Extra body</p>
      </TypeNameConfirmDialog>
    </>
  );
}

const dialog = () => screen.getByRole("dialog");
const input = () => within(dialog()).getByLabelText("Type Acme Ltd to confirm");
const confirm = () => within(dialog()).getByRole("button", { name: "Delete for good" });

describe("TypeNameConfirmDialog", () => {
  it("renders the copy and the body, with confirm off until a name is typed", () => {
    render(<Harness onConfirm={vi.fn()} />);

    expect(within(dialog()).getByText("Delete everything")).toBeInTheDocument();
    expect(within(dialog()).getByText("Extra body")).toBeInTheDocument();
    expect(confirm()).toBeDisabled();
  });

  it("refuses a name that doesn't match without calling onConfirm", async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    await userEvent.type(input(), "Acme");
    await userEvent.click(confirm());

    expect(onConfirm).not.toHaveBeenCalled();
    expect(within(dialog()).getByText("That isn't the name.")).toBeInTheDocument();
  });

  it("clears the error as soon as the name changes", async () => {
    render(<Harness onConfirm={vi.fn()} />);

    await userEvent.type(input(), "Acme");
    await userEvent.click(confirm());
    await userEvent.type(input(), " Ltd");

    expect(within(dialog()).queryByText("That isn't the name.")).not.toBeInTheDocument();
  });

  it("confirms with the typed text once it matches, whatever its case, then closes", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<Harness onConfirm={onConfirm} />);

    await userEvent.type(input(), " acme  ltd");
    await userEvent.click(confirm());

    expect(onConfirm).toHaveBeenCalledWith(" acme  ltd");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the failure message and stays open when onConfirm rejects", async () => {
    const problem = new Error("boom");
    const failure = vi.fn().mockReturnValue("The server said no.");
    render(<Harness onConfirm={vi.fn().mockRejectedValue(problem)} failure={failure} />);

    await userEvent.type(input(), "Acme Ltd");
    await userEvent.click(confirm());

    expect(failure).toHaveBeenCalledWith(problem);
    expect(within(dialog()).getByText("The server said no.")).toBeInTheDocument();
  });

  it("starts empty again after Cancel", async () => {
    render(<Harness onConfirm={vi.fn()} />);

    await userEvent.type(input(), "Acme");
    await userEvent.click(confirm());
    await userEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Reopen" }));

    expect(input()).toHaveValue("");
    expect(within(dialog()).queryByText("That isn't the name.")).not.toBeInTheDocument();
  });
});
