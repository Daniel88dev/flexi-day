import type { DirectoryOrganization } from "@/lib/api/directory";

export type DirectoryNavEntry = {
  /** Shown while the entry is there only as an upsell to the owner or an org admin. */
  enterpriseChip: boolean;
};

/** The owner or an org admin. */
export const administers = (organization: Pick<DirectoryOrganization, "role">) =>
  organization.role !== "MEMBER";

/**
 * Whether the People section carries a Directory entry. Everyone in a
 * Directory organization gets one. Otherwise only owners and org admins do,
 * with an Enterprise chip unless one of their organizations already passes the
 * plan gate. Members of organizations without the directory see nothing.
 */
export function directoryNavEntry(
  organizations: DirectoryOrganization[] | undefined
): DirectoryNavEntry | null {
  if (!organizations) return null;
  if (organizations.some((organization) => organization.enabled)) {
    return { enterpriseChip: false };
  }
  const administered = organizations.filter(administers);
  if (administered.length === 0) return null;
  return { enterpriseChip: !administered.some((organization) => organization.writable) };
}

/**
 * The organization the directory page opens: the first Directory organization,
 * else the first one the viewer administers. Owned organizations sort first.
 */
export function directoryHome(
  organizations: DirectoryOrganization[]
): DirectoryOrganization | null {
  const ordered = [...organizations].sort(
    (a, b) => Number(b.role === "OWNER") - Number(a.role === "OWNER")
  );
  return ordered.find((organization) => organization.enabled) ?? ordered.find(administers) ?? null;
}
