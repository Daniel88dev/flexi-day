import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectFallback, ConnectHeader } from "../connect-parts";
import { connectContext } from "./connect-fixtures";

describe("ConnectHeader", () => {
  it("shows the app's logo, name and host above the title", () => {
    const context = connectContext({
      client: { ...connectContext().client, logoUri: "https://claude.ai/logo.png" },
    });
    const { container } = render(<ConnectHeader context={context} title="Allow Claude?" />);

    expect(screen.getByRole("heading", { name: "Allow Claude?" })).toBeInTheDocument();
    expect(screen.getByText("Claude · claude.ai")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("src", "https://claude.ai/logo.png");
  });

  it("falls back to the host's initial when the app has no logo or name", () => {
    const context = connectContext({
      client: { ...connectContext().client, name: null, host: "cursor.com" },
    });
    render(<ConnectHeader context={context} title="t" />);

    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("cursor.com · cursor.com")).toBeInTheDocument();
  });
});

describe("ConnectFallback", () => {
  it("says the link expired for an invalid or failed read", () => {
    render(<ConnectFallback status="invalid" />);
    expect(screen.getByRole("alert")).toHaveTextContent("This link has expired");
  });

  it("shows a loading line while the context is on its way", () => {
    render(<ConnectFallback status="loading" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
