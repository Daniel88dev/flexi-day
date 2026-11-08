---
id: invite-people
translatedFrom: "0a799bd24f14"
title: Pozvání lidí do skupiny
summary: Pošli pozvánku e-mailem, sdílej kód pozvánky, když e-mail nedorazí, a stahuj pozvánky.
keywords:
  [
    pozvat,
    přidat člena,
    přidat lidi,
    přidat zaměstnance,
    kód pozvánky,
    znovu poslat pozvánku,
    zrušit pozvánku,
    nástup,
    nový kolega,
  ]
goldenQuestions:
  - question: Jak přidám do týmu nového kolegu?
    expectedArticles: [invite-people]
    mustMention: [záložka Pozvánky, Odeslat pozvánku, kód vyprší za 14 dní]
  - question: Kolegovi nepřišel e-mail s pozvánkou, co můžu udělat?
    expectedArticles: [invite-people]
    mustMention: [Zkopírovat kód, Připojit se ke skupině na stránce Skupiny]
---

Lidi do skupiny přidáš pozváním jejich e-mailové adresy. Zvát můžou správci skupiny, manažer skupiny
a správci organizace; ostatním je záložka {{ui:groupDetail.tabs.invites}} skrytá.

## Odeslání pozvánky

1. Otevři skupinu ze stránky {{ui:nav.groups}} a přejdi na {{ui:groupDetail.tabs.invites}}.
2. V části „{{ui:groupDetail.invites.title}}“ zadej e-mailovou adresu daného člověka.
3. Stiskni „{{ui:groupDetail.invites.send}}“.

Flexi Day mu e-mailem pošle odkaz a jednorázový kód pozvánky. Pozvánka funguje jen pro tuto adresu a
vyprší za 14 dní. Kdo nemá účet, založí si ho z odkazu a v jednom kroku se ocitne ve skupině.

## Když e-mail nedorazí

Pozvánka se objeví v části „{{ui:groupDetail.invites.pendingTitle}}“ i s kódem. Stiskni
„{{ui:groupDetail.invites.copy}}“ a pošli kód jinou cestou. Pozvaný se přihlásí, otevře
{{ui:nav.groups}} a zadá ho v části
„{{ui:groups.joinTitle}}“. Kód potřebuje účet s potvrzenou e-mailovou adresou. Pokud se e-mail
nepodařilo odeslat, záložka ti to řekne hned.

## Nové odeslání nebo stažení pozvánky

Chceš-li poslat novou pozvánku, pozvi stejnou adresu znovu. Starší pozvánka přestane fungovat, kód i
odkaz. „{{ui:groupDetail.invites.revoke}}“ pozvánku stáhne bez odeslání nové.

## Velikost skupiny

Čekající pozvánky se do limitu lidí ve skupině počítají stejně jako členové. Když je skupina plná,
odeslání selže, dokud neodebereš člena, nestáhneš pozvánku nebo nepřejdeš na vyšší tarif. Viz
[Tarify, ceny a limity](help:plans-and-limits).

## Co nový člen dostane

Připojí se se zapnutým Zobrazením a Sledován, s vypnutým Správcem a Schvalovatelem, a s letošním
nárokem podle výchozích hodnot skupiny. Jeho oprávnění změníš v záložce
{{ui:groupDetail.tabs.members}}. Viz [Oprávnění ve skupině](help:group-permissions).
