import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GoogleIcon, MicrosoftIcon } from "../provider-icons";

describe("provider icons", () => {
  it.each([
    ["Google", GoogleIcon],
    ["Microsoft", MicrosoftIcon],
  ] as const)("renders %s at the requested size", (_name, Icon) => {
    const { container } = render(<Icon size={20} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
    // Decorative: the button beside it carries the accessible name, so a
    // second announcement would just repeat the provider.
    expect(svg).toHaveAttribute("aria-hidden");
  });

  it.each([
    ["Google", GoogleIcon],
    ["Microsoft", MicrosoftIcon],
  ] as const)("defaults %s to the inline size used beside button text", (_name, Icon) => {
    const { container } = render(<Icon />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "18");
  });
});
