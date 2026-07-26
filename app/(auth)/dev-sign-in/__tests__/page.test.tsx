import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DevSignInPage from "../page.dev";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const okResponse = () =>
  Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify({ user: {} })) });

describe("DevSignInPage", () => {
  beforeEach(() => {
    replace.mockClear();
    fetchMock.mockReset().mockImplementation(okResponse);
    searchParams = new URLSearchParams();
  });

  it("lists the seeded accounts", () => {
    render(<DevSignInPage />);
    expect(screen.getByText("owner@dev.local")).toBeInTheDocument();
    expect(screen.getByText("carol@dev.local")).toBeInTheDocument();
  });

  it("signs in and redirects when an account is picked", async () => {
    const user = userEvent.setup();
    render(<DevSignInPage />);

    await user.click(screen.getByText("alice@dev.local"));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain("/api/dev/session");
    expect(JSON.parse(init.body as string)).toEqual({ email: "alice@dev.local" });
  });

  it("signs straight in when ?email= is present", async () => {
    searchParams = new URLSearchParams("email=bob@dev.local");
    render(<DevSignInPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({
      email: "bob@dev.local",
    });
  });

  it("surfaces a failed dev request instead of redirecting", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ errors: [{ message: "No such user" }] })),
      })
    );
    searchParams = new URLSearchParams("email=ghost@dev.local");
    render(<DevSignInPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No such user");
    expect(replace).not.toHaveBeenCalled();
  });
});
