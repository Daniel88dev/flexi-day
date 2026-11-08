---
id: directory-read-log
translatedFrom: "c6aa47e70130"
title: Citlivé sekce a záznam o čtení
summary: Proč Kontakt a Osobní údaje zůstávají skryté, dokud nestiskneš Zobrazit, co záznam o čtení ukládá o tom, kdo je otevřel, a kdo záznam může číst.
keywords:
  [
    záznam o čtení,
    log přístupů,
    audit,
    kdo si prohlížel můj profil,
    citlivé údaje,
    soukromé údaje,
    zobrazit,
    skryto,
    gdpr,
    žádost subjektu údajů,
    šifrování,
  ]
goldenQuestions:
  - question: Dá se zjistit, kdo si prohlížel moji adresu bydliště?
    expectedArticles: [directory-read-log]
    mustMention: [záznam o čtení, vlastník a správci organizace, uchovává se 12 měsíců]
  - question: Proč u sekce Kontakt stojí, že je skrytá, dokud ji neotevřu?
    expectedArticles: [directory-read-log]
    mustMention: [Zobrazit, zaznamená se do záznamu o čtení]
---

{{ui:directory.history.sections.CONTACT}} (soukromý telefon, soukromý e-mail, nouzové kontakty) a
{{ui:directory.history.sections.PERSONAL}} (adresa bydliště, datum narození) jsou citlivé sekce
[profilu v adresáři](help:directory-profiles). Ukládají se šifrovaně a jejich hodnoty nikdo neuvidí jen
tím, že profil otevře.

## Otevření citlivé sekce

Na profilu je u sekce „{{ui:directory.profile.hidden}}“. Stiskni „{{ui:directory.profile.show}}“ a
uvidíš ji. Jde to jen tam, kde ti tabulka oprávnění dovoluje sekci číst: ve výchozím stavu samotnému
člověku, HR, správcům organizace a vlastníkovi.

Otevření sekce někoho jiného se zapíše do záznamu o čtení a stránka to řekne. Otevření vlastního
profilu se nezapisuje. Otevřená sekce zůstane otevřená, dokud zůstáváš na profilu toho člověka a na
jeho stránce úprav.

## Co záznam o čtení ukládá

Každý záznam obsahuje, kdo sekci otevřel, čí profil, kterou sekci, kdy a skupinu lidí, která to
dovolila, třeba HR nebo Správce organizace. Hodnoty nikdy. Zapisují se sem i exporty dat člověka.

Záznamy se uchovávají 12 měsíců a pak se smažou. Zůstávají i po vymazání člověka, protože žádné
hodnoty neobsahují.

## Čtení záznamu

Vlastník a správci organizace otevřou „{{ui:directory.settings.readLog}}“ v
{{ui:directory.settings.tab}} na stránce {{ui:nav.directory}}. Filtrovat jde podle člověka nebo
podle čtenáře a tlačítkem „{{ui:directory.settings.readLogPanel.older}}“ se dostaneš dál do minulosti.
HR záznam číst nemůže a aplikace pro iPhone ho nikdy neukazuje.

Když je adresář vypnutý, vlastník a správci organizace se k záznamu dostanou z karty
„{{ui:organization.directory.title}}“ na stránce {{ui:nav.organization}}.

## Když se někdo ptá, co o něm máte

Pokud se někdo ptá, kdo k jeho údajům přistupoval, odpoví záznam o čtení. Kopii všeho, co jeho profil
obsahuje, dá export člověka, který spouští vlastník a správci organizace z profilu. Ten obsahuje i
záznamy o čtení, které se ho týkají, s účelem, třeba personální agenda, místo jmen čtenářů.
