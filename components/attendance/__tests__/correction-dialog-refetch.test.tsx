import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NO_SESSION_LOCATION, renderWithClient } from "@/lib/test-utils";
import type {
  AttendanceBreakSpan,
  AttendanceCorrection,
  AttendanceDaySessions,
  AttendanceSession,
} from "@/lib/api/attendance";
import { CorrectionDialog } from "../correction-dialog";

const ZONE = "Europe/Prague";

// The server as the dialog's reads see it: every landed write changes it, and
// every read answers with a fresh copy, so a refetch reaches the dialog.
let server: AttendanceSession;
let added = 0;

const answer = (): AttendanceDaySessions => ({
  organizationId: "org-1",
  employmentId: "emp-1",
  userId: "user-1",
  businessDate: "2026-09-09",
  timezone: ZONE,
  sessions: [structuredClone(server)],
});

const dayRead = vi.fn(async () => answer());
const correctSession = vi.fn(async (_id: string, patch: AttendanceCorrection) => {
  server = { ...server, ...patch };
  return structuredClone(server);
});
const correctBreak = vi.fn(async (id: string, patch: AttendanceCorrection) => {
  server = {
    ...server,
    breaks: server.breaks.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
  };
  return structuredClone(server);
});
const addBreak = vi.fn(async (sessionId: string, span: AttendanceBreakSpan) => {
  added += 1;
  server = {
    ...server,
    breaks: [
      ...server.breaks,
      { id: `server-${added}`, sessionId, ...span, autoClosed: false, open: false },
    ],
  };
  return structuredClone(server);
});

vi.mock("@/lib/api/attendance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/attendance")>()),
  getAttendanceDay: () => dayRead(),
  getSessionEvents: async () => [],
  correctSession: (id: string, patch: AttendanceCorrection) => correctSession(id, patch),
  correctBreak: (id: string, patch: AttendanceCorrection) => correctBreak(id, patch),
  addBreak: (sessionId: string, span: AttendanceBreakSpan) => addBreak(sessionId, span),
}));

const deferred = () => {
  let reject!: (error: unknown) => void;
  const promise = new Promise<AttendanceSession>((_, fail) => (reject = fail));
  return { promise, reject };
};

const open = async () => {
  const onOpenChange = vi.fn();
  const rendered = renderWithClient(
    <CorrectionDialog
      organizationId="org-1"
      businessDate="2026-09-09"
      open
      onOpenChange={onOpenChange}
    />
  );
  await screen.findByLabelText("Clock out");
  return { ...rendered, onOpenChange };
};

const typeNewBreak = async (user: ReturnType<typeof userEvent.setup>, from: string, to: string) => {
  await user.click(screen.getByRole("button", { name: "Add break" }));
  const starts = screen.getAllByLabelText("Breaks");
  const ends = screen.getAllByLabelText("to");
  await user.type(starts[starts.length - 1]!, from);
  await user.type(ends[ends.length - 1]!, to);
};

