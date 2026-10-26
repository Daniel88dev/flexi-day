import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YourDataCard } from "../your-data-card";

const downloadMock = vi.fn();
const saveBlobMock = vi.fn();
const pushToastMock = vi.fn();

vi.mock("@/lib/api/account-export", () => ({
  downloadAccountExport: () => downloadMock(),
}));

vi.mock("@/lib/api/reports", () => ({
  saveBlob: (...args: unknown[]) => saveBlobMock(...args),
}));

vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => pushToastMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("YourDataCard", () => {
  it("downloads the account data and saves it under the server's filename", async () => {
    const blob = new Blob(["{}"]);
    downloadMock.mockResolvedValue({ blob, filename: "flexi-day-account-2026-10-25.json" });
    render(<YourDataCard />);

    expect(screen.getByText("Your data")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Download my account data" }));

    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect(saveBlobMock).toHaveBeenCalledWith(blob, "flexi-day-account-2026-10-25.json");
    expect(pushToastMock).toHaveBeenCalledWith("Account data downloaded.");
  });

  it("shows the failure and saves nothing when the download fails", async () => {
    downloadMock.mockRejectedValue(new Error("Not signed in"));
    render(<YourDataCard />);

    await userEvent.click(screen.getByRole("button", { name: "Download my account data" }));

    expect(await screen.findByText("Not signed in")).toBeInTheDocument();
    expect(saveBlobMock).not.toHaveBeenCalled();
    expect(pushToastMock).toHaveBeenCalledWith("Not signed in", "danger");
  });

  it("renders further entries passed in below the account data", () => {
    render(
      <YourDataCard>
        <p>Organization exports</p>
      </YourDataCard>
    );

    expect(screen.getByText("Organization exports")).toBeInTheDocument();
  });
});
