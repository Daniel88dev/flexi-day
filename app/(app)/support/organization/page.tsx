"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSupportOrganization } from "@/lib/api/queries";
import { useSupportAdmin } from "@/lib/support/use-support-admin";
import { SupportGate } from "../support-gate";

function OrganizationDetail() {
  const { supportAdmin } = useSupportAdmin();
  const params = useSearchParams();
  const organizationId = params.get("organizationId");
  const { data, isLoading, error } = useSupportOrganization(organizationId, supportAdmin);

  // Without this, a truncated link would sit on "Loading…" forever — the
  // query is disabled when the id is absent, so nothing else ever renders.
  if (!organizationId)
    return (
      <p className="text-sm text-[color:var(--text-muted)]">
        No organization id in the URL.{" "}
        <Link href="/support" className="underline underline-offset-2">
          Back to Support
        </Link>
      </p>
    );

  if (error)
    return <p className="text-sm text-[color:var(--danger)]">{(error as Error).message}</p>;
  if (isLoading || !data) return <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/support"
          className="text-sm text-[color:var(--text-muted)] underline-offset-2 hover:underline"
        >
          ← Support
        </Link>
        <h1 className="text-2xl font-bold">{data.organization.name}</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          Owner: {data.owner.name} ({data.owner.email}) · Billing: {data.organization.billingEmail}{" "}
          · Created {new Date(data.organization.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            {data.plan.plan}
            {data.plan.status ? ` · ${data.plan.status}` : ""} · max {data.plan.maxGroups} groups ·
            max {data.plan.maxMembersPerGroup} members/group ·{" "}
            {data.plan.writable ? "writable" : "read-only"}
            {data.plan.graceEndsAt
              ? ` · grace ends ${new Date(data.plan.graceEndsAt).toLocaleDateString()}`
              : ""}
          </p>
          {data.organization.paddleCustomerId ? (
            <p className="text-[color:var(--text-muted)]">
              Paddle customer: {data.organization.paddleCustomerId}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Link
                      className="font-semibold underline-offset-2 hover:underline"
                      href={`/support/group/?groupId=${encodeURIComponent(group.id)}`}
                    >
                      {group.groupName}
                    </Link>
                  </TableCell>
                  <TableCell>{group.members}</TableCell>
                  <TableCell>
                    {group.deletedAt
                      ? `deleted ${new Date(group.deletedAt).toLocaleDateString()}`
                      : "live"}
                  </TableCell>
                  <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {data.groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-[color:var(--text-muted)]">
                    No groups.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.admins.map((admin) => (
                <TableRow key={admin.userId}>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.isOwner ? "owner" : "delegated admin"}</TableCell>
                  <TableCell>
                    {admin.grantedAt ? new Date(admin.grantedAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SupportOrganizationPage() {
  return (
    <SupportGate>
      <OrganizationDetail />
    </SupportGate>
  );
}
