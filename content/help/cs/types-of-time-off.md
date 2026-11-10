---
id: types-of-time-off
translatedFrom: "7904714a46ca"
title: Typy volna
summary: Typy záznamů, které si můžeš zadat, které z nich čerpají z nároku a k čemu který slouží.
keywords:
  [
    typy volna,
    dovolená,
    home office,
    práce z domova,
    nemoc,
    nemocenská,
    placené volno,
    neplacené volno,
    studijní volno,
    státní svátek,
    zdravotní volno,
    ostatní,
  ]
goldenQuestions:
  - question: Které typy volna se mi odečítají z dní?
    expectedArticles: [types-of-time-off]
    mustMention: [Dovolená, Home Office, Zdravotní volno]
  - question: Jak zadám práci z domova?
    expectedArticles: [types-of-time-off, request-time-off]
    mustMention: [typ Home Office, má vlastní nárok]
---

Každá žádost má typ. Formulář žádosti ukazuje tři nejběžnější jako tlačítka a ostatní pod
„{{ui:newRequest.others}}“.

## Typy

| Typ                                             | K čemu slouží                                                        | Nárok               |
| ----------------------------------------------- | -------------------------------------------------------------------- | ------------------- |
| {{ui:calendarRecordTypes.VACATION.label}}       | Placená řádná dovolená. Výchozí typ nové žádosti.                    | Ano, převádí se     |
| {{ui:calendarRecordTypes.HOME_OFFICE.label}}    | Práce na dálku: pryč z kanceláře, ne z práce.                        | Ano                 |
| {{ui:calendarRecordTypes.SICK.label}}           | Nepřítomnost kvůli nemoci.                                           | Ne                  |
| {{ui:calendarRecordTypes.PAID_TIME_OFF.label}}  | Placená nepřítomnost, která není řádnou dovolenou ani benefitem.     | Ne                  |
| {{ui:calendarRecordTypes.NON_PAID_LEAVE.label}} | Neplacená nepřítomnost.                                              | Ne                  |
| {{ui:calendarRecordTypes.STUDY_LEAVE.label}}    | Čas na studium, vedený odděleně od dovolené.                         | Ne                  |
| {{ui:calendarRecordTypes.SICK_DAY.label}}       | Placený den volna z benefitu zdravotního volna, bez nutnosti nemoci. | Ano, kde je zapnutý |
| {{ui:calendarRecordTypes.OTHER.label}}          | Cokoli jiného. Poznámka, která to vysvětlí, je povinná.              | Ne                  |
| {{ui:calendarRecordTypes.BANK_HOLIDAY.label}}   | Celofiremní uzavírka. Ve formuláři žádosti není.                     | Ne                  |

## Které typy čerpají z nároku

{{ui:calendarRecordTypes.VACATION.label}}, {{ui:calendarRecordTypes.HOME_OFFICE.label}} a
{{ui:calendarRecordTypes.SICK_DAY.label}} mají ve skupině každý vlastní roční nárok. Žádost, která by
ho překročila, aplikace odmítne. Do dalšího roku se převádějí jen nevyčerpané dny dovolené. Viz
[Nároky](help:allowances) a [Převod dní na konci roku](help:year-rollover).

Ostatní typy se zadávají bez omezení, ale i tak potřebují schválení a ukazují se v kalendáři a v
reportech.

## Nemoc a zdravotní volno

{{ui:calendarRecordTypes.SICK_DAY.label}} se objeví jen ve skupinách, jejichž organizace má na
placeném tarifu zapnutý benefit zdravotního volna. Viz
[Benefit zdravotního volna](help:sick-day-benefit). {{ui:calendarRecordTypes.SICK.label}} je k
dispozici vždy. Kolegové vidí záznam {{ui:calendarRecordTypes.SICK.label}} jen jako
„{{ui:calendarRecordTypes.AWAY.label}}“ a reporty ho před nimi vynechávají. Viz
[Kdo vidí tvoje volno](help:who-sees-your-time-off).

## Externí spolupracovníci

Externí spolupracovník si může zadat jen typy, které nečerpají z nároku, třeba
{{ui:calendarRecordTypes.NON_PAID_LEAVE.label}}.
