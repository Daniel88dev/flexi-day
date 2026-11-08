---
id: year-rollover
translatedFrom: "8c9c3a1655ca"
title: Převod nevyčerpaných dní na konci roku
summary: Co se 1. ledna stane s nároky, jak se převádějí nevyčerpané dny dovolené a jak výsledek opraví správce.
keywords:
  [
    převod,
    převod dovolené,
    přelom roku,
    nový rok,
    nevyčerpané dny,
    zbylé dny,
    propadnou,
    příští rok,
    leden,
  ]
goldenQuestions:
  - question: Převádějí se mi nevyčerpané dny dovolené do dalšího roku?
    expectedArticles: [year-rollover]
    mustMention: [nevyčerpaná dovolená se převádí, home office a zdravotní volno ne]
  - question: Po Novém roce mi nesedí převedené dny, kdo to opraví?
    expectedArticles: [year-rollover]
    mustMention: [správce skupiny, Upravit nárok, Převedeno z předchozího roku]
---

První noc nového roku Flexi Day sám otevře nároky na nový rok pro každého ve všech skupinách.
Nevyčerpané dny dovolené se přenesou; nic jiného se nepřevádí.

## Co nový rok dostane

U každého člena každé skupiny:

- **{{ui:calendarRecordTypes.VACATION.label}}, {{ui:calendarRecordTypes.HOME_OFFICE.label}} a
  zdravotní volno** začínají na stejných ročních číslech jako loni. Člen, který loni neměl vlastní
  nárok, začne od výchozích hodnot skupiny.
- **Převedeno** dostane loňské nevyčerpané dny dovolené: loňský nárok na dovolenou plus to, co se do
  něj převedlo, minus zadané dny dovolené. Čekající dny se počítají jako zadané a výsledek se
  zaokrouhlí dolů na celé dny.
- Nevyčerpané dny {{ui:calendarRecordTypes.HOME_OFFICE.label}} a zdravotního volna propadnou.

Převedené dny se přičtou k novému nároku na dovolenou, takže „{{ui:widgets.balance.title}}“ na
stránce {{ui:nav.dashboard}} je ukazuje v celku.

## Kdy se to děje

Každou noc Flexi Day otevře aktuální rok každému, kdo ho ještě nemá. Nový rok se tedy objeví první
lednovou noc a člen, který se připojí později, dostane svůj nárok při připojení podle výchozích
hodnot skupiny. Nárok, který správce na daný rok už uložil, se nikdy nepřepíše.

Každá automatická změna se objeví v části „{{ui:report.detail.changes}}“ na stránce člena v sekci
{{ui:nav.report}} s označením „{{ui:report.detail.bySystem}}“.

## Oprava převodu

Správce skupiny, manažer nebo správce organizace otevře stránku člena v sekci {{ui:nav.report}} a
stiskne „{{ui:report.detail.editQuota}}“. Dialog ukáže „{{ui:report.quotaDialog.carriedOver}}“ s
návrhem podle loňských nevyčerpaných dní, který může přijmout nebo přepsat. Upravit tam jde jen
aktuální rok. Roční čísla jde měnit i v záložce {{ui:groupDetail.tabs.quotas}} skupiny; viz
[Nároky](help:allowances).

## Pozdější zrušení loňských dní

Převod se spočítá jednou, tu noc, kdy proběhne. Když potom zrušíš žádost z loňského roku, převedené
číslo se nezmění; požádej správce skupiny o opravu.

## Externí spolupracovníci

Externí spolupracovníci ani v novém roce nárok nedostanou, takže se jim nic nepřevádí.
