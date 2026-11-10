---
id: group-permissions
translatedFrom: "52bdc2c3b6c8"
title: Oprávnění ve skupině, manažer a odebrání členů
summary: Co dovolují Zobrazení, Správce, Schvalovatel a Sledován, jak je změnit, kdo je manažer a co udělá odebrání člena.
keywords:
  [
    oprávnění,
    role,
    schvalovatel,
    správce,
    zobrazení,
    sledován,
    manažer,
    změnit manažera,
    odebrat člena,
    udělat z někoho schvalovatele,
  ]
goldenQuestions:
  - question: Jak v týmu udělám z někoho schvalovatele?
    expectedArticles: [group-permissions]
    mustMention: [Upravit oprávnění v záložce Členové, Schvalovatel]
  - question: Proč kolegyně nevidí kalendář týmu?
    expectedArticles: [group-permissions]
    mustMention: [oprávnění Zobrazení]
  - question: Co se stane se zadanou dovolenou, když někoho odeberu ze skupiny?
    expectedArticles: [group-permissions]
    mustMention: [čekající žádosti a budoucí volno se zruší, minulé záznamy zůstanou]
---

Každý člen skupiny má čtyři oprávnění, která vidíš jako sloupce v záložce
{{ui:groupDetail.tabs.members}} skupiny.

## Čtyři oprávnění

| Oprávnění                           | Co dovoluje                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| {{ui:groupDetail.columns.view}}     | Vidět volno všech ve skupině. Bez něj člen vidí jen své vlastní.                                                                   |
| {{ui:groupDetail.columns.admin}}    | Spravovat členy a oprávnění, kvóty, pozvánky, nastavení a zrcadlení a zadávat volno za členy. Zahrnuje Zobrazení. Nic neschvaluje. |
| {{ui:groupDetail.columns.approver}} | Schvalovat nebo zamítat žádosti členů o volno. Nic nespravuje.                                                                     |
| {{ui:groupDetail.columns.tracked}}  | Zadávat si volno v této skupině. Vypni ho u někoho, kdo skupinu jen dohlíží.                                                       |

Kdo se připojí přes pozvánku, má zapnuté Zobrazení a Sledován, Správce a Schvalovatel vypnuté.

## Změna oprávnění

1. Otevři skupinu ze stránky {{ui:nav.groups}} a zůstaň na záložce {{ui:groupDetail.tabs.members}}.
2. Stiskni „{{ui:groupDetail.editPermissions}}“ a přepni hodnoty.
3. Ulož.

Může to udělat správce skupiny, manažer a správci organizace. Nikdo si nemůže zvýšit vlastní
oprávnění a správce organizace se nemůže udělat schvalovatelem.

## Manažer

Každá skupina má jednoho manažera, označeného v záložce {{ui:groupDetail.tabs.members}}. Manažer
skupinu vždy spravuje a schvaluje její žádosti, ať ukazují hodnoty Správce a Schvalovatel cokoli.
Manažerem se nejdřív stane ten, kdo skupinu vytvořil.

Skupinu předá někomu jinému vlastník nebo správce organizace: na stránce skupiny stiskne
„{{ui:groupDetail.changeManager.button}}“ a vybere člena. Manažer ani správci skupiny to sami udělat
nemůžou. Oprávnění a schvalovatelé zůstanou, jak jsou.

## Odebrání člena

V záložce {{ui:groupDetail.tabs.members}} stiskni „{{ui:groupDetail.removeMember}}“ u daného člověka.
Ztratí přístup ke skupině a:

- jeho čekající žádosti ve skupině se zruší;
- jeho schválené volno v ní od zítřka dál se zruší;
- minulé záznamy a dnešek zůstanou i s historií.

Nikomu nepřijde upozornění. Manažera odebrat nejde; nejdřív dej skupině jiného manažera. Pokud byla
tato skupina pro daného člověka posledním spojením s organizací, skončí mu v ní i zaměstnání, pokud
organizace nepoužívá adresář lidí.
