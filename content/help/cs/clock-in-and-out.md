---
id: clock-in-and-out
translatedFrom: "b8c901d6fa47"
title: Příchod, odchod a pauza
summary: Jak zaznamenat příchod a odchod a jít na pauzu na stránce Moje docházka, co je směna a proč můžeš mít docházku vypnutou.
keywords:
  [
    příchod,
    odchod,
    píchnout,
    zaznamenat příchod,
    začít práci,
    pauza,
    přestávka,
    oběd,
    směna,
    stopky,
    evidence docházky je vypnutá,
    poloha,
  ]
goldenQuestions:
  - question: Jak ve Flexi Day začnu pracovní den?
    expectedArticles: [clock-in-and-out]
    mustMention: [Moje docházka, Zaznamenat příchod]
  - question: Proč nemůžu zaznamenat příchod? Píše to, že evidence docházky je vypnutá.
    expectedArticles: [clock-in-and-out]
    mustMention: [organizace docházku vypnula nebo jí vypršel tarif, zeptej se správce organizace]
  - question: Včera jsem zapomněl zaznamenat odchod. Co se stane?
    expectedArticles: [clock-in-and-out, attendance-ceilings]
    mustMention: [uzavře se po limitu směny, nastav skutečný čas]
---

Pokud tvoje organizace používá docházku, zaznamenáváš pracovní čas na stránce
{{ui:nav.myAttendance}}. Je na ní docházka a dnešní směny. V prohlížeči na telefonu otevře totéž
kulaté tlačítko „{{ui:clock.open}}“ ve spodní liště a má ho i aplikace pro iPhone.

## Příchod a odchod

1. Otevři stránku {{ui:nav.myAttendance}}.
2. Stiskni „{{ui:clock.clockIn}}“. Docházka ukáže „{{ui:clock.clockedIn}}“ a čas od příchodu.
3. Když končíš, stiskni „{{ui:clock.clockOut}}“.

Každý úsek od příchodu do odchodu je jedna směna. Za den jich můžeš mít víc; den je sečte. Časy jsou
ze serveru, ne z tvého zařízení.

V jedné organizaci máš zaznamenaný příchod jen jednou, ať jsi v kolika skupinách chceš. Pokud už máš
příchod zaznamenaný jinde, třeba na telefonu, Flexi Day ti řekne od kdy, a odchod pak zaznamenáš tam
nebo tady.

Směna patří ke dni, kdy začala, takže noční směna přes půlnoc se počítá do prvního dne.

## Pauza

Během směny stiskni „{{ui:clock.takeBreak}}“ a po návratu „{{ui:clock.endBreak}}“. Záznamem odchodu
se běžící pauza ukončí ve stejnou chvíli. Pauzy se odečítají od odpracovaného času; viz
[Odpracovaný čas a saldo](help:worked-time-and-balance).

## Dnešní směny

Pod docházkou je v části „{{ui:clock.today}}“ seznam tvých směn a pauz se součty
„{{ui:clock.presence}}“ a „{{ui:clock.breaks}}“. Dřívější dny uvidíš po přepnutí na
„{{ui:clock.views.week}}“ nebo „{{ui:clock.views.month}}“.

## Zapomenutý příchod nebo odchod

- **Zapomenutý odchod:** směna, která zůstala běžet, se sama uzavře po limitu organizace, ve výchozím
  stavu po 16 hodinách, a označí se. Nastav čas, kdy jsi opravdu odešel; viz
  [Zapomenuté odchody](help:attendance-ceilings).
- **Zapomenutý příchod:** směnu doplň dodatečně, pokud to tvoje organizace dovoluje; viz
  [Oprava docházky](help:attendance-corrections).

## Poloha

Některé organizace zaznamenávají, kde si příchod zaznamenáváš. Pokud tvoje ano, docházka tě na to
jednou upozorní a prohlížeč se při každém příchodu a odchodu zeptá na polohu. Můžeš odmítnout;
docházka funguje stejně a odmítnutí se nikde neoznačí.

## Když je docházka vypnutá

- **„{{ui:clock.inactiveTitle}}“**: organizace docházku vypnula, nebo jí vypršel tarif. Směnu, kterou
  jsi nechal běžet, ukončit jde a tvoje historie zůstane čitelná. Zeptej se správce organizace.
- **„{{ui:clock.externalTitle}}“**: externí spolupracovníci příchod nezaznamenávají a žádný čas
  nemají.
- **„{{ui:clock.employmentEnded}}“**: z organizace jsi odešel. Tvoje historie zůstane čitelná.

{{ui:nav.myAttendance}} vidíš v postranním panelu, jen dokud máš docházku zapnutou, nebo dokud ti
ještě běží směna.
