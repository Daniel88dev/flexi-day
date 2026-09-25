"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGroup, useSubscription } from "@/lib/api/queries";
import { planLimitFromError } from "@/lib/billing/plan-limit-error";
import { useTranslation } from "@/lib/i18n/use-translation";

export function CreateGroupForm() {
  const { t } = useTranslation();
  const createGroup = useCreateGroup();
  const billingQuery = useSubscription();

  // A new group always lands in the creator's OWN organization
  // (`ensureOrganizationForUser` in `POST /api/group`), so the create form's
  // cap is theirs. A delegate administering someone else's Pro org would
  // otherwise be shown its roomy limits beside a button that creates a group
  // in a Free org of their own.
  const billing = billingQuery.data?.organization?.isOwner ? billingQuery.data : undefined;
  const atGroupCap = billing ? billing.usage.groupsUsed >= billing.entitlements.maxGroups : false;

  const [groupName, setGroupName] = useState("");
  const [defaultVacation, setDefaultVacation] = useState<number | "">(20);
  const [defaultHomeOffice, setDefaultHomeOffice] = useState<number | "">(60);
  const [createError, setCreateError] = useState<{
    message: string;
    isPlanLimit: boolean;
  } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await createGroup.mutateAsync({
        groupName,
        defaultVacation: typeof defaultVacation === "number" ? defaultVacation : undefined,
        defaultHomeOffice: typeof defaultHomeOffice === "number" ? defaultHomeOffice : undefined,
      });
      setGroupName("");
    } catch (err) {
      // A 402 carries the real limits — render the translated prompt rather
      // than the backend's English message.
      const planLimit = planLimitFromError(err);
      setCreateError(
        planLimit
          ? { message: t.billing.groupLimitReached(planLimit.limit), isPlanLimit: true }
          : {
              message: err instanceof Error ? err.message : t.groups.createFailed,
              isPlanLimit: false,
            }
      );
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="groupName">{t.groups.nameLabel}</Label>
        <Input
          id="groupName"
          required
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={t.groups.namePlaceholder}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dv">{t.groups.defaultVacation}</Label>
          <Input
            id="dv"
            type="number"
            min={0}
            max={99}
            value={defaultVacation}
            onChange={(e) =>
              setDefaultVacation(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dh">{t.groups.defaultHomeOffice}</Label>
          <Input
            id="dh"
            type="number"
            min={0}
            max={99}
            value={defaultHomeOffice}
            onChange={(e) =>
              setDefaultHomeOffice(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
      </div>
      {createError ? (
        <p className="text-destructive flex flex-wrap items-center gap-2 text-sm">
          <span>{createError.message}</span>
          {createError.isPlanLimit ? (
            <Link href="/billing" className="text-primary font-semibold underline">
              {t.billing.upgrade}
            </Link>
          ) : null}
        </p>
      ) : null}
      {billing ? (
        <p className="text-muted-foreground text-xs">
          {t.billing.groupsUsed(billing.usage.groupsUsed, billing.entitlements.maxGroups)}
        </p>
      ) : null}
      {atGroupCap ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled>
            {t.groups.create}
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/billing">
              <Sparkles className="h-3.5 w-3.5" />
              {t.billing.upgrade}
            </Link>
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={createGroup.isPending || !groupName}>
          {createGroup.isPending ? t.groups.creating : t.groups.create}
        </Button>
      )}
    </form>
  );
}
