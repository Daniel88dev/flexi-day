import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectField, TextField } from "../form-fields";

describe("TextField", () => {
  it("labels the input, reports typed text and marks an error", async () => {
    const onChange = vi.fn();
    render(<TextField id="name" label="Name" value="" onChange={onChange} error="Enter a name." />);

    const input = screen.getByLabelText("Name");
    await userEvent.type(input, "J");

    expect(onChange).toHaveBeenCalledWith("J");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
  });

  it("clears the value from its Clear button", async () => {
    const onChange = vi.fn();
    render(<TextField id="city" label="City" value="Brno" onChange={onChange} clearable />);

    await userEvent.click(screen.getByRole("button", { name: "Clear: City" }));

    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("SelectField", () => {
  it("renders a labelled select with its hint and reports the choice", async () => {
    const onChange = vi.fn();
    render(
      <SelectField id="dept" label="Department" hint="Optional." value="" onChange={onChange}>
        <option value="">None</option>
        <option value="eng">Engineering</option>
      </SelectField>
    );

    await userEvent.selectOptions(screen.getByLabelText("Department"), "eng");

    expect(onChange).toHaveBeenCalledWith("eng");
    expect(screen.getByText("Optional.")).toBeInTheDocument();
  });

  it("renders the bare control, named by its aria-label, without a label", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SelectField aria-label="Period" value="a" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </SelectField>
    );

    const select = screen.getByRole("combobox", { name: "Period" });
    await userEvent.selectOptions(select, "b");

    expect(onChange).toHaveBeenCalledWith("b");
    expect(container.querySelector("label")).toBeNull();
  });
});
