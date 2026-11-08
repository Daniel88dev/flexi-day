---
id: attendance-setup
translatedFrom: "d5868f67d213"
title: Zapnutí docházky a nastavení jejích pravidel
summary: Jak správce organizace zapne docházku a co dělá časové pásmo, pracovní dny, přestávky, požadovaný čas, limity, poloha a samoobsluha zaměstnanců.
keywords:
  [
    docházka,
    evidence docházky,
    píchačky,
    zapnout docházku,
    nastavení docházky,
    pracovní doba,
    požadovaný čas,
    nárok na přestávku,
    časové pásmo,
    pracovní dny,
    státní svátky,
    poloha,
    gps,
    zkrácený úvazek,
  ]
goldenQuestions:
  - question: Jak ve firmě začnu evidovat odpracované hodiny?
    expectedArticles: [attendance-setup]
    mustMention: [karta Docházka na stránce Organizace, Pro nebo Enterprise, časové pásmo]
  - question: Jeden kolega pracuje na zkrácený úvazek. Může mít kratší požadovaný den?
    expectedArticles: [attendance-setup]
    mustMention: [karta Lidé, Požadováno denně]
  - question: Sleduje Flexi Day, kde si lidé zaznamenávají příchod?
    expectedArticles: [attendance-setup, clock-in-and-out]
    mustMention: [ve výchozím stavu vypnuto, prohlížeč se ptá pokaždé, uchovává se dvanáct měsíců]
---

Docházka umožňuje lidem zaznamenat příchod a odchod, chodit na pauzy a vidět odpracovaný čas. Patří
celé organizaci, ne jedné skupině, a funguje na tarifech Pro a Enterprise. Vlastník a správci
organizace ji nastavují na stránce {{ui:nav.organization}}, na kartě
„{{ui:organization.attendance.title}}“.

## Zapnutí

1. Otevři stránku {{ui:nav.organization}} a najdi kartu „{{ui:organization.attendance.title}}“.
2. Vyber „{{ui:organization.attendance.timezoneLabel}}“. Je povinné a určuje, kde končí den: noční
   směna patří ke dni, kdy začala.
3. Zapni „{{ui:organization.attendance.switchLabel}}“ a ulož.

Od té chvíle vidí každý v organizaci v postranním panelu {{ui:nav.myAttendance}} a správci skupin a
správci organizace navíc {{ui:nav.teamAttendance}}.

## Pravidla

| Nastavení                                          | Výchozí                                     | Co dělá                                                             |
| -------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| {{ui:organization.attendance.holidayCountryLabel}} | žádná                                       | Ve státní svátky té země se docházka nevyžaduje                     |
| {{ui:organization.attendance.workingDaysLabel}}    | pondělí až pátek                            | Ostatní dny nic nevyžadují; odpracovaný čas v nich se přesto počítá |
| {{ui:organization.attendance.breakAllowanceLabel}} | 30 min                                      | Odečte se z každého dne delšího než hranice, ať pauza byla, nebo ne |
| {{ui:organization.attendance.breakThresholdLabel}} | 6 h                                         | Pod ní se odečítají jen skutečně vybrané pauzy                      |
| {{ui:organization.attendance.requiredPerDayLabel}} | 8 h                                         | Odpracovaný čas, který vyžaduje každý pracovní den                  |
| {{ui:organization.attendance.balanceLabel}}        | {{ui:organization.attendance.balanceDaily}} | Ukazovat saldo po dnech, nebo za celý měsíc                         |
| {{ui:organization.attendance.sessionCeilingLabel}} | 16 h                                        | Směna, u které nikdo nezaznamenal odchod, se tu uzavře a označí     |
| {{ui:organization.attendance.breakCeilingLabel}}   | 2 h                                         | Zapomenutá pauza tu skončí a označí se                              |

Jak se to sčítá, popisuje [Odpracovaný čas a saldo](help:worked-time-and-balance), limity pak
[Zapomenuté odchody](help:attendance-ceilings).

Požadovaný čas, přestávky, pracovní dny a země pro svátky platí pro každý den včetně minulých, takže
změna posune i dřívější salda. Nové časové pásmo platí od dalšího příchodu. Každá změna těchto
nastavení se zaznamená i s tím, kdo ji udělal, a s hodnotami před a po.

## Jiný požadovaný čas pro jednoho člověka

Pro někoho s jinou smlouvou nastav vlastní „{{ui:organization.people.requiredLabel}}“ na kartě
„{{ui:organization.people.title}}“ na téže stránce. Když hodnotu smažeš, vrátí se k hodnotě
organizace. Externí spolupracovníci žádný požadovaný čas nemají.

## Poloha

„{{ui:organization.attendance.locationLabel}}“ je ve výchozím stavu vypnuté. Když ho zapneš,
prohlížeč se každého při každém příchodu a odchodu zeptá na svolení. Odmítnutí se nikdy nezaznamená
ani neoznačí. Souřadnice se uchovávají dvanáct měsíců. Dohodnout to se zaměstnanci je odpovědnost
organizace.

## Samoobsluha zaměstnanců

„{{ui:organization.attendance.selfServiceLabel}}“ určuje, jestli lidé smějí sami zadat směny, které
zapomněli zaznamenat, a opravovat svoje časy, a jak daleko zpátky. V nové organizaci je vypnutá. Viz
[Oprava docházky](help:attendance-corrections).

## Když tarif vyprší

Docházka se uspí: nikdo nemůže zaznamenat příchod ani začít pauzu, ale běžící směnu jde ukončit a
celá historie zůstane čitelná. Nic se nemaže a novým předplatným se vše obnoví. Vypnutí docházky
funguje stejně.
