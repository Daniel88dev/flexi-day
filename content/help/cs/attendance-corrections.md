---
id: attendance-corrections
translatedFrom: "970ef66a04c7"
title: Oprava docházky a doplnění zapomenuté směny
summary: Jak opravit čas příchodu nebo odchodu, doplnit zapomenutou směnu nebo pauzu a jak daleko zpátky ti to samoobsluha organizace dovolí udělat sám.
keywords:
  [
    oprava docházky,
    upravit čas,
    opravit příchod,
    špatný čas,
    zapomněl jsem zaznamenat příchod,
    chybějící den,
    přidat směnu,
    přidat pauzu,
    ruční zadání,
    samoobsluha,
    zadáno,
    změněno později,
    smazat směnu,
  ]
goldenQuestions:
  - question: Ráno jsem zapomněla zaznamenat příchod. Jak to opravím?
    expectedArticles: [attendance-corrections]
    mustMention: [zaznamenej příchod teď a oprav začátek, Opravit]
  - question: Jak doplním pracovní den, který jsem minulý týden nezaznamenal?
    expectedArticles: [attendance-corrections]
    mustMention: [Přidat směnu, okno samoobsluhy, požádej správce skupiny nebo organizace]
  - question: Proč u mé směny stojí Změněno po skončení dne?
    expectedArticles: [attendance-corrections]
    mustMention: [správce ji vidí označenou, dokud ji nezkontroluje]
---

Co můžeš opravit sám, závisí na nastavení samoobsluhy zaměstnanců ve tvé organizaci. Správce může
opravit cokoli vždy.

## Jak daleko zpátky

{{ui:nav.myAttendance}} ukazuje, co platí pro tebe:

| Samoobsluha               | Co můžeš udělat sám                                                        |
| ------------------------- | -------------------------------------------------------------------------- |
| Vypnutá                   | Zaznamenat příchod a odchod a jít na pauzu. Každá oprava jde přes správce. |
| Zapnutá, jen dnes         | Zadat a opravit dnešek a směnu, která ještě běží z dřívějšího dne.         |
| Zapnutá, určitý počet dní | Zadat a opravit dnešek a tolik dní před ním.                               |
| Zapnutá, bez omezení      | Zadat a opravit kterýkoli den svého pracovního poměru.                     |

Toto nastavení mění jen správci organizace na stránce {{ui:nav.organization}}. Pro den mimo tvoje okno
požádej správce skupiny nebo správce organizace. Po skončení pracovního poměru může tvoji docházku
měnit už jen správce.

## Oprava směny

1. Na stránce {{ui:nav.myAttendance}} otevři den a stiskni „{{ui:clock.correct}}“.
2. Změň čas příchodu nebo odchodu, případně časy pauzy. Pauzu přidáš tlačítkem
   „{{ui:corrections.addBreak}}“ nebo ji odeber.
3. Stiskni „{{ui:corrections.save}}“.

Oprava posouvá časy, nikdy dny: začátek musí zůstat ve dni, ke kterému směna patří, konec může přejít
přes půlnoc. Směna nesmí končit později než teď, nesmí být delší než limit směny organizace a nesmí
se překrývat s jinou směnou. Pauzy zůstávají uvnitř své směny a nepřekrývají se.

„{{ui:corrections.history}}“ ve stejném dialogu ukazuje každou změnu směny i s tím, kdo ji udělal.

## Doplnění zapomenuté směny

U dne stiskni „{{ui:clock.addSession}}“, nastav začátek a konec, přidej pauzy, pokud sis nějaké vzal,
a ulož. Pokud směna běžela přes půlnoc, zapni „{{ui:entry.nextDay}}“. Směna se natrvalo označí
„{{ui:clock.enteredMark}}“, takže každý pozná, že nebyla zaznamenaná docházkou.

Doplněná směna už musí být u konce. Pokud jsi zapomněl zaznamenat příchod a pořád pracuješ,
zaznamenej příchod teď a pak oprav začátek.

## Změny po skončení dne

Když směnu změníš až po jejím dni, ukáže se u ní „{{ui:clock.changedSessionMark}}“ a tvůj správce ji
na stránce {{ui:nav.teamAttendance}} vidí označenou, dokud ji neopraví nebo neoznačí jako
zkontrolovanou. Mezitím se nic neblokuje.

## Mazání

Smazat můžeš směnu, kterou jsi sám zadal, nebo dnešní zaznamenanou směnu. Zaznamenanou směnu z
dřívějšího dne můžeš opravit, ale smazat ji může jen správce, a totéž platí pro směnu, kterou ti zadal
správce. Smazaná směna si nechá historii a přestane se počítat.

## Správci

Správci skupin opravují a doplňují směny členům svých skupin a správci organizace komukoli, v
kterýkoli den jeho pracovního poměru. Viz [Docházka týmu](help:team-attendance).

Když organizaci vyprší tarif, docházku jde číst, ale ne opravovat.
