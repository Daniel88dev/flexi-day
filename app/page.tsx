"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Check,
  Globe,
  Shield,
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

// const TESTIMONIALS = [
//   {
//     personId: "pn",
//     role: "People Ops, Northwind",
//     quote:
//       "We replaced a messy spreadsheet and three Slack channels with flexiday. Approvals that took days now take seconds.",
//   },
//   {
//     personId: "ep",
//     role: "Product Manager, Lumen",
//     quote:
//       "Finally a tool that respects rest. The calendar is genuinely calming to look at, and coverage rules saved our launch week.",
//   },
//   {
//     personId: "mr",
//     role: "Engineering Lead, Atlas Co",
//     quote:
//       "Booking time off used to feel like asking permission. Now it's two clicks and my whole squad can see it instantly.",
//   },
// ];

export default function LandingPage() {
  const { t } = useTranslation();
  // Yearly preselected: annual billing is the better deal on both sides.
  const [yearlyPricing, setYearlyPricing] = useState(true);
  return (
    <div className="overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* Signed-in visitors belong on the dashboard, not the pitch. Rendered
          alongside the page rather than gating it so the marketing content
          stays instantly visible for everyone else. */}
      <GuestRedirect />
      <MarketingNav />
      {/* HERO */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            top: -120,
            width: 900,
            height: 520,
            background: "radial-gradient(ellipse at center, var(--primary-soft), transparent 65%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-7 pt-[70px] pb-10">
          <div className="mx-auto max-w-[760px] text-center">
            <span
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-[5px] text-[12.5px] font-semibold"
              style={{
                background: "var(--surface)",
                color: "var(--text-muted)",
                borderColor: "var(--border)",
              }}
            >
              <span
                className="block h-2 w-2 rounded-full"
                style={{ background: "var(--c-home)" }}
              />
              {t.landing.trustedBadge}
            </span>
            <h1
              className="font-display mb-5 font-semibold"
              style={{
                fontSize: "clamp(40px, 6vw, 70px)",
                lineHeight: 1.02,
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
              className="mx-auto mb-8 max-w-[580px]"
              style={{
                fontSize: "clamp(17px, 2.2vw, 20px)",
                lineHeight: 1.5,
                color: "var(--text-muted)",
              }}
            >
              {t.landing.heroSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full px-6">
                <Link href="/sign-up">
                  {t.landing.startFree} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <Link href="/sign-in">{t.landing.signIn}</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <AvatarStack people={DEMO_TEAM} size={32} max={5} />
              <span className="text-[13.5px]" style={{ color: "var(--text-faint)" }}>
                {t.landing.setupUnder5}
              </span>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-[980px]">
            <HeroPreview />
          </div>
        </div>
      </section>
      {/* LOGO STRIP */}
      <section
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-tint)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-7 py-6">
          <span
            className="text-[13px] font-semibold tracking-wide"
            style={{ color: "var(--text-faint)" }}
          >
            {t.landing.earlyAccess.toUpperCase()}
          </span>
        </div>
      </section>
      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-7 py-[90px]">
        <div className="mx-auto mb-12 max-w-[600px] text-center">
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
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.landing.features.map((f, i) => {
            const { icon: Icon, tint } = FEATURE_ICONS[i];
            return (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-2xl border p-6"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                }}
              >
                <span
                  className="grid h-[46px] w-[46px] place-items-center rounded-[13px]"
                  style={{
                    color: tint,
                    background: `color-mix(in oklch, ${tint} 14%, transparent)`,
                  }}
                >
                  <Icon className="h-[23px] w-[23px]" />
                </span>
                <h3 className="font-display text-[19px] font-semibold">{f.title}</h3>
                <p className="text-[15px]" style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {f.body}
                </p>
              </div>
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
          <div className="mx-auto mb-14 max-w-[600px] text-center">
            <Eyebrow center>{t.landing.stepsEyebrow}</Eyebrow>
            <h2
              className="font-display my-4 font-semibold"
              style={{
                fontSize: "clamp(30px,4vw,44px)",
                letterSpacing: "-0.03em",
              }}
            >
              {t.landing.stepsTitle}
            </h2>
          </div>
          <div className="flex flex-col gap-10 md:flex-row">
            {t.landing.steps.map((s, i) => (
              <div key={s.title} className="relative flex-1">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      className="font-display grid h-11 w-11 shrink-0 place-items-center rounded-full text-[18px] font-bold"
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-fg)",
                      }}
                    >
                      {i + 1}
                    </span>
                    {i < t.landing.steps.length - 1 ? (
                      <span
                        className="hidden h-[2px] flex-1 md:block"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg, var(--border-strong) 0 7px, transparent 7px 14px)",
                        }}
                      />
                    ) : null}
                  </div>
                  <h3 className="font-display text-[19px] font-semibold">{s.title}</h3>
                  <p
                    className="text-[15px]"
                    style={{ color: "var(--text-muted)", lineHeight: 1.55 }}
                  >
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* SOCIAL PROOF */}
      {/*<section className="mx-auto max-w-6xl px-7 py-[90px]">*/}
      {/*  <div className="mx-auto mb-12 max-w-[600px] text-center">*/}
      {/*    <Eyebrow center>Loved by modern teams</Eyebrow>*/}
      {/*    <h2*/}
      {/*      className="font-display my-4 font-semibold"*/}
      {/*      style={{*/}
      {/*        fontSize: "clamp(30px,4vw,44px)",*/}
      {/*        letterSpacing: "-0.03em",*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      The end of &quot;who&apos;s off today?&quot;*/}
      {/*    </h2>*/}
      {/*  </div>*/}
      {/*  <div className="grid gap-5 md:grid-cols-3">*/}
      {/*    {TESTIMONIALS.map((t) => {*/}
      {/*      const p = demoById(t.personId)!;*/}
      {/*      return (*/}
      {/*        <div*/}
      {/*          key={t.personId}*/}
      {/*          className="flex flex-col gap-4 rounded-2xl border p-6"*/}
      {/*          style={{*/}
      {/*            background: "var(--surface)",*/}
      {/*            borderColor: "var(--border)",*/}
      {/*          }}*/}
      {/*        >*/}
      {/*          <div className="flex gap-[3px]" style={{ color: "var(--warm)" }}>*/}
      {/*            {Array.from({ length: 5 }).map((_, i) => (*/}
      {/*              <Star key={i} className="h-4 w-4 fill-current" />*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*          <p className="text-[16.5px]" style={{ color: "var(--text)", lineHeight: 1.55 }}>*/}
      {/*            &ldquo;{t.quote}&rdquo;*/}
      {/*          </p>*/}
      {/*          <div className="mt-auto flex items-center gap-3">*/}
      {/*            <AvatarBubble initials={p.initials} background={p.av} name={p.name} size={42} />*/}
      {/*            <div>*/}
      {/*              <div className="text-[14.5px] font-semibold">{p.name}</div>*/}
      {/*              <div className="text-[13px]" style={{ color: "var(--text-faint)" }}>*/}
      {/*                {t.role}*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      );*/}
      {/*    })}*/}
      {/*  </div>*/}
      {/*</section>*/}
      {/* PRICING */}
      <section
        id="pricing"
        style={{ background: "var(--bg-tint)", borderTop: "1px solid var(--border)" }}
      >
        <div className="mx-auto max-w-6xl px-7 py-[90px]">
          <div className="mx-auto mb-8 max-w-[600px] text-center">
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
          </div>

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
            ).map((tier) => (
              <div
                key={tier.copy.name}
                className="relative flex flex-col gap-5 rounded-2xl p-7"
                style={{
                  border: tier.featured ? "1.5px solid var(--primary)" : "1px solid var(--border)",
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
                  <div className="text-[16px] font-semibold" style={{ color: "var(--text-muted)" }}>
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
                  className="w-full rounded-full"
                >
                  <Link href="/sign-up">{tier.copy.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="mx-auto max-w-6xl px-7 py-[90px]">
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
                className="gap-2 rounded-full px-6"
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
                className="gap-2 rounded-full px-6"
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
      </section>
      {/* FOOTER */}
      <Footer />
    </div>
  );
}
