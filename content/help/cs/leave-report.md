---
id: leave-report
translatedFrom: "9a77d86a7b13"
title: Jak číst report volna tvého týmu
summary: Co ukazuje stránka Report, čí data na ní vidíš a co znamená každý sloupec tabulky Členové.
keywords:
  [
    report,
    reporty,
    report volna,
    čerpání,
    statistiky,
    přehled,
    čerpání týmu,
    vyčerpané dny,
    zbývající dny,
    zbývá,
    naplánováno,
    detail člena,
    grafy,
  ]
goldenQuestions:
  - question: Kde uvidím, kolik dní dovolené letos vyčerpal každý v mém týmu?
    expectedArticles: [leave-report]
    mustMention: [stránka Report, tabulka Členové, oprávnění Zobrazení]
  - question: Proč v reportu vidím jen svoje čísla?
    expectedArticles: [leave-report, group-permissions]
    mustMention: [oprávnění Zobrazení, jen tvoje vlastní řádky]
  - question: Jaký je v reportu rozdíl mezi Naplánováno a Ke schválení?
    expectedArticles: [leave-report]
    mustMention: [Naplánováno jsou schválené dny teprve před tebou, Ke schválení čeká na schválení]
---

Stránka {{ui:nav.report}} shrnuje volno ve skupinách, do kterých patříš nebo které spravuješ: měsíční
grafy podle typu volna a tabulku s nárokem každého člena. Otevřeš ji z postranního panelu.

## Čí data vidíš

- Ve skupině, kde máš oprávnění Zobrazení, nebo kterou spravuješ či vedeš jako manažer, vidíš všechny
  členy.
- Ve skupině, kde jsi běžný člen, vidíš jen svoje vlastní řádky.
- Správci organizace vidí všechny skupiny organizace, i ty, do kterých nepatří.

Nemoc, zamítnuté žádosti a poznámky někoho jiného vidí jen schvalovatelé a správci jeho skupiny,
včetně správců organizace. Ostatní vidí jeho další volno bez nich. Tvoje vlastní řádky jsou vždy
úplné.

Pokud nejsi v žádné skupině s daty za daný rok, stránka ukáže „{{ui:report.empty.title}}“.

## Filtrování reportu

Lišta filtrů zužuje vše na stránce:

- **{{ui:report.filters.period}}**: „{{ui:report.filters.lastTwelveMonths}}“ (výchozí) nebo jeden
  kalendářní rok.
- **{{ui:report.filters.groups}}**, **{{ui:report.filters.members}}** a
  **{{ui:report.filters.types}}**: vyber jednu či více položek, nebo nech „vše“.

## Grafy

Každý typ volna má panel „Měsíční čerpání“ se sloupcem pro každého člena a měsíc a s celkovým
součtem za období. Typy s nárokem ({{ui:calendarRecordTypes.VACATION.label}},
{{ui:calendarRecordTypes.HOME_OFFICE.label}} a {{ui:calendarRecordTypes.SICK_DAY.label}} tam, kde je
zapnutý benefit zdravotního volna) mají navíc panel „Zbývá dnů“. Sám se otevře jen první panel;
ostatní otevřeš nebo zavřeš kliknutím na jejich název. Půlden se počítá jako 0,5.

## Tabulka Členové

Jeden řádek na člena, skupinu a typ volna s nárokem:

| Sloupec                         | Význam                                                       |
| ------------------------------- | ------------------------------------------------------------ |
| {{ui:report.table.carriedOver}} | Nevyčerpané dny převedené z minulého roku                    |
| {{ui:report.table.yearQuota}}   | Nárok na rok, nebo výchozí hodnota skupiny, pokud žádný není |
| {{ui:report.table.usedToDate}}  | Dny, které už proběhly                                       |
| {{ui:report.table.planned}}     | Schválené dny, které letos teprve přijdou                    |
| {{ui:report.table.pending}}     | Dny čekající na schválení                                    |
| {{ui:report.table.remaining}}   | Převedeno plus roční nárok, minus vyčerpané a naplánované    |

Dny ke schválení se od sloupce {{ui:report.table.remaining}} neodečítají, ale nová žádost je do
nároku započítá. Viz [Nároky](help:allowances).

## Rok jednoho člena

Kliknutím na jméno člena otevřeš jeho detail. Uvidíš jeho nárok v každé skupině, měsíční grafy,
všechny záznamy za rok i s jejich stavem a „{{ui:report.detail.changes}}“: každou změnu nároku od
administrátora, s tím, kdo a kdy ji udělal. Změny z přelomu roku jsou uvedené jako automatické.

Správci skupiny, manažer a správci organizace tam mají i „{{ui:report.detail.editQuota}}“, jen pro
aktuální rok. Nastavuje nárok a převedené dny; viz [Převod dní na konci roku](help:year-rollover).

Pokud chceš stejná data jako tabulku, viz [Export reportu do Excelu](help:export-report).
