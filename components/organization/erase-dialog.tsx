"use client";

import { TypeNameConfirmDialog } from "@/components/organization/type-name-confirm-dialog";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import type { EmploymentListItem } from "@/lib/api/employment";
import { useEraseEmployment } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

export function EraseDialog({
  open,
  onOpenChange,
  employment,
  organizationId,
  onErased,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employment: Pick<EmploymentListItem, "id" | "ended" | "user">;
  organizationId: string | null;
  /** The record is gone: a page showing it should move on. */
  onErased?: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.organization.people.eraseDialog;
  const erase = useEraseEmployment(organizationId);
  const name = employment.user.name;

  return (
    <TypeNameConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      name={name}
      inputId={`erase-${employment.id}`}
      title={copy.title(name)}
      description={copy.body}
      nameLabel={copy.nameLabel(name)}
      mismatch={copy.nameMismatch}
      confirmLabel={copy.confirm}
      pending={erase.isPending}
      onConfirm={async (typed) => {
        await erase.mutateAsync({ employmentId: employment.id, confirmName: typed });
        pushToast(copy.done(name));
        onErased?.();
      }}
      failureMessage={(err) =>
        errorCopy(
          err,
          { NAME_MISMATCH: copy.nameMismatch, MANAGES_GROUP: copy.managesGroup },
          copy.failed
        )
      }
    >
      <p className="text-muted-foreground text-sm">{copy.others}</p>
      {employment.ended ? null : <p className="text-sm">{copy.openFirst}</p>}
    </TypeNameConfirmDialog>
  );
}
