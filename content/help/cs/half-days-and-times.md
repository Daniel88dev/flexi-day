---
id: half-days-and-times
translatedFrom: "3a7a16b96672"
title: Půlden a časy
summary: Zadej si půlden, který se počítá jako 0,5, doplň čas začátku a konce a přidej k žádosti poznámku.
keywords:
  [
    půlden,
    půl dne,
    dopoledne volno,
    odpoledne volno,
    hodiny,
    čas,
    čas začátku,
    čas konce,
    lékař,
    poznámka,
    část dne,
  ]
goldenQuestions:
  - question: Jak si vezmu volno jen na odpoledne?
    expectedArticles: [half-days-and-times]
    mustMention: [Půlden, počítá se jako 0, 5 dne]
  - question: Můžu si zadat půlden na několik dní po sobě?
    expectedArticles: [half-days-and-times]
    mustMention: [půlden jen na jeden den, jedna žádost na každý den]
---

Žádost může pokrýt i část dne. Zaškrtni „{{ui:newRequest.halfDay}}“, chceš-li zadat půl dne, a
doplň časy, pokud tvůj tým chce vědět, kdy budeš pryč.

## Půl dne

1. Otevři formulář žádosti a v polích „{{ui:newRequest.from}}“ a „{{ui:newRequest.to}}“ vyber
   stejný den.
2. Zaškrtni „{{ui:newRequest.halfDay}}“. Políčko se ukáže, jen když je žádost na jeden den.
3. Odešli jako obvykle.

Půlden se z nároku u typů, které ho mají, počítá jako 0,5 dne. V kalendáři ho označuje
„{{ui:calendar.halfDayMark}}“. Formulář se neptá, jestli jde o dopoledne, nebo odpoledne; napiš to do
časů nebo do poznámky.

Chceš-li půldny na několik dat, pošli na každé datum samostatnou žádost.

## Čas začátku a konce

„{{ui:newRequest.startTime}}“ a „{{ui:newRequest.endTime}}“ jsou nepovinné. Řeknou kolegům a
schvalovatelům, kdy budeš pryč, třeba kvůli návštěvě lékaře, a ukazují se na stránce
{{ui:nav.requests}} ve sloupci „{{ui:requests.columns.time}}“. Na tom, kolik se žádost počítá, časy
nic nemění: celý den se počítá jako 1, půlden jako 0,5, ať jsou časy jakékoli.

U rozsahu několika dní platí časy pro každý den.

## Poznámka

„{{ui:newRequest.note}}“ je volný text pro schvalovatele, třeba „Rodinný výlet“. U typu
{{ui:calendarRecordTypes.OTHER.label}} je povinná. Poznámku vidíš jen ty, schvalovatelé skupiny a
její správci; kolegové ne. Viz [Kdo vidí tvoje volno](help:who-sees-your-time-off).

## Pozdější změny

Půlden ani časy v odeslané žádosti sám nezměníš; zruš ji a zadej znovu. Typ, půlden, časy a
poznámku existující žádosti může změnit správce skupiny. Viz
[Zrušení nebo změna žádosti](help:cancel-or-change-a-request).