describe("CorrectionDialog", () => {
  describe("after a save that fails partway", () => {
    beforeEach(() => {
      added = 0;
      server = {
        id: "session-1",
        businessDate: "2026-09-09",
        // 08:05 to 17:10 in Prague, with a break from 12:00 to 12:30.
        startedAt: "2026-09-09T06:05:00.000Z",
        endedAt: "2026-09-09T15:10:00.000Z",
        timezone: ZONE,
        closedBy: "USER",
        open: false,
        ...NO_SESSION_LOCATION,
        breaks: [
          {
            id: "break-1",
            sessionId: "session-1",
            startedAt: "2026-09-09T10:00:00.000Z",
            endedAt: "2026-09-09T10:30:00.000Z",
            autoClosed: false,
            open: false,
          },
        ],
      };
      for (const mock of [dayRead, correctSession, correctBreak, addBreak]) mock.mockClear();
    });

    it("keeps the unsaved draft and the failure through the refetch, then sends only the rest", async () => {
      const user = userEvent.setup();
      const pending = deferred();
      correctBreak.mockImplementationOnce(() => pending.promise);
      const { client, onOpenChange } = await open();

      await user.clear(screen.getByLabelText("Clock out"));
      await user.type(screen.getByLabelText("Clock out"), "17:30");
      await user.clear(screen.getAllByLabelText("to")[0]!);
      await user.type(screen.getAllByLabelText("to")[0]!, "12:45");
      await typeNewBreak(user, "15:00", "15:20");
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      // The session patch landed and its refetch reached the row while the break patch was still out.
      expect(await screen.findByText("Was 17:30")).toBeInTheDocument();
      pending.reject(new Error("connection dropped"));

      expect(await screen.findByText("Could not save the correction.")).toBeInTheDocument();
      await waitFor(() => expect(client.isFetching()).toBe(0));
      expect(dayRead.mock.calls.length).toBeGreaterThanOrEqual(3);

      expect(screen.getByText("Could not save the correction.")).toBeInTheDocument();
      expect(screen.getByLabelText("Clock out")).toHaveValue("17:30");
      expect(screen.getAllByLabelText("to")[0]).toHaveValue("12:45");
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getAllByLabelText("Breaks")[1]).toHaveValue("15:00");
      expect(addBreak).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Save correction" }));

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(correctSession).toHaveBeenCalledTimes(1);
      expect(correctBreak).toHaveBeenCalledTimes(2);
      expect(correctBreak).toHaveBeenLastCalledWith("break-1", {
        endedAt: "2026-09-09T10:45:00.000Z",
      });
      expect(addBreak).toHaveBeenCalledTimes(1);
      expect(addBreak).toHaveBeenCalledWith("session-1", {
        startedAt: "2026-09-09T13:00:00.000Z",
        endedAt: "2026-09-09T13:20:00.000Z",
      });
    });

    it("adds a break that landed only once when the reader retries", async () => {
      const user = userEvent.setup();
      addBreak.mockImplementationOnce(addBreak.getMockImplementation()!);
      addBreak.mockRejectedValueOnce(new Error("connection dropped"));
      const { client, onOpenChange } = await open();

      await typeNewBreak(user, "15:00", "15:20");
      await typeNewBreak(user, "16:00", "16:10");
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      expect(await screen.findByText("Could not save the correction.")).toBeInTheDocument();
      await waitFor(() => expect(dayRead).toHaveBeenCalledTimes(3));
      await waitFor(() => expect(client.isFetching()).toBe(0));

      expect(screen.getByText("Could not save the correction.")).toBeInTheDocument();
      expect(screen.getAllByLabelText("Breaks")).toHaveLength(3);
      expect(screen.getAllByText("New")).toHaveLength(1);
      expect(screen.getAllByLabelText("Breaks")[2]).toHaveValue("16:00");

      await user.click(screen.getByRole("button", { name: "Save correction" }));

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(addBreak).toHaveBeenCalledTimes(3);
      expect(addBreak).toHaveBeenLastCalledWith("session-1", {
        startedAt: "2026-09-09T14:00:00.000Z",
        endedAt: "2026-09-09T14:10:00.000Z",
      });
      expect(server.breaks).toHaveLength(3);
    });

    it("shows a landed break once when the server answers with times it rounded", async () => {
      const user = userEvent.setup();
      const shifted = (iso: string) => new Date(Date.parse(iso) + 30_000).toISOString();
      addBreak.mockImplementationOnce(async (sessionId, span) => {
        server = {
          ...server,
          breaks: [
            ...server.breaks,
            {
              id: "server-1",
              sessionId,
              startedAt: shifted(span.startedAt),
              endedAt: shifted(span.endedAt),
              autoClosed: false,
              open: false,
            },
          ],
        };
        return structuredClone(server);
      });
      addBreak.mockRejectedValueOnce(new Error("connection dropped"));
      const { client } = await open();

      await typeNewBreak(user, "15:00", "15:20");
      await typeNewBreak(user, "16:00", "16:10");
      await user.click(screen.getByRole("button", { name: "Save correction" }));

      expect(await screen.findByText("Could not save the correction.")).toBeInTheDocument();
      await waitFor(() => expect(dayRead).toHaveBeenCalledTimes(3));
      await waitFor(() => expect(client.isFetching()).toBe(0));

      expect(
        screen.getAllByLabelText("Breaks").map((input) => input.getAttribute("value"))
      ).toEqual(["12:00", "15:00", "16:00"]);
      expect(screen.getByRole("button", { name: "Save correction" })).toBeEnabled();
    });
  });
});
