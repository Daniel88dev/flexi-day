---
id: allowances
translatedFrom: "cceae019fd59"
title: Nároky a kolik dní ti zbývá
summary: Jak fungují roční nároky podle skupiny a typu, kde uvidíš, co zbývá, a jak je správci nastavují.
keywords:
  [
    kvóta,
    nárok,
    zbývající dny,
    kolik mi zbývá,
    zůstatek,
    dny dovolené,
    dny home office,
    zdravotní volno,
    výchozí hodnoty skupiny,
    změnit kvótu,
    překročený nárok,
  ]
goldenQuestions:
  - question: Kolik dní dovolené mi ještě zbývá?
    expectedArticles: [allowances]
    mustMention: [Můj zůstatek na Přehledu, nárok podle tvé organizace]
  - question: Jak dám jednomu člověku letos víc dní dovolené?
    expectedArticles: [allowances]
    mustMention: [záložka Kvóty ve skupině, Upravit u člena]
  - question: Proč mi aplikace odmítla žádost kvůli překročení nároku?
    expectedArticles: [allowances]
    mustMention: [počítají se i čekající žádosti, požádej správce skupiny]
---

Nárok je počet dní, které si člověk může zadat jednoho typu za jeden rok v jedné skupině. Nárok mají
tři typy: {{ui:calendarRecordTypes.VACATION.label}}, {{ui:calendarRecordTypes.HOME_OFFICE.label}} a
{{ui:calendarRecordTypes.SICK_DAY.label}} tam, kde je zapnutý benefit zdravotního volna. Čísla jsou
vlastní pro tvoji organizaci; nastavují je správci skupin.

## Kolik ti zbývá

„{{ui:widgets.balance.title}}“ na stránce {{ui:nav.dashboard}} ukazuje u každého typu s nárokem, kolik
dní ti letos zbývá z celku, sečteno za tvoje skupiny. Dny čekající na schválení jsou uvedené vedle.
Záložka {{ui:groupDetail.tabs.quotas}} skupiny ukazuje nárok každého člena na daný rok, pokud tam máš
oprávnění Zobrazení.

## Jak se nárok čerpá

- Každá skupina má vlastní nároky. Volno zadané ve skupině čerpá z nároku této skupiny.
- Den se počítá do roku, do kterého spadá. Půlden se počítá jako 0,5.
- Novou žádost aplikace odmítne, pokud by tvoje schválené a čekající dny spolu s novými nárok
  překročily. Zrušením žádosti se její dny vrátí.
- Nevyčerpané dny typu {{ui:calendarRecordTypes.VACATION.label}} se převádějí do dalšího roku; viz
  [Převod dní na konci roku](help:year-rollover).

Pokud ti aplikace žádost z tohoto důvodu odmítla, požádej správce skupiny o navýšení nároku.

## Nastavení nároku člena

Může to udělat správce skupiny, manažer a správci organizace.

1. Otevři skupinu ze stránky {{ui:nav.groups}} a přejdi na {{ui:groupDetail.tabs.quotas}}.
2. Šipkami vyber rok.
3. U člena stiskni „{{ui:common.edit}}“, změň čísla a ulož.

Člen, který na daný rok nemá uložený nárok, ukazuje výchozí hodnotu skupiny s označením
„{{ui:groupDetail.default}}“. Uložením se zapíše jeho vlastní číslo. Každá změna se zaznamená i s
tím, kdo ji udělal, v části „{{ui:report.detail.changes}}“ na stránce člena v sekci
{{ui:nav.report}}.

Dny převedené z minulého roku se nastavují přes „{{ui:report.detail.editQuota}}“ na téže stránce,
která navrhne nevyčerpané dny z předchozího roku.

## Výchozí hodnoty skupiny

V části „{{ui:groupDetail.groupDefaults}}“ v záložce {{ui:groupDetail.tabs.quotas}} nastaví správci
nároky, se kterými začínají noví členové. Uložíš je tlačítkem „{{ui:groupDetail.saveDefaults}}“.
Výchozí hodnoty platí pro členy, kteří na daný rok ještě nárok nemají; stávající nároky se nemění.

## Externí spolupracovníci

Externí spolupracovníci nárok nemají a zadat si můžou jen typy bez nároku.
