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
    expect(screen.getAllByRole("link", { name: /daniel@hrynusiw\.cz/ }).length).toBeGreaterThan(0);
  });

  it("Privacy page describes the attachments data category", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Support communications")).toBeInTheDocument();
    expect(screen.getByText("Request attachments")).toBeInTheDocument();
    expect(screen.getByText(/doctor.s note/)).toBeInTheDocument();
    expect(screen.getByText(/encrypted at rest on AWS in Frankfurt/)).toBeInTheDocument();
    expect(screen.getByText(/only you, the group.s approvers and its admins/)).toBeInTheDocument();
    expect(screen.getByText(/twelve months after the absence it belongs to/)).toBeInTheDocument();
  });

  it("Legal pages carry the current update date", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Last updated: 12 September 2026")).toBeInTheDocument();
  });

  it("Privacy page describes attendance location, its audience and its retention", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Attendance location")).toBeInTheDocument();
    expect(
      screen.getByText(/latitude, longitude and accuracy your browser reports/)
    ).toBeInTheDocument();
    expect(screen.getByText(/declining is neither recorded nor flagged/)).toBeInTheDocument();
    expect(
      screen.getByText(/visible to you and to the administrators of your organisation/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/erase them twelve months after the business date/)
    ).toBeInTheDocument();
  });

  it("Terms page puts the location agreement on the employer", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: "7. Attendance and employee location" })
    ).toBeInTheDocument();
    expect(screen.getByText(/It is your responsibility to inform the people/)).toBeInTheDocument();
    expect(
      screen.getByText(/records nothing about that agreement and cannot verify it/)
    ).toBeInTheDocument();
  });

  it("Terms page leaves the controller role with us, as the Privacy Policy claims it", () => {
    const { container } = render(<TermsPage />);
    // The Privacy Policy names flexiday the controller for everything it covers,
    // attendance location included. A clause here calling the customer one would
    // put the two published pages in direct conflict.
    expect(container.textContent).not.toMatch(/data controller/i);
  });

  it("Terms page renders its heading", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
  });

  it("Security page renders its heading and disclosure guidance", () => {
    render(<SecurityPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Security" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Responsible disclosure" })).toBeInTheDocument();
  });

  it("Security page explains how attachments are stored and reached", () => {
    render(<SecurityPage />);
    expect(screen.getByRole("heading", { name: "Attachments" })).toBeInTheDocument();
    expect(
      screen.getByText(/encrypted at rest, and are never reachable by a public link/)
    ).toBeInTheDocument();
  });

  it("Contact page renders its heading", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Contact us" })).toBeInTheDocument();
  });
});
