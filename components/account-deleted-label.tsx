"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Marks a person who deleted their account; their name is the one the organization kept. */
export function AccountDeletedLabel() {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className="text-muted-foreground" data-testid="account-deleted">
      {t.common.accountDeleted}
    </Badge>
  );
}
