import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MultiSelect } from "../multi-select";
import { renderWithClient } from "@/lib/test-utils";

const options = [
  { value: "g1", label: "Engineering" },
  { value: "g2", label: "Design" },
];

function setup(selected: string[] = []) {
  const onChange = vi.fn();
  renderWithClient(
    <MultiSelect
      label="Groups"
      allLabel="All groups"
      options={options}
      selected={selected}
      onChange={onChange}
    />
  );
  return { onChange };
}

describe("MultiSelect", () => {
  it("shows the all-label while nothing is selected", () => {
    setup();

    expect(screen.getByRole("button", { name: "Groups" })).toHaveTextContent("All groups");
  });

  it("shows a count once options are selected", () => {
    setup(["g1"]);

    expect(screen.getByRole("button", { name: "Groups" })).toHaveTextContent("1 selected");
  });

  it("adds an option on click", () => {
    const { onChange } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Groups" }));
    fireEvent.click(screen.getByRole("option", { name: "Design" }));

    expect(onChange).toHaveBeenCalledWith(["g2"]);
  });

  it("removes an already selected option on click", () => {
    const { onChange } = setup(["g1", "g2"]);

    fireEvent.click(screen.getByRole("button", { name: "Groups" }));
    fireEvent.click(screen.getByRole("option", { name: "Engineering" }));

    expect(onChange).toHaveBeenCalledWith(["g2"]);
  });

  it("clears the whole selection", () => {
    const { onChange } = setup(["g1"]);

    fireEvent.click(screen.getByRole("button", { name: "Groups" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
