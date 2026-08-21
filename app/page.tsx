"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  Check,
  ChevronDown,
  Globe,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/brand/avatar-bubble";
import { Footer } from "@/components/footer";
import { MarketingNav } from "@/components/landing/marketing-nav";
import { GuestRedirect } from "@/components/auth/guest-guard";
import { HeroPreview } from "@/components/landing/hero-preview";
import { Eyebrow } from "@/components/landing/eyebrow";
import { HeroEnter, Reveal } from "@/components/landing/reveal";
import { ApprovalPreview } from "@/components/landing/approval-preview";
import { DEMO_TEAM } from "@/lib/demo/team";
import { useTranslation } from "@/lib/i18n/use-translation";
import { PLAN_PRICES, TRIAL } from "@/lib/billing/prices";

/** Icon + accent per feature card; copy comes from the dictionary, matched by index. */
const FEATURE_ICONS = [
  { icon: CalendarIcon, tint: "var(--c-vacation)" },
  { icon: CheckCircle2, tint: "var(--c-home)" },
  { icon: Users, tint: "var(--c-pto)" },
  { icon: TrendingUp, tint: "var(--warm)" },
  { icon: Globe, tint: "var(--c-bank)" },
  { icon: Shield, tint: "var(--c-sick)" },
];

/** Bento cell shape per feature, matched by index: 7+5 / 4+4+4 / full-width. */
const BENTO_CELLS = [
  { span: "md:col-span-7", tinted: true, large: true, wide: false },
  { span: "md:col-span-5", tinted: false, large: false, wide: false },
  { span: "md:col-span-4", tinted: false, large: false, wide: false },
  { span: "md:col-span-4", tinted: true, large: false, wide: false },
  { span: "md:col-span-4", tinted: false, large: false, wide: false },
  { span: "md:col-span-12", tinted: true, large: false, wide: true },
];

