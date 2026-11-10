import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichText } from "../rich-text";

describe("RichText", () => {
  it("should render bold, lists and paragraphs from the Assistant's Markdown", () => {
    const { container } = render(
      <RichText text={"You have **12** days left.\n\n- Vacation: 12\n- Sick days: 3"} />
    );
    expect(screen.getByText("12").tagName).toBe("STRONG");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("should drop images, inline and by reference, without leaving a link to them", () => {
    const { container } = render(
      <RichText
        text={
          "Look ![tracking pixel](https://evil.example/pixel.png) here.\n\n![logo][l]\n\n[l]: https://evil.example/logo.png"
        }
      />
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).not.toContain("evil.example");
    expect(container.textContent).toContain("Look");
  });

  it("should make links to our own origins clickable and any other link plain text", () => {
    render(
      <RichText
        text={[
          "[Requests](/requests)",
          "[Help](https://www.flexi-day.com/help/request-time-off/)",
          "[This app](http://localhost:3000/calendar)",
          "[Claim your prize](https://evil.example/login)",
          "Bare https://evil.example/bare too",
          "[Script](javascript:alert(1))",
          "[Protocol relative](//evil.example/x)",
        ].join("\n\n")}
      />
    );
    expect(screen.getByRole("link", { name: "Requests" }).getAttribute("href")).toBe("/requests");
    expect(screen.getByRole("link", { name: "Help" }).getAttribute("href")).toBe(
      "https://www.flexi-day.com/help/request-time-off/"
    );
    expect(screen.getByRole("link", { name: "This app" }).getAttribute("href")).toBe(
      "http://localhost:3000/calendar"
    );
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByText("Claim your prize").closest("a")).toBeNull();
    expect(screen.getByText("Script").closest("a")).toBeNull();
    expect(screen.getByText("Protocol relative").closest("a")).toBeNull();
    expect(screen.getByText(/Bare/).textContent).toContain("https://evil.example/bare");
  });

  it("should never turn raw HTML into elements", () => {
    const { container } = render(
      <RichText text={'Hi <img src=x onerror="alert(1)"> <a href="https://evil.example">x</a>'} />
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
});
