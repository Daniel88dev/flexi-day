---
id: ai-connections
translatedFrom: "e14219c923d0"
title: Připoj k Flexi Day AI aplikaci
summary: Nech AI aplikaci, jako je Claude, ChatGPT nebo Cursor, číst tvoje údaje ve Flexi Day a dělat za tebe změny.
keywords:
  [
    ai připojení,
    mcp,
    claude,
    chatgpt,
    cursor,
    konektor,
    připojit,
    odpojit,
    jen čtení,
    čtení a zápis,
    zapnout,
    smlouva,
    dát vědět členům,
  ]
goldenQuestions:
  - question: Jak připojím ChatGPT k Flexi Day?
    expectedArticles: [ai-connections]
    mustMention: [karta AI připojení v Nastavení, https://api.flexi-day.com/mcp]
  - question: Může moje AI aplikace schvalovat žádosti?
    expectedArticles: [ai-connections]
    mustMention: [schvalovat a zamítat jen ve Flexi Day]
---

AI připojení umožní AI aplikaci, kterou už používáš, třeba Claude, ChatGPT nebo Cursor, pracovat s
tvými údaji ve Flexi Day. Aplikace jedná jako ty, v jedné organizaci a se stejnými oprávněními, jaká
máš v aplikaci.

## Než začneš

AI připojení fungují v každém placeném tarifu: Pro, Enterprise i Custom. Vlastník vybere jedno ze
tří nastavení pro „{{ui:aiConnectionsSettings.card.title}}“ v kartě AI na stránce
{{ui:nav.organization}}:

- **{{ui:aiConnectionsSettings.card.levels.off}}**, výchozí stav: žádná aplikace se nepřipojí.
- **{{ui:aiConnectionsSettings.card.levels.read}}**: aplikace čtou to, co vidíš ty.
- **{{ui:aiConnectionsSettings.card.levels.write}}**: aplikace navíc můžou měnit tvoje vlastní
  záznamy.

## Zapnutí AI připojení

Nastavení může změnit jen vlastník. Správci organizace ho vidí, ale změnit ho nemůžou, a v tarifu
Free zůstává vypnuté. Než se AI připojení zapnou, vlastník si přečte, co aplikace umí a co opouští
Flexi Day: co aplikace přečte, jde ke společnosti, která za ní stojí, podle vlastní smlouvy člena s
ní. Osobní účty AI aplikací si mohou přečtená data uchovat nebo na nich trénovat, takže které
aplikace můžou lidé používat, určují pravidla vaší organizace.

Úroveň, se kterou začne, vybere vlastník v části „{{ui:aiConnectionsSettings.turnOn.startWith}}“.
Když se nějaká funkce AI zapíná poprvé, vlastník přijme za organizaci Smlouvu o funkcích AI a Flexi
Day zaznamená, kdo ji přijal, kdy a kterou verzi. Pokud aktuální verzi už přijal při zapnutí
Asistenta, AI připojení se znovu neptají.

„{{ui:aiSettings.turnOn.tellMembers}}“ je ve výchozím stavu zaškrtnuté a pošle všem v organizaci
upozornění v aplikaci a v telefonu. Dokud jsou AI připojení zapnutá, vlastník zkopíruje stejný text
z karty AI tlačítkem „{{ui:aiSettings.card.copyNotice}}“.

Přechod z {{ui:aiConnectionsSettings.card.levels.read}} na
{{ui:aiConnectionsSettings.card.levels.write}} nové přijetí smlouvy nepotřebuje. Snížení na
{{ui:aiConnectionsSettings.card.levels.read}} nebo vypnutí AI připojení musí vlastník nejdřív
potvrdit, protože odpojí aplikace. Každá změna se zaznamená i s tím, kdo ji udělal a kdy.

## Připojení aplikace

1. Otevři {{ui:nav.settings}} a najdi kartu AI připojení.
2. Zvol „Připojit AI aplikaci“ a zkopíruj adresu serveru, `https://api.flexi-day.com/mcp`.
3. V AI aplikaci přidej vlastní konektor s touto adresou.
4. Když tě aplikace vyzve, přihlas se do Flexi Day, vyber organizaci a povol přístup.

Pokud patříš do více organizací, každé připojení platí pro jednu z nich. Další přidáš novým
připojením.

## Co připojená aplikace umí

Čte všechno, co ve Flexi Day vidíš ty, a hledá v nápovědě. Při nastavení Čtení a zápis navíc
vytvoří žádost, zruší tvoji žádost a zaznamená tvůj příchod nebo odchod. Žádosti schvalovat ani
zamítat neumí (to udělej ve Flexi Day nebo požádej [Asistenta](help:assistant)) a nemění role, fakturaci ani
nastavení.

Změna, kterou aplikace provede, má v historii žádosti nebo v historii docházky poznámku
„{{ui:common.channel.mcp}}“. Když otevře citlivou sekci něčího profilu, ukáže se toto čtení stejně
i v Záznamu o čtení organizace.

## Limity

Každá organizace má denní limit AI připojení: 5 000 volání denně v tarifu Pro a 20 000 v tarifu
Enterprise. Každý člověk má navíc denní limit člena 1 000 volání. Oba se obnovují o půlnoci UTC.
Když aplikace limit vyčerpá, dostane zprávu, o který limit jde a kdy se obnoví.

## Odpojení

V kartě AI připojení zvol u aplikace „Odpojit“. Aplikace se odpojí také, když si obnovíš heslo,
když smažeš svůj účet a když vlastník AI připojení vypne. Snížení nastavení na Jen čtení odebere
přístup k zápisu. Vlastník a správci organizace vidí aplikace každého člověka na stránce Využití AI
a můžou je tam odebrat.
