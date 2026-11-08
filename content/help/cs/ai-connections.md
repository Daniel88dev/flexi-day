---
id: ai-connections
translatedFrom: "60ab9800a7db"
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
4. Aplikace otevře stránku Flexi Day, která ji jmenuje. Přihlas se jako obvykle. Pokud používáš
   dvoufázové ověření, Flexi Day si řekne o kód. Dokud přístup nepovolíš, nic se nesdílí.
5. Vyber organizaci, ve které má aplikace pracovat. U každé vidíš, jaký přístup povoluje.
   Organizace, kde vlastník AI připojení nezapnul nebo které mají tarif Free, jsou uvedené i s
   důvodem. Pokud to nepovoluje žádná, vrať se do aplikace.
6. Zkontroluj stránku se souhlasem a zvol „{{ui:aiConnect.consent.allow}}“.

Každé připojení platí pro jednu organizaci a vybíráš ji při každém připojení. Další přidáš novým
připojením.

### Stránka se souhlasem

- Když Flexi Day mohl adresu aplikace ověřit, stránka ukáže „Adresa ověřena“ i s adresou. Jinak
  napíše „{{ui:aiConnect.consent.notVerified}}“: název uvádí sama aplikace.
- Když je aplikace program v tvém počítači, třeba Claude Code nebo Cursor, upozornění tě požádá,
  abys ji povolil jen tehdy, když jsi připojení z ní právě spustil.
- „{{ui:aiConnect.consent.read}}“ je součástí každého připojení. „{{ui:aiConnect.consent.write}}“ je
  zaškrtnuté; odškrtni ho a připojíš jen pro čtení. V organizaci s nastavením Jen čtení se nenabízí.

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
