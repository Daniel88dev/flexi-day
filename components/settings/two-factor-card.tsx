"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import { authClient, useSession } from "@/lib/auth-client";
import { twoFactorErrorKey } from "@/lib/auth/two-factor";
import { useTranslation } from "@/lib/i18n/use-translation";

type Flow = "enable" | "backup" | "totp" | "disable";

type EnableStep = "password" | "backup" | "method" | "totp" | "otp";

/**
 * Enabling, managing and disabling the second sign-in factor. Password-only
 * by design — the parent renders this card under the same credential-account
 * gate as the change-password card, and the backend never challenges social
 * sign-in. Every flow starts with the password: better-auth requires it on
 * enable/disable/get-totp-uri/generate-backup-codes, so a hijacked session
 * cannot silently weaken the account.
 *
 * `enable()` is never called while 2FA is on — it would silently rotate the
 * secret and invalidate every saved backup code. The enabled-state actions go
 * through `getTotpUri`/`generateBackupCodes` instead.
 */
export function TwoFactorCard() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const enabled = session?.user?.twoFactorEnabled === true;

  const [flow, setFlow] = useState<Flow | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t.settings.twoFactor.title}</CardTitle>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? t.settings.twoFactor.statusEnabled : t.settings.twoFactor.statusDisabled}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{t.settings.twoFactor.hint}</p>
        {enabled ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setFlow("totp")}>
              {t.settings.twoFactor.setupTotp}
            </Button>
            <Button variant="outline" onClick={() => setFlow("backup")}>
              {t.settings.twoFactor.regenerateBackup}
            </Button>
            <Button variant="destructive" onClick={() => setFlow("disable")}>
              {t.settings.twoFactor.disable}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setFlow("enable")}>{t.settings.twoFactor.enable}</Button>
        )}

        {flow === "enable" ? <EnableDialog onClose={() => setFlow(null)} /> : null}
        {flow === "totp" ? <SetupTotpDialog onClose={() => setFlow(null)} /> : null}
        {flow === "backup" ? <RegenerateBackupDialog onClose={() => setFlow(null)} /> : null}
        {flow === "disable" ? <DisableDialog onClose={() => setFlow(null)} /> : null}
      </CardContent>
    </Card>
  );
}

function useVerifyErrorText() {
  const { t } = useTranslation();
  return (error: { status?: number; code?: string | null; message?: string | null }) => {
    const key = twoFactorErrorKey(error.status, error.code);
    // The shared strings say "sign in again" — wrong advice inside a settings
    // dialog, where the remedy is requesting a fresh code.
    if (key === "tooManyAttempts") return t.settings.twoFactor.tooManyAttempts;
    return t.auth.twoFactor.errors[key];
  };
}

function PasswordStep({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (password: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
      className="space-y-4"
    >
      <p className="text-muted-foreground text-sm">{t.settings.twoFactor.passwordHint}</p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="twoFactorPassword">{t.settings.twoFactor.password}</Label>
        <Input
          id="twoFactorPassword"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || password === ""}>
          {busy ? t.settings.twoFactor.working : t.settings.twoFactor.continue}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t.settings.twoFactor.backupHint}</p>
      <div className="bg-muted grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg p-4 font-mono text-sm">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(codes.join("\n")).then(
              () => pushToast(t.settings.twoFactor.copied),
              () => pushToast(t.settings.twoFactor.copyFailed, "danger"),
            );
          }}
        >
          {t.settings.twoFactor.copyCodes}
        </Button>
        <Button onClick={onDone}>{t.settings.twoFactor.savedThem}</Button>
      </div>
    </div>
  );
}

