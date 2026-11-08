---
id: assistant
translatedFrom: "d28b95a0fa16"
title: Co umí Asistent
summary: Zeptej se Asistenta na Flexi Day vlastními slovy a nech ho připravit změny, které potvrdíš.
keywords:
  [
    asistent,
    chat,
    ai,
    zeptat,
    otázka,
    týdenní limit,
    využití,
    potvrdit,
    karta,
    zapnout,
    smlouva,
    dát vědět členům,
    panel,
    minulé chaty,
    nový chat,
  ]
goldenQuestions:
  - question: Může mi Asistent zadat den volna?
    expectedArticles: [assistant]
    mustMention: [kartu potvrdíš, nic se nezmění před potvrzením]
  - question: Proč nám Asistent tento týden přestal odpovídat?
    expectedArticles: [assistant]
    mustMention: [Týdenní limit, obnoví se v pondělí]
---

Asistent je chat ve webové aplikaci Flexi Day. Zeptej se ho česky nebo anglicky a odpoví ti z
článků nápovědy a z údajů, které už v aplikaci vidíš. Vidí přesně to, co vidíš ty, nic víc.

## Kdo ho může používat

Asistent je součástí tarifu Enterprise. Je vypnutý, dokud ho vlastník nezapne v kartě AI na stránce
{{ui:nav.organization}}. Jakmile je zapnutý, najde každý člen tlačítko „{{ui:assistant.button}}“ v
horní liště na každé stránce. Aplikace pro iPhone ho nemá.

Do té doby členové tlačítko nevidí. Na tarifu bez Enterprise ho vidí jen vlastník a dozví se z něj,
co Enterprise přidává. Na Enterprise s vypnutým Asistentem ho vidí vlastník a správci organizace, s
odkazem na nastavení organizace.

## Jak se panel používá

Tlačítko otevře panel na pravé straně stránky, takže můžeš vedle něj dál pracovat. V telefonu
zabere celou obrazovku. Nový chat ti nabídne pár otázek na začátek. Pokud má Asistenta víc tvých
organizací, vyber organizaci před první zprávou: chat zůstává v té, ve které začal.

Nad odpovědí vidíš každý krok, který Asistent udělal, třeba kontrolu zůstatku. Dokud se odpověď
píše, další zprávu poslat nemůžeš. Když spojení vypadne, panel ukáže, že se odpověď ještě píše, a
naváže na ni.

„{{ui:assistant.pastChats}}“ ukazuje tvoje chaty v částech {{ui:assistant.history.today}},
{{ui:assistant.history.thisWeek}} a {{ui:assistant.history.earlier}}. Chat tam můžeš smazat; vrátit
ho nepůjde. „{{ui:assistant.newChat}}“ začne nový.

## Zapnutí a vypnutí

Asistenta může zapnout nebo vypnout jen vlastník, přepínačem v kartě AI na stránce
{{ui:nav.organization}}. Správci organizace přepínač vidí, ale nemůžou ho změnit. Než se Asistent
zapne, přečte si vlastník, co Asistent dělá a co opouští Flexi Day. Napoprvé přijme za organizaci
Smlouvu o funkcích AI a Flexi Day zaznamená, kdo ji přijal, kdy a kterou verzi.

Volba „{{ui:aiSettings.turnOn.tellMembers}}“ je ve výchozím stavu zaškrtnutá a pošle všem v
organizaci upozornění v aplikaci a v telefonu. Stejný text si vlastník zkopíruje v kartě AI tlačítkem
„{{ui:aiSettings.card.copyNotice}}“, třeba do vašich vnitřních pravidel.

Když vyjde nová verze smlouvy, uvidí vlastník na každé stránce banner, dokud ji nepřijme. Asistent
mezitím funguje dál. Vypnutím o Asistenta členové hned přijdou; jejich chaty zůstanou čitelné, dokud
nebudou 180 dní staré.

## Na co se můžeš ptát

- Jak něco udělat, třeba jak si vzít půl dne volna nebo jak zaznamenat příchod. Odpovědi z
  nápovědy končí odkazy „Z nápovědy:“ na články, ze kterých vycházejí.
- Na tvoje vlastní údaje a na to, co smíš vidět: kolik dní ti zbývá, kdo je příští týden pryč, jestli
  byla žádost schválená, kolik jsi tento týden odpracoval.
- Schvalovatelé se můžou ptát na podrobnosti žádosti, která čeká na rozhodnutí.

Asistent odpovídá jen na otázky k Flexi Day. Neradí v právních otázkách (obrať se na personální
oddělení nebo zaměstnavatele), nepíše za tebe volný text a nikdy nedoporučuje cizí žádost schválit
ani zamítnout.

## Změny, které potvrdíš

Asistent umí připravit změnu: vytvořit žádost, zrušit tvoji žádost, schválit nebo zamítnout žádost,
zaznamenat příchod nebo odchod. Každá změna se ukáže jako karta s přesnými údaji. Nic se nezmění,
dokud kartu nepotvrdíš. Volbou „Teď ne“ ji zahodíš. Změna provedená touto cestou má v historii
žádosti nebo v historii docházky toho dne poznámku „{{ui:common.channel.assistant}}“.

## Týdenní limit

Každá organizace má na využití Asistenta Týdenní limit. Obnoví se každé pondělí v 00:00 UTC,
zobrazeno ve tvém časovém pásmu. Když organizace limit vyčerpá, Asistent do obnovení neodpovídá.
Vlastník a správci organizace vidí využití organizace po jednotlivých lidech na stránce Využití AI.

## Chaty

Každý chat patří k jedné organizaci. Chat se uzavře, když je příliš dlouhý nebo po 30 dnech bez
zprávy; dál si ho přečteš a v novém chatu pokračuješ. Chaty se mažou 180 dní po poslední zprávě a
kterýkoli můžeš kdykoli smazat sám. Když z organizace odejdeš, tvoje chaty v ní se smažou.

Asistent běží na modelech Claude od společnosti Anthropic. Kde se chaty ukládají a jak dlouho,
vysvětluje Smlouva o funkcích AI, kterou přijímá vlastník.
