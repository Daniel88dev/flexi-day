"use client";

import { TypeNameConfirmDialog } from "@/components/organization/type-name-confirm-dialog";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import { useDeleteAllDirectoryData } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Delete all directory data, confirmed with the organization's name typed. */
export function DeleteDirectoryDataDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}) {
  const { t } = useTranslation();
  const copy = t.organization.directory.deleteDialog;
  const deleteAll = useDeleteAllDirectoryData(organizationId);

  return (
    <TypeNameConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      name={organizationName}
      inputId="delete-directory-data-name"
      title={copy.title}
      description={copy.body}
      nameLabel={copy.nameLabel(organizationName)}
      mismatch={copy.nameMismatch}
      confirmLabel={deleteAll.isPending ? copy.working : copy.confirm}
      pending={deleteAll.isPending}
      onConfirm={async (typed) => {
        await deleteAll.mutateAsync(typed);
        pushToast(copy.done);
      }}
      failureMessage={(err) =>
        errorCopy(
          err,
          { NAME_MISMATCH: copy.nameMismatch, DIRECTORY_ON: copy.directoryOn },
          copy.failed
        )
      }
    >
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {copy.removes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">{copy.keeps}</p>
    </TypeNameConfirmDialog>
  );
}
