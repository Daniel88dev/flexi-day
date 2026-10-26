"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DirectoryGeneralSettings } from "@/lib/api/directory";
import { useDirectoryGeneralSettings, useUpdateDirectoryGeneralSettings } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

type Language = "en" | "cs";
const LANGUAGES: Language[] = ["en", "cs"];

/** The General panel: the Art. 14 notice shown under the emergency contacts, per language. */
export function EmergencyNoticePanel({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.notice;
  const settings = useDirectoryGeneralSettings(organizationId, true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.error ? (
          <p className="text-destructive text-sm">{copy.loadFailed}</p>
        ) : !settings.data ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : (
          <NoticeForm
            key={JSON.stringify(settings.data.emergencyContactNotice)}
            organizationId={organizationId}
            settings={settings.data}
          />
        )}
      </CardContent>
    </Card>
  );
}

function NoticeForm({
  organizationId,
  settings,
}: {
  organizationId: string;
  settings: DirectoryGeneralSettings;
}) {
  const { t, locale } = useTranslation();
  const copy = t.directory.settings.notice;
  const update = useUpdateDirectoryGeneralSettings(organizationId);
  const stored = settings.emergencyContactNotice;
  const [texts, setTexts] = useState<Record<Language, string>>({
    en: stored.en ?? settings.defaults.en,
    cs: stored.cs ?? settings.defaults.cs,
  });
  const label: Record<Language, string> = { en: copy.english, cs: copy.czech };

  /** The text to store: null where it is the default again. */
  const toSave = (language: Language) => {
    const value = texts[language].trim();
    return value === "" || value === settings.defaults[language] ? null : value;
  };
  const changed = LANGUAGES.some((language) => toSave(language) !== stored[language]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({ en: toSave("en"), cs: toSave("cs") });
      }}
    >
      <p className="text-muted-foreground text-sm">
        {copy.intro(locale === "cs" ? settings.period.cs : settings.period.en)}
      </p>
      {LANGUAGES.map((language) => (
        <div key={language} className="space-y-1.5">
          <Label htmlFor={`notice-${language}`}>{label[language]}</Label>
          <Textarea
            id={`notice-${language}`}
            value={texts[language]}
            maxLength={2000}
            rows={4}
            disabled={!settings.editable}
            onChange={(event) =>
              setTexts((current) => ({ ...current, [language]: event.target.value }))
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            {toSave(language) === null ? (
              <p className="text-muted-foreground text-xs">{copy.usingDefault}</p>
            ) : settings.editable ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`${copy.useDefault}: ${label[language]}`}
                onClick={() =>
                  setTexts((current) => ({ ...current, [language]: settings.defaults[language] }))
                }
              >
                {copy.useDefault}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
      {settings.editable ? (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!changed || update.isPending}>
            {update.isPending ? copy.saving : copy.save}
          </Button>
          {update.isSuccess && !changed ? (
            <p className="text-muted-foreground text-sm">{copy.saved}</p>
          ) : null}
          {update.error ? (
            <p role="alert" className="text-destructive text-sm">
              {copy.saveFailed}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{copy.readOnly}</p>
      )}
    </form>
  );
}
