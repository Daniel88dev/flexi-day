---
id: cancel-or-change-a-request
translatedFrom: "2a7f79fe61d0"
title: Zrušení nebo změna žádosti
summary: Zruš své čekající nebo schválené volno a zjisti, jak se mění data, typy a časy.
keywords:
  [
    zrušit,
    zrušit dovolenou,
    stáhnout žádost,
    smazat žádost,
    změnit data,
    přesunout dovolenou,
    upravit žádost,
    změna,
    chyba,
    špatný typ,
  ]
goldenQuestions:
  - question: Jak zruším dovolenou, která už je schválená?
    expectedArticles: [cancel-or-change-a-request]
    mustMention: [Zrušit žádost v podrobnostech žádosti, schválené žádosti jde zrušit]
  - question: Zadal jsem špatná data, můžu je změnit?
    expectedArticles: [cancel-or-change-a-request]
    mustMention: [data nejde upravit, zruš a zadej znovu]
---

Své žádosti můžeš zrušit kdykoli, čekající i schválené. Data upravit nejde: chceš-li volno přesunout,
zruš žádost a zadej nová data.

## Zrušení žádosti

- Otevři žádost z kalendáře na stránce {{ui:nav.dashboard}} nebo ze stránky {{ui:nav.requests}} a v
  podrobnostech stiskni „{{ui:vacationDetail.cancelRequest}}“. Zruší se tím každý její den.
- Nebo na stránce {{ui:nav.requests}} stiskni u řádku „{{ui:requests.cancel}}“.

Dny jsou hned zase volné a přestanou se počítat do nároku. Žádost zůstane na stránce
{{ui:nav.requests}} se stavem {{ui:status.cancelled}} a s tím, kdo ji zrušil. Když se zruší schválená
žádost, dostanou upozornění schvalovatelé skupiny.

## Kdo další může rušit

Žádost člena můžou zrušit i schvalovatelé skupiny, její správci a správci organizace, s volitelným
důvodem uloženým v historii. Člen dostane upozornění.

## Změna žádosti

| Co chceš změnit             | Jak                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Data                        | Zrušit a zadat znovu. Data nemůže upravit nikdo.                                                       |
| Typ, půlden, časy, poznámku | Správce skupiny, manažer nebo správce organizace stiskne v podrobnostech „{{ui:vacationDetail.edit}}“. |
| Zamítnutou žádost           | Zamítnutí je konečné. Zadej žádost znovu.                                                              |

Když tvoji žádost upraví někdo jiný, dostaneš upozornění a její historie ukáže „{{ui:vacationDetail.events.UPDATED}}“ i s tím, co
se změnilo. Změna typu nebo půldne se znovu porovná s tvým nárokem.

## Historie žádosti

Podrobnosti ukazují historii žádosti tobě, schvalovatelům skupiny a jejím správcům: kdy byla podaná,
schválená, zamítnutá, zrušená, okomentovaná nebo upravená, a kým. Změna provedená přes Asistenta
nebo AI aplikaci to v historii uvádí. Kolegové historii nevidí.

## Odebrání ze skupiny

Když tě správce skupiny ze skupiny odebere, zruší se tvoje čekající žádosti v ní a tvoje schválené
volno od zítřka dál. Minulé dny a dnešek zůstanou.
