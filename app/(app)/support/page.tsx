"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { qk, useSupportOrganizations } from "@/lib/api/queries";
import { useSupportAdmin } from "@/lib/support/use-support-admin";
import { SupportGate } from "./support-gate";

function OrganizationSearch() {
  const { supportAdmin } = useSupportAdmin();
  const [query, setQuery] = useState("");
  // Fires on Enter, not per keystroke; the empty query lists newest orgs.
  const [submitted, setSubmitted] = useState("");
  const { data, isLoading, error } = useSupportOrganizations(submitted, supportAdmin);
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = query.trim();
            setSubmitted(next);
            // Re-pressing Enter with the same term must refetch — a debug
            // surface answering from a 30s-fresh cache hides a fix just made.
            if (next === submitted) {
              void queryClient.invalidateQueries({ queryKey: qk.supportOrganizations(next) });
            }
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by organization name, owner name or email, or org id — Enter to search"
            aria-label="Search organizations"
          />
          {/* Explicit submit target so Enter always submits, independent of
              the browser's implicit-submission rules for buttonless forms. */}
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        {error ? (
          <p className="text-sm text-[color:var(--danger)]">{(error as Error).message}</p>
        ) : null}
        {isLoading ? <p className="text-sm text-[color:var(--text-muted)]">Loading…</p> : null}

        {data ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Link
                      className="font-semibold underline-offset-2 hover:underline"
                      href={`/support/organization/?organizationId=${encodeURIComponent(org.id)}`}
                    >
                      {org.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {org.ownerName}{" "}
                    <span className="text-[color:var(--text-muted)]">({org.ownerEmail})</span>
                  </TableCell>
                  <TableCell>{org.liveGroups}</TableCell>
                  <TableCell>
                    {org.plan}
                    {org.status ? (
                      <span className="text-[color:var(--text-muted)]"> · {org.status}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {data.organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[color:var(--text-muted)]">
                    No organizations match.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function SupportPage() {
  return (
    <SupportGate>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            Read-only view across all organizations for debugging. Every request here is audited.
          </p>
        </div>
        <OrganizationSearch />
      </div>
    </SupportGate>
  );
}
