---
id: ai-usage
translatedFrom: "90bbcfc011de"
title: Stránka Využití AI
summary: Co vlastník a správci organizace vidí na stránce Využití AI, od útraty Asistenta po AI aplikace jednotlivých lidí, a jak aplikaci odvolat.
keywords:
  [
    využití ai,
    stránka využití,
    týdenní limit,
    útrata,
    odmítnuto,
    volání dnes,
    odvolat,
    připojené aplikace,
    předchozí týdny,
    deleted account,
  ]
goldenQuestions:
  - question: Kolik z limitu Asistenta jsme tento týden vyčerpali?
    expectedArticles: [ai-usage, assistant-weekly-limit]
    mustMention: [stránka Využití AI]
  - question: Jak odpojím AI aplikaci, kterou připojil někdo z členů?
    expectedArticles: [ai-usage]
    mustMention: [Odvolat, přestane fungovat při dalším volání]
---

Stránka {{ui:nav.aiUsage}} ukazuje, co v jedné organizaci využívá Asistent a AI aplikace vašich
členů. Vidí ji jen vlastník a správci organizace. Otevřete ji přes {{ui:nav.aiUsage}} v sekci
{{ui:nav.sections.organization}} v postranním panelu, přes „{{ui:aiSettings.card.seeUsage}}“ na AI
kartě stránky {{ui:nav.organization}} nebo přes „{{ui:assistant.limit.seeUsage}}“, když se Asistent
pozastaví. Pokud spravujete víc organizací, vyberte jednu nahoře.

Ukazuje, kolik kdo využil a kolik jeho zpráv bylo odmítnuto, nikdy ne to, co kdo napsal.

## {{ui:aiUsage.assistant.title}}

Kolik z Týdenního limitu organizace je vyčerpáno, v dolarech a v procentech, a kdy se limit
obnoví, ve vašem časovém pásmu. Počítají se i odpovědi, které se ještě píšou, takže částka může po
jejich dokončení trochu klesnout. Sloupce ukazují posledních osm týdnů vedle tohoto, týdny s
vyčerpaným limitem červeně. Po vyčerpání limitu karta řekne kdy a že je Asistent pozastavený pro
všechny do obnovení. Viz [Týdenní limit a využití](help:assistant-weekly-limit).

## {{ui:aiUsage.connections.title}}

Volání nástrojů všech AI aplikací dnes oproti dennímu limitu AI připojení, kdy se počet obnoví, a
sloupce za posledních 14 dní, dny s vyčerpaným limitem červeně. Viz
[Limity AI připojení](help:ai-connection-limits).

## {{ui:aiUsage.people.title}}

Jeden řádek pro každého, kdo tento týden použil Asistenta, měl odmítnutou zprávu, dnes volal nebo
má připojenou AI aplikaci:

- **{{ui:aiUsage.people.assistantWeek}}**: kolik tento týden stály jeho odpovědi Asistenta.
- **{{ui:aiUsage.people.refused}}**: zprávy, které Asistent tento týden odmítl jako mimo téma nebo
  nebezpečné. Od 3 je číslo oranžové.
- **{{ui:aiUsage.people.callsToday}}**: dnešní volání jeho AI aplikací, označená, jakmile dosáhnou
  denního limitu člena.
- **{{ui:aiUsage.people.apps}}**: aplikace, které v této organizaci připojil.

Využití účtu, který byl smazán a vymazán, se ukazuje jako „{{ui:aiUsage.people.deletedAccount}}“
bez jména, aby součty seděly. Na telefonu je každý člověk jedna karta.

## Odvolání aplikace

Otevřete člověka a uvidíte jeho aplikace s přístupem, datem připojení a posledním použitím.
Stiskněte {{ui:aiUsage.people.revoke}} a pak znovu {{ui:aiUsage.people.revoke}} pro potvrzení.
Aplikace přestane fungovat při dalším volání. Člověk ji může znovu připojit, dokud jsou AI
připojení zapnutá, a své aplikace si může odpojit sám v Nastavení. Viz
[AI připojení](help:ai-connections).

## {{ui:aiUsage.weeks.title}}

Všechny dřívější týdny, kdy se Asistent používal, od nejnovějšího, s datem vyčerpání limitu, pokud
k němu došlo. Otevřete týden a uvidíte, kdo kolik využil. Využití po lidech se uchovává 180 dní;
starší týdny ukazují jen součet za organizaci.

Pokud jsou Asistent i AI připojení vypnuté, stránka to řekne a odkáže na nastavení organizace.
