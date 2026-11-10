---
id: team-attendance
translatedFrom: "72fbc39a8c0f"
title: Docházka týmu a její opravy
summary: Co správci skupin a správci organizace vidí na stránce Docházka týmu, co znamenají její označení a jak opravit, doplnit nebo zkontrolovat něčí směnu.
keywords:
  [
    docházka týmu,
    kdo je v práci,
    kdo má zaznamenaný příchod,
    přehled docházky,
    výkaz práce,
    hodiny týmu,
    označeno,
    označit jako zkontrolované,
    opravit čas zaměstnance,
    přidat směnu za někoho,
  ]
goldenQuestions:
  - question: Jak zjistím, kdo je teď v práci?
    expectedArticles: [team-attendance]
    mustMention: [Docházka týmu, Teď v práci]
  - question: Zaměstnanec si po skončení dne změnil hodiny. Jak to schválím?
    expectedArticles: [team-attendance, attendance-corrections]
    mustMention: [Označit jako zkontrolované, žádné schvalování]
  - question: Proč v Docházce týmu nevidím docházku manažera?
    expectedArticles: [team-attendance]
    mustMention: [manažer není členem skupiny, kterou vede, správci organizace vidí všechny]
---

{{ui:nav.teamAttendance}} ukazuje docházku lidí, které spravuješ: kdo je teď v práci, odpracovaný čas
každého po dnech a dny, na které je potřeba se podívat. V postranním panelu ji vidí správci skupin a
správci organizace, když je docházka zapnutá.

## Koho vidíš

| Jsi                                  | Vidíš                                         |
| ------------------------------------ | --------------------------------------------- |
| Správce skupiny nebo manažer skupiny | Členy skupin, které spravuješ                 |
| Správce organizace, vlastník         | Všechny v organizaci, včetně lidí bez skupiny |

Manažer skupiny nikdy není jejím členem, takže ostatní správci skupiny jeho docházku nevidí; správci
organizace ano. Externí spolupracovníci se nezobrazují.

Ve dnech volna se něčí {{ui:calendarRecordTypes.SICK.label}} zobrazí jako Pryč, pokud neschvaluješ
nebo nespravuješ skupinu, ve které byla absence zadaná.

## Jak číst přehled

- **„{{ui:teamAttendance.inNow}}“** ukazuje, kdo má právě zaznamenaný příchod a kdo je na pauze.
- Vyber „{{ui:teamAttendance.views.week}}“, „{{ui:teamAttendance.views.month}}“ nebo
  „{{ui:teamAttendance.views.range}}“ (nejvýš 93 dní). Filtruj podle skupiny, nebo podle organizace,
  pokud jich spravuješ víc.
- Každá buňka je odpracovaný čas jednoho člověka za jeden den. Šrafované dny docházku nevyžadují.

Označení:

- **Uzavřeno automaticky:** směna přesáhla limit a uzavřela se sama; skutečný čas je ještě potřeba
  nastavit. Viz [Zapomenuté odchody](help:attendance-ceilings).
- **Stále otevřeno:** směna, která běží z dřívějšího dne.
- **Den volna:** někdo zaznamenal příchod v den volna; čas se počítá do měsíce.
- **Zadáno:** zapsáno dodatečně, ne docházkou, a natrvalo.
- **Změněno později:** člověk směnu změnil po skončení dne, dokud ji neopravíš nebo neoznačíš jako
  zkontrolovanou.

Řádek o samoobsluze zaměstnanců nahoře říká, co si členové smějí opravit sami. Správci organizace ho
mění přes „{{ui:teamAttendance.selfServiceChange}}“.

## Oprava nebo doplnění směny

- Otevři den člověka, abys opravil jeho příchod, odchod nebo pauzy, nebo abys směnu smazal. Každá
  změna zůstane v historii směny s tvým jménem.
- Stiskni „{{ui:teamAttendance.addSession}}“ v prázdné buňce a zadej mu směnu. Označí se
  „{{ui:clock.enteredMark}}“ a on ji tak uvidí taky.

Správci mohou měnit kterýkoli den pracovního poměru, i po jeho skončení. Když organizaci vyprší
tarif, docházku jde číst, ale ne měnit.

## Označit jako zkontrolované

Když člověk změnil směnu po skončení dne, zůstane označená, dokud se na ni nepodíváš. Pokud je jeho
změna správná, otevři den a stiskni „{{ui:corrections.markChecked}}“. Žádný čas se tím neposune.
Pokud správná není, oprav ji, čímž se označení zruší taky. Žádné schvalování neexistuje: rozhoduje
správce.
