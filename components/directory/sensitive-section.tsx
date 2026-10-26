"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ContactValues,
  DirectoryPhone,
  DirectoryProfile,
  PersonalValues,
} from "@/lib/api/directory";
import { useShownSection } from "@/lib/directory/shown-sections";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * A Sensitive section's place on a page: closed behind Show for anyone but the
 * person, then `children(values)` with the read-log line. The person's own
 * Section opens by itself and carries no line.
 */
export function SensitiveGate<V extends ContactValues | PersonalValues>({
  profile,
  shown,
  children,
}: {
  profile: DirectoryProfile;
  shown: Pick<ReturnType<typeof useShownSection>, "show" | "pending" | "error"> & {
    data: V | undefined;
  };
  children: (values: V) => ReactNode;
}) {
  const { t } = useTranslation();
  const copy = t.directory.profile;

  if (!shown.data) {
    if (profile.self && !shown.error) {
      return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
    }
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">{copy.hidden}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={shown.pending}
          onClick={() => void shown.show()}
        >
          {shown.pending ? copy.showing : copy.show}
        </Button>
        {shown.error ? (
          <p role="alert" className="text-destructive w-full text-sm">
            {copy.showFailed}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!profile.self ? (
        <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
          <Lock className="h-3 w-3" aria-hidden />
          {copy.recorded}
        </p>
      ) : null}
      {children(shown.data)}
    </div>
  );
}

const phoneLink = (phone: DirectoryPhone) => (
  <a href={`tel:${phone.e164}`} className="text-primary hover:underline">
    {phone.display}
  </a>
);

/** The Contact Section on the profile page, behind Show. */
export function ContactTab({ profile }: { profile: DirectoryProfile }) {
  const shown = useShownSection(profile, "contact");
  return (
    <SensitiveGate profile={profile} shown={shown}>
      {(values) => <ContactFacts values={values} />}
    </SensitiveGate>
  );
}

/** The Personal Section on the profile page, behind Show. */
export function PersonalTab({ profile }: { profile: DirectoryProfile }) {
  const shown = useShownSection(profile, "personal");
  return (
    <SensitiveGate profile={profile} shown={shown}>
      {(values) => <PersonalFacts values={values} />}
    </SensitiveGate>
  );
}

export function ContactFacts({ values }: { values: ContactValues }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const slots = [
    ["emergency-1", values.emergencyContact1],
    ["emergency-2", values.emergencyContact2],
  ] as const;
  return (
    <Facts
      rows={[
        [copy.privatePhone, values.privatePhone ? phoneLink(values.privatePhone) : copy.notSet],
        [
          copy.privateEmail,
          values.privateEmail ? (
            <a
              key="private-email"
              href={`mailto:${values.privateEmail}`}
              className="text-primary hover:underline"
            >
              {values.privateEmail}
            </a>
          ) : (
            copy.notSet
          ),
        ],
        ...slots.map(([key, slot], index): [string, ReactNode] => [
          copy.emergencyContact(index + 1),
          slot ? (
            <span key={key}>
              {slot.name}, {phoneLink(slot.phone)}
            </span>
          ) : (
            copy.notSet
          ),
        ]),
      ]}
    />
  );
}

/** Formats a `YYYY-MM-DD` date as the calendar day it names, whatever the viewer's zone. */
const formatDay = (value: string, locale: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, { timeZone: "UTC" });

export function PersonalFacts({ values }: { values: PersonalValues }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const address = values.homeAddress;
  return (
    <Facts
      rows={[
        [
          copy.homeAddress,
          address ? (
            <address key="home-address" className="not-italic">
              {[
                address.line1,
                address.line2,
                [address.postalCode, address.city].filter(Boolean).join(" "),
                address.region,
                address.country.name,
              ]
                .filter(Boolean)
                .map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
            </address>
          ) : (
            copy.notSet
          ),
        ],
        [
          copy.dateOfBirth,
          values.dateOfBirth ? formatDay(values.dateOfBirth, t.common.dateLocale) : copy.notSet,
        ],
      ]}
    />
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
