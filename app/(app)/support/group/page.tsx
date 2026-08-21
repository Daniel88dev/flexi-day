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
import { useSupportGroup } from "@/lib/api/queries";
import { useSupportAdmin } from "@/lib/support/use-support-admin";
import { SupportGate } from "../support-gate";

function vacationState(v: {
  approvedAt: string | null;
  rejectedAt: string | null;
  deletedAt: string | null;
}): string {
  if (v.deletedAt) return "cancelled";
  if (v.rejectedAt) return "rejected";
  if (v.approvedAt) return "approved";
  return "pending";
}

function GroupDetail() {
  const { supportAdmin } = useSupportAdmin();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const { data, isLoading, error } = useSupportGroup(groupId, supportAdmin);

  // Same reason as the organization page: a missing id disables the query,
  // which would otherwise leave a permanent "Loading…".
  if (!groupId)
    return (
      <p className="text-sm text-[color:var(--text-muted)]">
        No group id in the URL.{" "}
        <Link href="/support" className="underline underline-offset-2">
          Back to Support
        </Link>
      </p>
    );

  if (error)
    return <p className="text-sm text-[color:var(--danger)]">{(error as Error).message}</p>;
  if (isLoading || !data) return <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>;

  const { group } = data;
  const memberNames = new Map(data.members.map((member) => [member.userId, member.name]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/support/organization/?organizationId=${encodeURIComponent(group.organizationId)}`}
          className="text-sm text-[color:var(--text-muted)] underline-offset-2 hover:underline"
        >
          ← {group.organizationName}
        </Link>
        <h1 className="text-2xl font-bold">
          {group.groupName}
          {group.deletedAt ? (
            <span className="ml-2 text-base font-semibold text-[color:var(--danger)]">
              (deleted {new Date(group.deletedAt).toLocaleDateString()})
            </span>
          ) : null}
        </h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          Defaults: {group.defaultVacationDays} vacation / {group.defaultHomeOfficeDays} home office
          · Working days: {group.workingDays.join(", ")} · Holidays: {group.holidayCountry ?? "off"}{" "}
          · Manager: {group.managerUserId} · Approver: {group.mainApprovalUser ?? "—"}
          {group.tempApprovalUser ? ` (temp ${group.tempApprovalUser})` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell className="text-[color:var(--text-muted)]">
                    {[
                      member.adminAccess ? "admin" : null,
                      member.approverAccess ? "approver" : null,
                      member.viewAccess ? "view" : null,
                      member.controlledUser ? "controlled" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "member"}
                  </TableCell>
                  <TableCell>
                    {member.deletedAt
                      ? `removed ${new Date(member.deletedAt).toLocaleDateString()}`
                      : "active"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quotas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Vacation</TableHead>
                <TableHead>Home office</TableHead>
                <TableHead>Carried over</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.quotas.map((quota) => (
                <TableRow key={`${quota.userId}-${quota.relatedYear}`}>
                  <TableCell>{memberNames.get(quota.userId) ?? quota.userId}</TableCell>
                  <TableCell>{quota.relatedYear}</TableCell>
                  <TableCell>{quota.vacationDays}</TableCell>
                  <TableCell>{quota.homeOfficeDays}</TableCell>
                  <TableCell>{quota.carriedOverDays}</TableCell>
                </TableRow>
              ))}
              {data.quotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[color:var(--text-muted)]">
                    No quota rows.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vacations (latest {data.vacations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vacations.map((vacation) => (
                <TableRow key={vacation.id}>
                  <TableCell>{vacation.requestedDay}</TableCell>
                  <TableCell>{vacation.userName}</TableCell>
                  <TableCell>
                    {vacation.vacationType}
                    {vacation.halfDay ? " (half)" : ""}
                  </TableCell>
                  <TableCell>{vacationState(vacation)}</TableCell>
                  <TableCell>{new Date(vacation.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {data.vacations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[color:var(--text-muted)]">
                    No vacation rows.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SupportGroupPage() {
  return (
    <SupportGate>
      <GroupDetail />
    </SupportGate>
  );
}
