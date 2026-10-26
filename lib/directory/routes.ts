const withParams = (path: string, params: Record<string, string>) =>
  `${path}?${Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;

export const directoryHref = (organizationId: string) =>
  withParams("/directory", { organizationId });

export const organizationHref = (organizationId: string) =>
  withParams("/organization", { organizationId });

export const profileHref = (organizationId: string, employmentId: string) =>
  withParams("/directory/person", { organizationId, employmentId });

/** `anchor` scrolls the edit page to one of its blocks, such as `record`. */
export const profileEditHref = (organizationId: string, employmentId: string, anchor?: string) =>
  `${withParams("/directory/person/edit", { organizationId, employmentId })}${anchor ? `#${anchor}` : ""}`;