function CodeVerifyForm({
  onVerify,
  busy,
  error,
}: {
  onVerify: (code: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onVerify(code.trim());
      }}
      className="space-y-4"
    >
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="twoFactorCode">{t.settings.twoFactor.code}</Label>
        <Input
          id="twoFactorCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t.settings.twoFactor.codePlaceholder}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || code.trim() === ""}>
          {busy ? t.settings.twoFactor.verifying : t.settings.twoFactor.verify}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TotpUriPanel({ totpURI }: { totpURI: string }) {
  const { t } = useTranslation();
  const secret = (() => {
    try {
      return new URL(totpURI).searchParams.get("secret") ?? "";
    } catch {
      return "";
    }
  })();
  return (
    <div className="space-y-3">
      <div className="mx-auto w-fit rounded-lg bg-white p-3">
        <QRCode value={totpURI} size={168} />
      </div>
      {secret ? (
        <div>
          <p className="text-muted-foreground text-xs">{t.settings.twoFactor.totpManual}</p>
          <p className="font-mono text-xs break-all select-all">{secret}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Password → backup codes → method choice → verify. Abandoning any step is
 * safe: the flag only flips when a code is verified. */
function EnableDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const verifyErrorText = useVerifyErrorText();
  const [step, setStep] = useState<EnableStep>("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  async function start(password: string) {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.enable({ password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? t.settings.twoFactor.actionFailed);
      return;
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
    setStep("backup");
  }

  async function chooseOtp() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.sendOtp();
    setBusy(false);
    if (result.error) {
      setError(t.settings.twoFactor.sendFailed);
      return;
    }
    setStep("otp");
  }

  async function verify(kind: "totp" | "otp", code: string) {
    setBusy(true);
    setError(null);
    const result =
      kind === "totp"
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyOtp({ code });
    setBusy(false);
    if (result.error) {
      setError(verifyErrorText(result.error));
      return;
    }
    pushToast(t.settings.twoFactor.enabledToast);
    onClose();
  }

  const titles: Record<EnableStep, string> = {
    password: t.settings.twoFactor.enable,
    backup: t.settings.twoFactor.backupTitle,
    method: t.settings.twoFactor.methodTitle,
    totp: t.settings.twoFactor.totpTitle,
    otp: t.settings.twoFactor.otpTitle,
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[step]}</DialogTitle>
          {step === "totp" ? (
            <DialogDescription>{t.settings.twoFactor.totpHint}</DialogDescription>
          ) : null}
          {step === "otp" ? (
            <DialogDescription>{t.settings.twoFactor.otpHint}</DialogDescription>
          ) : null}
        </DialogHeader>
        {step === "password" ? <PasswordStep onSubmit={start} busy={busy} error={error} /> : null}
        {step === "backup" ? (
          <BackupCodes codes={backupCodes} onDone={() => setStep("method")} />
        ) : null}
        {step === "method" ? (
          <div className="space-y-3">
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <button
              type="button"
              className="hover:bg-muted w-full rounded-lg border p-3 text-left"
              onClick={() => setStep("totp")}
            >
              <span className="block text-sm font-medium">{t.settings.twoFactor.methodTotp}</span>
              <span className="text-muted-foreground block text-xs">
                {t.settings.twoFactor.methodTotpHint}
              </span>
            </button>
            <button
              type="button"
              className="hover:bg-muted w-full rounded-lg border p-3 text-left disabled:opacity-50"
              onClick={() => void chooseOtp()}
              disabled={busy}
            >
              <span className="block text-sm font-medium">{t.settings.twoFactor.methodOtp}</span>
              <span className="text-muted-foreground block text-xs">
                {t.settings.twoFactor.methodOtpHint}
              </span>
            </button>
          </div>
        ) : null}
        {step === "totp" ? (
          <div className="space-y-4">
            <TotpUriPanel totpURI={totpURI} />
            <CodeVerifyForm onVerify={(code) => void verify("totp", code)} busy={busy} error={error} />
          </div>
        ) : null}
        {step === "otp" ? (
          <div className="space-y-4">
            <CodeVerifyForm onVerify={(code) => void verify("otp", code)} busy={busy} error={error} />
            <button
              type="button"
              className="text-primary text-sm font-semibold hover:underline disabled:opacity-50"
              onClick={() => void chooseOtp()}
              disabled={busy}
            >
              {t.settings.twoFactor.resend}
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Lets an email-only enrollee link an authenticator later: password →
 * existing secret's QR → verify. Never calls enable(), so nothing rotates. */
function SetupTotpDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const verifyErrorText = useVerifyErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpURI, setTotpURI] = useState<string | null>(null);

  async function start(password: string) {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.getTotpUri({ password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? t.settings.twoFactor.actionFailed);
      return;
    }
    setTotpURI(result.data.totpURI);
  }

  async function verify(code: string) {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (result.error) {
      setError(verifyErrorText(result.error));
      return;
    }
    pushToast(t.settings.twoFactor.enabledToast);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.settings.twoFactor.totpTitle}</DialogTitle>
          {totpURI ? <DialogDescription>{t.settings.twoFactor.totpHint}</DialogDescription> : null}
        </DialogHeader>
        {totpURI ? (
          <div className="space-y-4">
            <TotpUriPanel totpURI={totpURI} />
            <CodeVerifyForm onVerify={(code) => void verify(code)} busy={busy} error={error} />
          </div>
        ) : (
          <PasswordStep onSubmit={start} busy={busy} error={error} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Replaces every saved code — password → fresh codes, shown once. */
function RegenerateBackupDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  async function start(password: string) {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.generateBackupCodes({ password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? t.settings.twoFactor.actionFailed);
      return;
    }
    setCodes(result.data.backupCodes);
  }

  return (
    // Once fresh codes are on screen the old ones are already invalid, so
    // Esc/overlay dismissal is blocked — only "I saved them" closes.
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !codes) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.settings.twoFactor.backupTitle}</DialogTitle>
        </DialogHeader>
        {codes ? (
          <BackupCodes codes={codes} onDone={onClose} />
        ) : (
          <PasswordStep onSubmit={start} busy={busy} error={error} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DisableDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disable(password: string) {
    setBusy(true);
    setError(null);
    const result = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? t.settings.twoFactor.actionFailed);
      return;
    }
    pushToast(t.settings.twoFactor.disabledToast);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.settings.twoFactor.disableTitle}</DialogTitle>
          <DialogDescription>{t.settings.twoFactor.disableHint}</DialogDescription>
        </DialogHeader>
        <PasswordStep onSubmit={disable} busy={busy} error={error} />
      </DialogContent>
    </Dialog>
  );
}
