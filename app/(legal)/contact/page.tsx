import type { Metadata } from "next";
import { Mail, Shield, LifeBuoy, Building2 } from "lucide-react";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact — flexiday",
  description: "Get in touch with the flexiday team for support, privacy or security questions.",
};

const REASONS = [
  {
    icon: LifeBuoy,
    title: "Support",
    body: "Questions about using flexiday, your account or your team? We're happy to help.",
  },
  {
    icon: Shield,
    title: "Privacy & data requests",
    body: "Exercise your GDPR rights or ask about how we handle your data.",
  },
  {
    icon: Mail,
    title: "Security disclosures",
    body: "Report a vulnerability — see our Security page for our disclosure guidelines.",
  },
];

export default function ContactPage() {
  return (
    <LegalShell
      title="Contact us"
      updated={LEGAL.updated}
      intro="Whether you need help, have a privacy request, or want to report a security issue, we'd love to hear from you."
    >
      <p>
        The fastest way to reach us is by email at{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. We aim to respond within a few business
        days.
      </p>

      <div className="not-prose mt-6 grid gap-4 sm:grid-cols-3">
        {REASONS.map((r) => (
          <div
            key={r.title}
            className="flex flex-col gap-2 rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-[11px]"
              style={{
                color: "var(--primary)",
                background: "color-mix(in oklch, var(--primary) 12%, transparent)",
              }}
            >
              <r.icon className="h-[19px] w-[19px]" />
            </span>
            <h3 className="font-display text-[16px] font-semibold" style={{ color: "var(--text)" }}>
              {r.title}
            </h3>
            <p className="text-[13.5px]" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
              {r.body}
            </p>
          </div>
        ))}
      </div>

      <h2>Company details</h2>
      <p>
        <span className="inline-flex items-center gap-2">
          <Building2 className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
          <strong>{LEGAL.entity}</strong>
        </span>
        <br />
        {LEGAL.address}
        <br />
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalShell>
  );
}
