---
id: approve-requests
translatedFrom: "9073afcfb5bf"
title: Schválení nebo zamítnutí žádostí o volno
summary: Kde schvalovatelé najdou čekající žádosti, jak je schválit nebo zamítnout s důvodem a kdo smí rozhodovat.
keywords:
  [
    schválit,
    schválení,
    zamítnout,
    odmítnout,
    čekající žádosti,
    čeká na schválení,
    schvalovatel,
    komentář,
    důvod,
  ]
goldenQuestions:
  - question: Kde vidím žádosti, které čekají na moje schválení?
    expectedArticles: [approve-requests]
    mustMention: [Čekající schválení na Přehledu, stránka Žádosti]
  - question: Můžu si schválit vlastní dovolenou?
    expectedArticles: [approve-requests]
    mustMention: [jen s oprávněním Schvalovatel v té skupině]
  - question: Jsem správce organizace, proč nevidím tlačítko Schválit?
    expectedArticles: [approve-requests, organization-roles]
    mustMention: [správci organizace nemůžou schvalovat, oprávnění Schvalovatel ve skupině]
---

O žádostech ve skupině rozhodují její schvalovatelé: členové s oprávněním Schvalovatel a manažer
skupiny. Když na tebe žádost čeká, dostaneš e-mail a upozornění v aplikaci.

## Kde najdeš čekající žádosti

- **{{ui:nav.dashboard}}:** karta „{{ui:widgets.approvals.title}}“ vypisuje, co čeká na tebe, s
  tlačítky „{{ui:widgets.approvals.approve}}“ a „{{ui:widgets.approvals.decline}}“.
- **{{ui:nav.requests}}:** vyber skupinu a měsíce a pak filtr „{{ui:requests.filters.pending}}“.
  Každý řádek je jedna celá žádost s tlačítky „{{ui:requests.approve}}“ a „{{ui:requests.reject}}“.
- **Kalendář:** klikni na žádost a otevřou se její podrobnosti.

## Rozhodnutí s důvodem

V podrobnostech žádosti uvidíš data, typ, poznámku, soubory a historii. Napiš do pole komentář nebo
důvod a stiskni „{{ui:vacationDetail.approve}}“ nebo „{{ui:vacationDetail.decline}}“. Komentář se
objeví v historii žádosti a člen dostane upozornění na rozhodnutí.

Rozhodnutí platí pro celou žádost, pro každý její den. Zamítnutí je konečné; člen si v případě
potřeby zadá žádost znovu. Schválenou žádost jde později ještě zrušit, a to členem i tebou.

Chceš-li se jen na něco zeptat, napiš to a stiskni „{{ui:vacationDetail.comment}}“. Člen dostane
upozornění a na jeho odpověď zase schvalovatelé.

## Kdo smí rozhodovat

- Členové s oprávněním Schvalovatel a manažer skupiny.
- Ne správci organizace: skupiny spravují, ale o ničím volnu nerozhodují. Ke schvalování potřebují
  oprávnění Schvalovatel přímo ve skupině.
- Ne o záznamech zrcadlených z jiné skupiny. O těch se rozhoduje ve skupině, kde byly zadané.

O vlastní žádosti můžeš rozhodnout jen s oprávněním Schvalovatel v dané skupině. Jinak o ní rozhodne
jiný schvalovatel.

## Nároky při schvalování

Schválení zkontroluje nárok člena na daný typ a rok, a počítá přitom jen už schválené dny. Žádost,
se kterou by nárok překročil, schválit nejde; správce skupiny může nárok nejdřív navýšit. Viz
[Nároky](help:allowances).
