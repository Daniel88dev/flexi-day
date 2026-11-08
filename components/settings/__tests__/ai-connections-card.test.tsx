import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { MyAiConnections } from "@/lib/api/ai-connections";
import { AiConnectionsCard } from "../ai-connections-card";

let data: MyAiConnections | undefined;
let isError = false;
const disconnect = vi.fn();
const copyText = vi.fn();
const pushToast = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useMyAiConnections: () => ({ data, isError, isPending: !data && !isError }),
  useDisconnectAiConnection: () => ({ mutateAsync: disconnect, isPending: false }),
}));
vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => pushToast(...args),
  copyText: (text: string) => copyText(text),
}));

const HOUR = 60 * 60 * 1000;

const connections = (): MyAiConnections => ({
  serverUrl: "https://api.flexi-day.com/mcp",
  connections: [
    {
      grantId: "grant-claude",
      app: {
        clientId: "https://claude.ai/meta",
        name: "Claude",
        verified: true,
        host: "claude.ai",
      },
      organizationId: "org-1",
      organizationName: "Acme",
      access: "write",
      connectedAt: new Date(Date.now() - 5 * HOUR).toISOString(),
      lastUsedAt: new Date(Date.now() - 2 * HOUR).toISOString(),
    },
    {
      grantId: "grant-helper",
      app: { clientId: "abc", name: "Leave Helper", verified: false, host: "leavehelper.app" },
      organizationId: "org-2",
      organizationName: "Beta",
      access: "read",
      connectedAt: new Date(Date.now() - 5 * HOUR).toISOString(),
      lastUsedAt: new Date(Date.now() - 3 * HOUR).toISOString(),
    },
  ],
});

describe("AiConnectionsCard", () => {
  beforeEach(() => {
    data = connections();
    isError = false;
    disconnect.mockReset().mockResolvedValue(undefined);
    copyText.mockReset();
    pushToast.mockReset();
  });

  it("lists each app with its address, organization, access and last use", () => {
    renderWithClient(<AiConnectionsCard />);

    const items = within(screen.getByRole("list", { name: "AI connections" })).getAllByRole(
      "listitem"
    );
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("Claude")).toBeInTheDocument();
    expect(within(items[0]!).getByText("claude.ai")).toBeInTheDocument();
    expect(
      within(items[0]!).getByText("Acme · Read and write · last used 2 hours ago")
    ).toBeInTheDocument();
    expect(within(items[1]!).getByText("leavehelper.app · name not verified")).toBeInTheDocument();
    expect(
      within(items[1]!).getByText("Beta · Read only · last used 3 hours ago")
    ).toBeInTheDocument();
  });

  it("disconnects one app after the inline confirm", async () => {
    const user = userEvent.setup();
    renderWithClient(<AiConnectionsCard />);

    await user.click(screen.getByRole("button", { name: "Disconnect Leave Helper" }));
    expect(
      screen.getByText("Disconnect Leave Helper? It stops at its next call.")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(disconnect).toHaveBeenCalledWith("grant-helper");
    expect(pushToast).toHaveBeenCalledWith("Leave Helper is disconnected");
  });

  it("keeps the app when the member changes their mind", async () => {
    const user = userEvent.setup();
    renderWithClient(<AiConnectionsCard />);

    await user.click(screen.getByRole("button", { name: "Disconnect Claude" }));
    await user.click(screen.getByRole("button", { name: "Keep" }));

    expect(disconnect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Disconnect Claude" })).toBeInTheDocument();
  });

  it("says so when the disconnect fails", async () => {
    disconnect.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderWithClient(<AiConnectionsCard />);

    await user.click(screen.getByRole("button", { name: "Disconnect Claude" }));
    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(await screen.findByText("Could not disconnect the app")).toBeInTheDocument();
  });

  it("shows the empty state and the server address to copy", async () => {
    data = { serverUrl: "https://api.flexi-day.com/mcp", connections: [] };
    const user = userEvent.setup();
    renderWithClient(<AiConnectionsCard />);

    expect(screen.getByText("You haven't connected an AI app.")).toBeInTheDocument();
    expect(screen.getByText("Connect an AI app")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy the address" }));

    expect(copyText).toHaveBeenCalledWith("https://api.flexi-day.com/mcp");
    expect(pushToast).toHaveBeenCalledWith("Address copied");
  });

  it("says so when the list cannot load", () => {
    data = undefined;
    isError = true;
    renderWithClient(<AiConnectionsCard />);

    expect(screen.getByText("Could not load your AI connections.")).toBeInTheDocument();
  });
});
