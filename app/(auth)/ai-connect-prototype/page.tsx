"use client";

// PROTOTYPE (T-680): the pages an external AI app opens to connect, ?step=. Never merged.
// sign-in → (two-factor, the existing page) → organization → consent → back to the app.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrototypeSwitcher } from "@/components/dev/prototype-switcher";
import { APPS, type AppId } from "@/components/ai-settings/prototype/data";
import { AppMark } from "@/components/ai-settings/prototype/parts";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "sign-in", name: "Sign in" },
  { key: "organization", name: "Pick organization" },
  { key: "none", name: "No organization allows it" },
  { key: "consent", name: "Consent, read and write" },
  { key: "consent-read", name: "Consent, org is read only" },
  { key: "consent-loopback", name: "Consent, local app" },
] as const;

export default function AiConnectPrototypePage() {
  return (
    <Suspense fallback={null}>
      <Flow />
      <PrototypeSwitcher variants={STEPS} param="step" />
    </Suspense>
  );
}

function Flow() {
  const step = useSearchParams().get("step") ?? "sign-in";
  const app: AppId = step === "consent-loopback" ? "cursor" : "claude";
  switch (step) {
    case "organization":
      return <PickOrganization app={app} />;
    case "none":
      return <NoOrganization app={app} />;
    case "consent":
    case "consent-read":
    case "consent-loopback":
      return <Consent app={app} readOnlyOrg={step === "consent-read"} />;
    default:
      return <SignIn app={app} />;
  }
}

function Requester({ app, title }: { app: AppId; title: string }) {
  return (
    <div className="mb-7 space-y-4">
      <div className="flex items-center gap-3">
        <AppMark app={app} size={40} />
        <span className="text-muted-foreground text-sm">
          {APPS[app].name} · {APPS[app].host}
        </span>
      </div>
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
    </div>
  );
}

function SignIn({ app }: { app: AppId }) {
  const a = APPS[app];
  return (
    <div>
      <Requester app={app} title={`Sign in to connect ${a.name}`} />
      <p className="text-muted-foreground -mt-4 mb-6 text-sm">
        {a.name} wants to use your Flexi Day account. Nothing is shared until you allow it on the
        next page.
      </p>
      <div className="space-y-3">
        <Button variant="outline" className="w-full">
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full">
          Continue with Microsoft
        </Button>
      </div>
      <div className="text-muted-foreground my-5 text-center text-xs">or</div>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="petr.svoboda@novak-logistics.cz" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" defaultValue="password" />
        </div>
        <Button className="w-full">Sign in</Button>
      </form>
    </div>
  );
}

const PICKABLE = [
  { id: "novak", name: "Novák Logistics", role: "Member", access: "Read and write allowed" },
  { id: "hanak", name: "Hanák Transport", role: "Approver", access: "Read only" },
];

function PickOrganization({ app }: { app: AppId }) {
  const a = APPS[app];
  const [picked, setPicked] = useState("novak");
  return (
    <div>
      <Requester app={app} title={`Which organization should ${a.name} work in?`} />
      <fieldset className="space-y-2">
        <legend className="sr-only">Organization</legend>
        {PICKABLE.map((o) => (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3",
              picked === o.id ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <input
              type="radio"
              name="org"
              className="accent-primary"
              checked={picked === o.id}
              onChange={() => setPicked(o.id)}
            />
            <span className="flex-1">
              <span className="block text-sm font-medium">{o.name}</span>
              <span className="text-muted-foreground block text-xs">
                You&apos;re {o.role.toLowerCase()} here · {o.access}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-muted-foreground mt-3 text-sm">
        Not listed: Brightline Studio. Its owner hasn&apos;t turned on AI connections.
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {a.name} works in one organization. To use another, connect again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button className="flex-1">Continue</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
    </div>
  );
}

function NoOrganization({ app }: { app: AppId }) {
  const a = APPS[app];
  return (
    <div>
      <Requester app={app} title={`${a.name} can't connect yet`} />
      <p className="text-sm leading-relaxed">
        None of your organizations allows AI connections. The owner turns them on in the
        organization&apos;s settings.
      </p>
      <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
        <li>Brightline Studio · owner Jana Nováková</li>
        <li>Hanák Transport · owner Karel Hanák</li>
      </ul>
      <p className="text-muted-foreground mt-4 text-sm">
        Free organizations can&apos;t turn them on.
      </p>
      <Button variant="outline" className="mt-6 w-full">
        Go back to {a.name}
      </Button>
    </div>
  );
}

function Consent({ app, readOnlyOrg }: { app: AppId; readOnlyOrg: boolean }) {
  const a = APPS[app];
  const [write, setWrite] = useState(!readOnlyOrg);
  const loopback = app === "cursor";
  return (
    <div>
      <Requester app={app} title={`Allow ${a.name} to use your Flexi Day account?`} />

      <dl className="mb-6 grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">App</dt>
        <dd>
          {a.name}
          <span className="text-muted-foreground">
            {a.verified ? ` · address checked: ${a.host}` : " · name given by the app, not checked"}
          </span>
        </dd>
        <dt className="text-muted-foreground">Organization</dt>
        <dd>
          {readOnlyOrg ? "Hanák Transport" : "Novák Logistics"}{" "}
          <button type="button" className="text-primary ml-1 underline-offset-2 hover:underline">
            Change
          </button>
        </dd>
        <dt className="text-muted-foreground">Afterwards</dt>
        <dd>{loopback ? "You go back to localhost:33418" : `You go back to ${a.host}`}</dd>
      </dl>

      {loopback ? (
        <div className="mb-6 flex gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <p>
            This sends your access to a program on this computer. Allow it only if you started
            connecting from {a.name} just now.
          </p>
        </div>
      ) : null}

      <p className="mb-2 text-sm font-semibold">{a.name} will be able to</p>
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="block text-sm font-medium">See what you can see</span>
            <span className="text-muted-foreground block text-sm">
              Your requests and balances, who is away, attendance, the directory.
            </span>
          </span>
        </div>
        {readOnlyOrg ? (
          <p className="text-muted-foreground px-1 text-sm">
            Hanák Transport allows read only, so {a.name} can&apos;t make changes.
          </p>
        ) : (
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3",
              write ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <input
              type="checkbox"
              className="accent-primary mt-1"
              checked={write}
              onChange={(e) => setWrite(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium">Make changes for you</span>
              <span className="text-muted-foreground block text-sm">
                Create and cancel your own requests, clock you in and out. Each change is marked as
                made through {a.name}. It can&apos;t approve or reject.
              </span>
            </span>
          </label>
        )}
      </div>

      <p className="text-muted-foreground mt-4 text-sm">
        {a.name} works with your permissions, so it never sees more than you do. Disconnect it any
        time in Settings.
      </p>
      <div className="mt-6 flex gap-3">
        <Button className="flex-1">Allow</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
    </div>
  );
}
