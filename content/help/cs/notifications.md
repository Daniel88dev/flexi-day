---
id: notifications
translatedFrom: "ca452c26b60e"
title: Oznámení a e-maily
summary: Co ukazuje zvoneček v horní liště, která oznámení chodí i e-mailem nebo do iPhonu a jak vypnout e-maily k žádostem.
keywords:
  [
    oznámení,
    notifikace,
    zvoneček,
    upozornění,
    e-mailová oznámení,
    e-maily,
    odhlásit e-maily,
    vypnout e-maily,
    push notifikace,
    označit jako přečtené,
    smazat oznámení,
  ]
goldenQuestions:
  - question: O čem mi Flexi Day posílá e-maily?
    expectedArticles: [notifications]
    mustMention: [žádosti o schválení, rozhodnutí, zrušení, komentáře]
  - question: Dají se vypnout oznámení v aplikaci?
    expectedArticles: [notifications]
    mustMention: [oznámení v aplikaci vypnout nejdou, E-mailová oznámení vypnou jen e-maily]
  - question: Jak smažu všechna oznámení najednou?
    expectedArticles: [notifications]
    mustMention: [Smazat vše, Označit vše jako přečtené]
---

Flexi Day ti dává vědět o věcech, které čekají na tebe nebo které se tě týkají, oznámením pod
zvonečkem v horní liště. Některá oznámení přijdou i e-mailem a každé dorazí do aplikace pro iPhone,
pokud v ní oznámení povolíš.

## Zvoneček

Tečka na zvonečku znamená nepřečtená oznámení. Otevři ho a uvidíš posledních dvanáct, nejnovější
nahoře.

- Klikni na oznámení a otevře se to, čeho se týká. Žádost se otevře v okně s detailem, přímo na
  stránce, kde jsi.
- „{{ui:notifications.markAllRead}}“ tečku smaže. „{{ui:notifications.clearAll}}“ odstraní všechna
  oznámení a křížek u jednoho odstraní jen to jedno.

## O čem dostaneš oznámení

| Oznámení                                                     | Kdo ho dostane                                                | I e-mailem |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ---------- |
| Někdo žádá o volno                                           | Schvalovatelé a manažer skupiny                               | Ano        |
| Tvoje žádost byla schválena nebo zamítnuta                   | Ty                                                            | Ano        |
| Někdo jiný zrušil tvoji žádost nebo schválené volno          | Ty                                                            | Ano        |
| Zrušil jsi schválené volno                                   | Schvalovatelé a manažer skupiny                               | Ano        |
| Komentář k žádosti                                           | Žadatel, nebo schvalovatelé, když píše žadatel                | Ano        |
| Správce za tebe zadal žádost o volno nebo ji změnil          | Ty                                                            | Ne         |
| Tvoje směna se automaticky uzavřela                          | Ty                                                            | Ne         |
| Export je připravený                                         | Ten, kdo o něj požádal                                        | Ne         |
| Někdo smazal svůj účet                                       | Správci jeho organizace a ten, kdo převezme jeho skupiny      | Ne         |
| Organizace zapnula adresář lidí, Asistenta nebo AI připojení | Všichni v organizaci, pokud se vlastník rozhodl jim dát vědět | Ne         |

Zamítnutá žádost, kterou někdo později zruší, už nic dalšího nepošle. Skupinové události a narozeniny
oznámení nikdy neposílají.

## Vypnutí e-mailů k žádostem

Otevři {{ui:nav.settings}} a vypni „{{ui:settings.emailNotifications}}“. Tím přestanou chodit
e-maily k žádostem: žádosti o schválení, rozhodnutí, zrušení a komentáře. Stejná oznámení se dál
ukážou pod zvonečkem a v iPhonu; oznámení v aplikaci vypnout nejdou. Nastavení patří k tvému účtu,
takže platí ve všech organizacích.

Některé e-maily chodí vždy, ať je nastavení jakékoli:

- potvrzení e-mailové adresy, obnovení hesla a kódy dvoufázového ověření;
- pozvánky do skupiny nebo do adresáře lidí;
- upozornění na fakturační e-mail organizace, že placený tarif končí.

## V iPhonu

Aplikace pro iPhone ukazuje stejná oznámení jako push notifikace, jakmile je povolíš. E-mailové
nastavení na ně nemá vliv; vypneš je v nastavení samotného iPhonu. Oznámení o automaticky uzavřené
směně přijde potichu, bez zvuku. Viz [Flexi Day v iPhonu](help:iphone-app).

## Když e-mail nepřijde

Viz [E-maily od Flexi Day nechodí](help:email-not-arriving).
