---
id: sick-day-benefit
translatedFrom: "0b80ffa006ab"
title: Placené zdravotní volno s benefitem zdravotního volna
summary: Zapni benefit zdravotního volna, aby si členové mohli žádat o zdravotní volno z ročního nároku.
keywords:
  [
    zdravotní volno,
    sick day,
    sick days,
    benefit zdravotního volna,
    placené volno při nemoci,
    benefit,
    nárok na zdravotní volno,
  ]
goldenQuestions:
  - question: Jak dám týmu placené sick days?
    expectedArticles: [sick-day-benefit]
    mustMention:
      - Nabízet placené zdravotní volno na stránce Organizace
      - zdravotní volno v záložce Kvóty každé skupiny
  - question: Jaký je rozdíl mezi Nemocí a Zdravotním volnem?
    expectedArticles: [sick-day-benefit, types-of-time-off]
    mustMention: [Zdravotní volno čerpá z ročního nároku, Nemoc žádný nárok nemá]
---

Benefit zdravotního volna dovolí členům požádat o {{ui:calendarRecordTypes.SICK_DAY.label}}: placený
den volna z ročního nároku, bez nutnosti být nemocný. Dokud ho správce nezapne, je vypnutý, a
potřebuje placený tarif.

{{ui:calendarRecordTypes.SICK_DAY.label}} není totéž co {{ui:calendarRecordTypes.SICK.label}}.
{{ui:calendarRecordTypes.SICK.label}} zaznamenává nepřítomnost kvůli nemoci, nemá nárok a může ji
použít každý.

## Zapnutí

1. Otevři {{ui:nav.organization}}. Může to udělat vlastník nebo správce.
2. V části „{{ui:organization.sickDayTitle}}“ zapni „{{ui:organization.sickDayLabel}}“.

Pak nastav nároky. Správci skupin dají každému členovi v záložce {{ui:groupDetail.tabs.quotas}}
skupiny počet dní zdravotního volna na rok a v části „{{ui:groupDetail.groupDefaults}}“ můžou
nastavit výchozí hodnotu pro nové členy. Viz [Nároky](help:allowances).

## Jak ho členové používají

{{ui:calendarRecordTypes.SICK_DAY.label}} se ve formuláři žádosti objeví pod
„{{ui:newRequest.others}}“, ve skupinách, jejichž organizace má benefit zapnutý. Prochází stejným
schvalováním jako každá žádost a „{{ui:widgets.balance.title}}“ na stránce {{ui:nav.dashboard}}
ukazuje, kolik dní zbývá.

Nevyčerpané dny zdravotního volna se do dalšího roku nepřevádějí. Kolegové vidí zdravotní volno pod
jeho vlastním názvem; jako „{{ui:calendarRecordTypes.AWAY.label}}“ se jim ukazuje jen
{{ui:calendarRecordTypes.SICK.label}}.

## Vypnutí a propadlé tarify

Vypnutím benefitu skončí nové žádosti o zdravotní volno. Nároky a zadané dny zdravotního volna
zůstanou a opětovné zapnutí všechno vrátí.

Když placený tarif propadne, benefit usne stejně: nic se nesmaže, nastavení zůstane zapnuté a o
zdravotní volno půjde znovu žádat, jakmile organizace znovu předplatí. Už zadané dny zdravotního
volna jde během propadnutí dál upravovat.
