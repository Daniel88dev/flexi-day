import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "../privacy/page";
import TermsPage from "../terms/page";
import SecurityPage from "../security/page";
import ContactPage from "../contact/page";

describe("Legal pages", () => {
  it("Privacy page renders its heading and controller email", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /support@flexi-day\.com/ }).length).toBeGreaterThan(0);
  });

  it("Terms page renders its heading", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
  });

  it("Security page renders its heading and disclosure guidance", () => {
    render(<SecurityPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Security" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Responsible disclosure" })
    ).toBeInTheDocument();
  });

  it("Contact page renders its heading", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Contact us" })).toBeInTheDocument();
  });
});