export default function LandingPage() {
  const { t } = useTranslation();
  // Yearly preselected: annual billing is the better deal on both sides.
  const [yearlyPricing, setYearlyPricing] = useState(true);
  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Signed-in visitors belong on the dashboard, not the pitch. Rendered
          alongside the page rather than gating it so the marketing content
          stays instantly visible for everyone else. */}
      <GuestRedirect />
      <MarketingNav />
      {/* HERO - asymmetric split: copy left, live calendar preview right */}
      <section className="relative overflow-x-clip">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-80px] right-[-160px] hidden lg:block"
          style={{
            width: 720,
            height: 560,
            background: "radial-gradient(ellipse at center, var(--primary-soft), transparent 65%)",
            filter: "blur(24px)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-7 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
            <HeroEnter>
              <h1
                className="font-display mb-5 font-semibold"
                style={{
                  fontSize: "clamp(38px, 4.8vw, 60px)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.035em",
                }}
              >
                {t.landing.heroTitleLine1}
                <br />
                {t.landing.heroTitlePrefix}{" "}
                <span className="font-serif-italic" style={{ color: "var(--primary)" }}>
                  {t.landing.heroTitleAccent}
                </span>
                .
              </h1>
              <p
                className="mb-8 max-w-[460px]"
                style={{
                  fontSize: "clamp(17px, 2vw, 19px)",
                  lineHeight: 1.55,
                  color: "var(--text-muted)",
                }}
              >
                {t.landing.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2 rounded-full px-6 active:scale-[0.98]">
                  <Link href="/sign-up">
                    {t.landing.startFree} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-6 active:scale-[0.98]"
                >
                  <Link href="/sign-in">{t.landing.signIn}</Link>
                </Button>
              </div>
            </HeroEnter>
            <HeroEnter delay={0.15} y={32}>
              <div className="transition-transform duration-500 lg:rotate-[1.2deg] lg:hover:rotate-0">
                <HeroPreview />
              </div>
            </HeroEnter>
          </div>
        </div>
      </section>
      {/* EARLY ACCESS STRIP */}
      <section
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-tint)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-7 py-5">
          <AvatarStack people={DEMO_TEAM} size={28} max={5} />
          <span className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            {t.landing.setupUnder5} · {t.landing.earlyAccess}
          </span>
        </div>
      </section>
      {/* FEATURES - bento grid */}
      <section id="features" className="mx-auto max-w-6xl px-7 py-[90px]">
        <Reveal className="mx-auto mb-12 max-w-[600px] text-center">
          <Eyebrow center>{t.landing.featuresEyebrow}</Eyebrow>
          <h2
            className="font-display my-4 font-semibold"
            style={{
              fontSize: "clamp(30px,4vw,44px)",
              letterSpacing: "-0.03em",
            }}
          >
            {t.landing.featuresTitle}
          </h2>
          <p className="text-[17px]" style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>
            {t.landing.featuresSubtitle}
          </p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-12">
          {t.landing.features.map((f, i) => {
            const { icon: Icon, tint } = FEATURE_ICONS[i];
            const cell = BENTO_CELLS[i];
            return (
              <Reveal key={f.title} delay={i * 0.06} className={cell.span}>
                <div
                  className={`flex h-full gap-3 rounded-2xl border ${
                    cell.wide
                      ? "flex-col items-start p-7 md:flex-row md:items-center md:gap-6"
                      : `flex-col ${cell.large ? "p-8" : "p-6"}`
                  }`}
                  style={{
                    borderColor: "var(--border)",
                    background: cell.tinted
                      ? `linear-gradient(135deg, color-mix(in oklch, ${tint} 12%, var(--surface)), var(--surface) 70%)`
                      : "var(--surface)",
                  }}
                >
                  <span
                    className={`grid shrink-0 place-items-center rounded-[13px] ${
                      cell.large ? "h-[54px] w-[54px]" : "h-[46px] w-[46px]"
                    }`}
                    style={{
                      color: tint,
                      background: `color-mix(in oklch, ${tint} 14%, transparent)`,
                    }}
                  >
                    <Icon className={cell.large ? "h-[27px] w-[27px]" : "h-[23px] w-[23px]"} />
                  </span>
                  <div className={cell.wide ? "" : "flex flex-col gap-3"}>
                    <h3
                      className={`font-display font-semibold ${
                        cell.large ? "text-[22px]" : "text-[19px]"
                      } ${cell.wide ? "mb-2" : ""}`}
                    >
                      {f.title}
                    </h3>
                    <p
                      className={`text-[15px] ${cell.wide ? "max-w-[640px]" : ""}`}
                      style={{ color: "var(--text-muted)", lineHeight: 1.55 }}
                    >
                      {f.body}
                    </p>
                  </div>
                  {i === 1 ? <ApprovalPreview /> : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{
          background: "var(--bg-tint)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-6xl px-7 py-[90px]">
          <Reveal className="mb-12 max-w-[560px]">
            <h2
              className="font-display font-semibold"
              style={{
                fontSize: "clamp(30px,4vw,44px)",
                letterSpacing: "-0.03em",
              }}
            >
              {t.landing.stepsTitle}
            </h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-3">
            {t.landing.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="flex flex-col gap-2">
                  <span
                    aria-hidden
                    className="font-display text-[56px] leading-none font-bold"
                    style={{ color: "color-mix(in oklch, var(--primary) 30%, transparent)" }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-display text-[19px] font-semibold">{s.title}</h3>
                  <p
                    className="text-[15px]"
                    style={{ color: "var(--text-muted)", lineHeight: 1.55 }}
                  >
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {/* CALENDAR SYNC */}
      <section className="mx-auto max-w-6xl px-7 py-[90px]">
        <Reveal className="mx-auto max-w-[620px] text-center">
          <h2
            className="font-display font-semibold"
            style={{ fontSize: "clamp(28px,3.6vw,40px)", letterSpacing: "-0.03em" }}
          >
            {t.landing.calSyncSection.title}
          </h2>
          <p
            className="mx-auto mt-4 max-w-[540px] text-[17px]"
            style={{ color: "var(--text-muted)", lineHeight: 1.55 }}
          >
            {t.landing.calSyncSection.body}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {t.landing.calSyncSection.providers.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-[15px] font-semibold"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <CalendarDays className="h-[18px] w-[18px]" style={{ color: "var(--primary)" }} />
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </section>
      {/* PRICING */}
      <section id="pricing" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-6xl px-7 py-[90px]">
          <Reveal className="mx-auto mb-8 max-w-[600px] text-center">
            <Eyebrow center>{t.landing.pricing.eyebrow}</Eyebrow>
            <h2
              className="font-display my-4 font-semibold"
              style={{ fontSize: "clamp(30px,4vw,44px)", letterSpacing: "-0.03em" }}
            >
              {t.landing.pricing.title}
            </h2>
            <p className="text-[17px]" style={{ color: "var(--text-muted)" }}>
              {t.landing.pricing.subtitle}
            </p>
          </Reveal>

          <div className="mb-10 flex justify-center">
            <div
              className="flex items-center rounded-full p-1 text-[13px] font-semibold"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={() => setYearlyPricing(false)}
                className="rounded-full px-4 py-1.5"
                style={
                  yearlyPricing
                    ? { color: "var(--text-muted)" }
                    : { background: "var(--primary)", color: "var(--primary-fg)" }
                }
              >
                {t.landing.pricing.monthly}
              </button>
              <button
                type="button"
                onClick={() => setYearlyPricing(true)}
                className="rounded-full px-4 py-1.5"
                style={
                  yearlyPricing
                    ? { background: "var(--primary)", color: "var(--primary-fg)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {t.landing.pricing.yearly} · {t.landing.pricing.yearlyBonus}
              </button>
            </div>
          </div>

          <div className="mx-auto grid max-w-[880px] gap-5 md:grid-cols-3">
            {(
              [
                { copy: t.landing.pricing.free, monthly: null, yearly: null, featured: false },
                {
                  copy: t.landing.pricing.pro,
                  monthly: PLAN_PRICES.PRO.monthly,
                  yearly: PLAN_PRICES.PRO.yearly,
                  featured: true,
                },
                {
                  copy: t.landing.pricing.enterprise,
                  monthly: PLAN_PRICES.ENTERPRISE.monthly,
                  yearly: PLAN_PRICES.ENTERPRISE.yearly,
                  featured: false,
                },
              ] as const
            ).map((tier, i) => (
              <Reveal key={tier.copy.name} delay={i * 0.08}>
                <div
                  className="relative flex h-full flex-col gap-5 rounded-2xl p-7"
                  style={{
                    border: tier.featured
                      ? "1.5px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: tier.featured
                      ? "color-mix(in oklch, var(--primary) 5%, var(--surface))"
                      : "var(--surface)",
                    boxShadow: tier.featured ? "var(--shadow)" : "none",
                  }}
                >
                  {tier.featured ? (
                    <span
                      className="absolute -top-[13px] left-7 rounded-full px-3 py-1 text-[12px] font-bold tracking-wide"
                      style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
                    >
                      {t.landing.pricing.mostPopular}
                    </span>
                  ) : null}
                  <div>
                    <div
                      className="text-[16px] font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {tier.copy.name}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span
                        className="font-display font-bold"
                        style={{ fontSize: 44, letterSpacing: "-0.03em" }}
                      >
                        {tier.monthly === null
                          ? "€0"
                          : `€${yearlyPricing ? tier.yearly : tier.monthly}`}
                      </span>
                      <span className="text-[14.5px]" style={{ color: "var(--text-faint)" }}>
                        {tier.monthly === null
                          ? ""
                          : `${yearlyPricing ? t.landing.pricing.perYear : t.landing.pricing.perMonth} · ${t.landing.pricing.exclVat}`}
                      </span>
                    </div>
                    {tier.monthly !== null ? (
                      <p
                        className="mt-1 text-[13px] font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        {t.landing.pricing.trialBadge(
                          TRIAL[yearlyPricing ? "yearly" : "monthly"].count,
                          TRIAL[yearlyPricing ? "yearly" : "monthly"].unit
                        )}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[14px]" style={{ color: "var(--text-muted)" }}>
                      {tier.copy.blurb}
                    </p>
                  </div>
                  <div className="h-px" style={{ background: "var(--border)" }} />
                  <ul className="flex flex-1 flex-col gap-3">
                    {tier.copy.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[14.5px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Check
                          className="mt-[1px] h-[18px] w-[18px] shrink-0"
                          style={{ color: "var(--primary)" }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={tier.featured ? "default" : "outline"}
                    size="lg"
                    className="w-full rounded-full active:scale-[0.98]"
                  >
                    <Link href="/sign-up">{tier.copy.cta}</Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[14px]"
            style={{ color: "var(--text-muted)" }}
          >
            <ShieldCheck className="h-[18px] w-[18px]" style={{ color: "var(--ok)" }} />
            <span>{t.landing.security.line}</span>
            <Link
              href="/security"
              className="font-semibold underline underline-offset-2"
              style={{ color: "var(--text)" }}
            >
              {t.landing.security.link}
            </Link>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section
        id="faq"
        style={{
          background: "var(--bg-tint)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-[760px] px-7 py-[90px]">
          <Reveal>
            <h2
              className="font-display font-semibold"
              style={{ fontSize: "clamp(28px,3.6vw,38px)", letterSpacing: "-0.03em" }}
            >
              {t.landing.faq.title}
            </h2>
          </Reveal>
          <div className="mt-8">
            {t.landing.faq.items.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.04}>
                <details className="group border-b" style={{ borderColor: "var(--border)" }}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16.5px] font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
                      style={{ color: "var(--text-faint)" }}
                    />
                  </summary>
                  <p
                    className="max-w-[640px] pb-5 text-[15.5px]"
                    style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
                  >
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {/* FOUNDER NOTE */}
      <section className="mx-auto max-w-[640px] px-7 py-[90px] text-center">
        <Reveal>
          <h2
            className="font-display text-[24px] font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t.landing.founder.title}
          </h2>
          <p className="mt-5 text-[17px]" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
            {t.landing.founder.body}
          </p>
          <div className="mt-6">
            <div className="font-display text-[16px] font-semibold">{t.landing.founder.name}</div>
            <div className="text-[13.5px]" style={{ color: "var(--text-faint)" }}>
              {t.landing.founder.role}
            </div>
          </div>
        </Reveal>
      </section>
      {/* CTA */}
      <section className="mx-auto max-w-6xl px-7 pb-[90px]">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[24px] text-center"
            style={{
              padding: "clamp(40px,6vw,72px) 28px",
              background: "var(--primary)",
              color: "var(--primary-fg)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, oklch(1 0 0 / .14), transparent 40%), radial-gradient(circle at 85% 90%, oklch(0 0 0 / .12), transparent 45%)",
              }}
            />
            <div className="relative">
              <h2
                className="font-display mb-4 font-semibold"
                style={{
                  fontSize: "clamp(30px,4.5vw,48px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {t.landing.ctaTitle}
              </h2>
              <p className="mx-auto mb-7 max-w-[480px] text-[18px] opacity-90">
                {t.landing.ctaSubtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-full px-6 active:scale-[0.98]"
                  style={{
                    background: "var(--primary-fg)",
                    color: "var(--primary)",
                  }}
                >
                  <Link href="/sign-up">
                    {t.landing.createTeam} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-full px-6 active:scale-[0.98]"
                  style={{
                    background: "oklch(1 0 0 / .14)",
                    color: "var(--primary-fg)",
                    borderColor: "oklch(1 0 0 / .25)",
                  }}
                >
                  <Link href="/sign-in">{t.landing.signIn}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      {/* FOOTER */}
      <Footer />
    </div>
  );
}
