"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinGroup, useJoinGroupByLink } from "@/lib/api/queries";
import { joinErrorMessage } from "@/lib/invites/invite-errors";
import { parseInviteInput } from "@/lib/invites/parse-invite-input";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Joins by a pasted invite link, which also verifies the address, or by a bare invite code. */
export function JoinGroupForm() {
  const { t } = useTranslation();
  const joinByCode = useJoinGroup();
  const joinByLink = useJoinGroupByLink();

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const pending = joinByCode.isPending || joinByLink.isPending;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const input = parseInviteInput(value);
    if (!input) return;
    if (input.kind === "broken-link") {
      setError(t.join.notFound);
      return;
    }
    try {
      if (input.kind === "link") await joinByLink.mutateAsync(input.token);
      else await joinByCode.mutateAsync(input.code);
      setSuccess(t.groups.joinSuccess);
      setValue("");
    } catch (err) {
      setError(joinErrorMessage(err, t));
    }
  }

  return (
    <form onSubmit={handleJoin} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="invite">{t.groups.inviteInput}</Label>
        <Input
          id="invite"
          required
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.groups.inviteInputPlaceholder}
        />
        <p className="text-muted-foreground text-xs">{t.groups.inviteInputHint}</p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {success ? <p className="text-sm text-green-700 dark:text-green-400">{success}</p> : null}
      <Button type="submit" variant="outline" disabled={pending || !value.trim()}>
        {pending ? t.groups.joining : t.groups.join}
      </Button>
    </form>
  );
}
