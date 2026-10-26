"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorCopy } from "@/lib/api/client";
import { DIRECTORY_ROLE_NAMES, type DirectoryRoleName } from "@/lib/api/directory";
import { useDirectoryRoles, useSetDirectoryRoles } from "@/lib/api/queries";
import { LapsedNote } from "@/components/directory/directory-lapsed-banner";
import { useTranslation } from "@/lib/i18n/use-translation";

/** HR and Leadership: the owner assigns them, org admins and HR see who holds them. */
export function DirectoryRolesPanel({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings;
  const roleNames = t.directory.profile.directoryRoleNames;
  const roles = useDirectoryRoles(organizationId, true);
  const update = useSetDirectoryRoles(organizationId);

  const body = () => {
    if (roles.error) return <p className="text-destructive text-sm">{copy.rolesLoadFailed}</p>;
    if (!roles.data) return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
    const { editable, writable } = roles.data;

    if (!editable) {
      const holders = roles.data.people.filter((person) => person.roles.length > 0);
      if (holders.length === 0) {
        return <p className="text-muted-foreground text-sm">{copy.rolesEmpty}</p>;
      }
      return (
        <ul className="divide-border divide-y text-sm">
          {holders.map((person) => (
            <li key={person.employmentId} className="flex flex-wrap items-center gap-2 py-2">
              <span className="font-medium">{person.name}</span>
              {person.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {roleNames[role]}
                </Badge>
              ))}
            </li>
          ))}
        </ul>
      );
    }

    if (roles.data.people.length === 0) {
      return <p className="text-muted-foreground text-sm">{copy.rolesNobody}</p>;
    }
    const toggle = (employmentId: string, held: DirectoryRoleName[], role: DirectoryRoleName) =>
      update.mutate({
        employmentId,
        roles: held.includes(role)
          ? held.filter((name) => name !== role)
          : DIRECTORY_ROLE_NAMES.filter((name) => name === role || held.includes(name)),
      });

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.personColumn}</TableHead>
            {DIRECTORY_ROLE_NAMES.map((role) => (
              <TableHead key={role} className="w-28 text-center">
                {roleNames[role]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.data.people.map((person) => (
            <TableRow key={person.employmentId}>
              <TableCell className="font-medium">{person.name}</TableCell>
              {DIRECTORY_ROLE_NAMES.map((role) => {
                const held = person.roles.includes(role);
                return (
                  <TableCell key={role} className="text-center">
                    <Checkbox
                      className="mx-auto"
                      aria-label={copy.roleToggle(roleNames[role], person.name)}
                      checked={held}
                      disabled={update.isPending || (!held && !writable)}
                      onCheckedChange={() => toggle(person.employmentId, person.roles, role)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.roles}</CardTitle>
        <CardDescription>{copy.rolesIntro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {roles.data && !roles.data.editable ? (
          <p className="text-muted-foreground text-sm">{copy.readOnlyNote}</p>
        ) : roles.data && !roles.data.writable ? (
          <LapsedNote>{copy.rolesLapsedNote}</LapsedNote>
        ) : null}
        {update.error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorCopy(update.error, copy.roleErrors, copy.roleSaveFailed)}
          </p>
        ) : null}
        {body()}
      </CardContent>
    </Card>
  );
}
