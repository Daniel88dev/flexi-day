import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AssistantOrganization } from "@/lib/api/assistant";
import { OrgPicker } from "../org-picker";

const organization = (overrides: Partial<AssistantOrganization>): AssistantOrganization => ({
  organizationId: "org-acme",
  organizationName: "Acme",
  eligible: true,
  reason: null,
  planAllows: true,
  role: "member",
  hasChats: false,
  weeklyLimit: null,
  ...overrides,
});

describe("OrgPicker", () => {
  it("should show only the label when locked", () => {
    render(
      <OrgPicker
        organizations={[organization({})]}
        leftOut={[]}
        value="org-acme"
        onChange={vi.fn()}
        locked
        label="Acme"
      />
    );
    expect(screen.getByText("Acme")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should list the organizations and pick one", async () => {
    const onChange = vi.fn();
    render(
      <OrgPicker
        organizations={[
          organization({}),
          organization({ organizationId: "org-globex", organizationName: "Globex" }),
        ]}
        leftOut={[
          organization({ organizationId: "org-x", organizationName: "Initech", planAllows: false }),
        ]}
        value="org-acme"
        onChange={onChange}
        locked={false}
        label="Acme"
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Acme" }));
    expect(screen.getByText("Initech isn't listed: the Assistant needs Enterprise.")).toBeVisible();
    await userEvent.click(screen.getByRole("option", { name: "Globex" }));
    expect(onChange).toHaveBeenCalledWith("org-globex");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
