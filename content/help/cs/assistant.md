---
id: assistant
translatedFrom: "20144645dbb8"
title: Co umí Asistent
summary: Zeptej se Asistenta na Flexi Day vlastními slovy a nech ho připravit změny, které potvrdíš.
keywords: [asistent, chat, ai, zeptat, otázka, týdenní limit, využití, potvrdit, karta]
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
{{ui:nav.organization}}. Jakmile je zapnutý, najde každý člen tlačítko Asistent v horní liště na
každé stránce. Aplikace pro iPhone ho nemá.

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
dokud kartu nepotvrdíš. Volbou „Teď ne“ ji zahodíš. Změna provedená touto cestou je označená jako
provedená přes Asistenta.

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
