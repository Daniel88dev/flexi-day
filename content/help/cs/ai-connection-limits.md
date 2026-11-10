---
id: ai-connection-limits
translatedFrom: "28db4936db73"
title: Limity AI připojení
summary: Denní limit AI připojení, denní limit člena a limity pro každou aplikaci, a co AI aplikace uslyší, když některý vyčerpá.
keywords:
  [
    denní limit ai připojení,
    denní limit člena,
    limit vyčerpán,
    příliš mnoho volání,
    obnovení,
    půlnoc utc,
    ai připojení,
    mcp,
    volání denně,
  ]
goldenQuestions:
  - question: Moje AI aplikace hlásí, že je vyčerpaný denní limit Flexi Day. Kdy může volat znovu?
    expectedArticles: [ai-connection-limits]
    mustMention: [o půlnoci UTC]
  - question: Kolik volání denně můžou udělat AI aplikace naší organizace?
    expectedArticles: [ai-connection-limits]
    mustMention: ["5 000 v tarifu Pro", "20 000 v tarifech Enterprise a Custom", "1 000 na člověka"]
---

AI připojení mají limity, aby jedna aplikace nebo jeden člověk nevyčerpali, co sdílí celá
organizace. Počítají se jen volání nástrojů. Připojení, výpis toho, co aplikace umí, a kontrola
spojení se nepočítají.

## Denní limity

- **Denní limit AI připojení**: kolik volání smí za den udělat všechna AI připojení organizace
  dohromady. 5 000 v tarifu Pro, 20 000 v tarifech Enterprise a Custom.
- **Denní limit člena**: 1 000 na člověka v každé organizaci, aby jedna zacyklená aplikace
  nevyčerpala den celé organizace.

Oba se obnovují o půlnoci UTC. Vlastník vidí obě čísla, když zapíná AI připojení v kartě AI na
stránce {{ui:nav.organization}}.

## Limity pro každou aplikaci

Každá aplikace, kterou někdo připojil, smí udělat 300 volání nástrojů za 5 minut a 30 změn za
hodinu. Změna je vytvoření nebo zrušení žádosti, příchod nebo odchod; každá může poslat e-maily,
a proto mají změny nižší limit. Druhá aplikace téhož člověka má vlastní limity.

## Když se limit vyčerpá

Aplikace dostane zprávu v jazyce tvé aplikace, který limit vyčerpala a kdy se obnoví, aby ti to
mohla říct. Do té doby se její volání odmítají. Flexi Day samotné funguje dál, stejně jako tvoje
další aplikace, pokud organizace nevyčerpala denní limit AI připojení, který sdílí všechny
aplikace v ní. Nikomu nepřijde e-mail ani upozornění.
