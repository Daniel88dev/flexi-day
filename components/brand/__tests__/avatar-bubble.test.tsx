import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvatarBubble, AvatarStack } from "../avatar-bubble";

describe("AvatarBubble", () => {
  it("renders initials", () => {
    render(<AvatarBubble initials="DH" background="#000" name="Dana Holt" />);
    expect(screen.getByText("DH")).toBeInTheDocument();
  });
});

describe("AvatarStack", () => {
  const people = [
    { id: "a", name: "Aisha", initials: "AK", av: "#111" },
    { id: "b", name: "Bree", initials: "BR", av: "#222" },
    { id: "c", name: "Casey", initials: "CS", av: "#333" },
    { id: "d", name: "Dana", initials: "DH", av: "#444" },
  ];

  it("renders only `max` avatars and shows an overflow chip", () => {
    render(<AvatarStack people={people} size={30} max={2} />);
    expect(screen.getByText("AK")).toBeInTheDocument();
    expect(screen.getByText("BR")).toBeInTheDocument();
    expect(screen.queryByText("CS")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
