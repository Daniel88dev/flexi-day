---
id: attendance-ceilings
translatedFrom: "4f2a76d5718b"
title: Zapomenuté odchody a automaticky uzavřené směny
summary: Co se stane, když směna nebo pauza přesáhne limit organizace, jak se ukáže označení automatického uzavření a jak nastavit skutečný čas.
keywords:
  [
    uzavřeno automaticky,
    zapomněl jsem zaznamenat odchod,
    směna se uzavřela sama,
    limit,
    maximální délka směny,
    16 hodin,
    příliš dlouhá pauza,
    označeno,
    stále otevřeno,
    byl uzavřen za tebe,
  ]
goldenQuestions:
  - question: Den mi ukazuje 16 hodin, protože jsem zapomněl zaznamenat odchod. Jak to opravím?
    expectedArticles: [attendance-ceilings, attendance-corrections]
    mustMention: [uzavřeno po limitu směny, Opravit, nastav čas skutečného odchodu]
  - question: Dá se změnit, jak dlouho může směna běžet, než se sama uzavře?
    expectedArticles: [attendance-ceilings, attendance-setup]
    mustMention: [Uzavřít směnu po, správci organizace, karta Docházka]
---

Limit je nejdelší doba, po kterou může běžet směna nebo pauza. Když někdo zapomene zaznamenat odchod
nebo ukončit pauzu, Flexi Day ji v limitu uzavře a označí, aby se zapomenutý odchod nepočítal jako
den, který nikdy neskončí.

## Dva limity

| Limit                                                | Výchozí  | Rozsah               |
| ---------------------------------------------------- | -------- | -------------------- |
| „{{ui:organization.attendance.sessionCeilingLabel}}“ | 16 hodin | 1 až 24 hodin        |
| „{{ui:organization.attendance.breakCeilingLabel}}“   | 2 hodiny | 15 minut až 24 hodin |

Mění je správci organizace na kartě „{{ui:organization.attendance.title}}“ na stránce
{{ui:nav.organization}}.

## Co se stane

Noční běh uzavře směnu, která limit přesáhla, v okamžiku, kdy limitu dosáhla: směna začatá v 8:00 se
16hodinovým limitem skončí o půlnoci. Pauza, která přesáhla svůj limit, skončí tam taky, a nikdy ne
po konci své směny.

Dostaneš jedno upozornění v aplikaci s odkazem na daný den. Na stránce {{ui:nav.myAttendance}} má den
označení „{{ui:clock.autoClosedFlag}}“ a zprávu, kdy byl uzavřen. Další příchod ti to neblokuje.

Směna, která ještě běží z dřívějšího dne a noční běh ji zatím neuzavřel, je označená
„{{ui:clock.stillOpenFlag}}“. Uzavřeš ji záznamem odchodu.

## Nastavení skutečného času

1. Otevři označený den na stránce {{ui:nav.myAttendance}} a stiskni „{{ui:clock.correct}}“.
2. Změň odchod na čas, kdy jsi opravdu odešel, nebo konec pauzy na čas, kdy ses vrátil.
3. Ulož.

Oprava odchodu označení zruší. Sám to můžeš udělat jen v okně samoobsluhy své organizace; jinak
požádej správce skupiny nebo správce organizace. Viz [Oprava docházky](help:attendance-corrections).

## Pro správce

Automaticky uzavřené směny mají na stránce {{ui:nav.teamAttendance}} vlastní označení, takže vidíš,
kdo ještě musí nastavit skutečný čas. Když odchod opravíš ty, označení se zruší stejně.
