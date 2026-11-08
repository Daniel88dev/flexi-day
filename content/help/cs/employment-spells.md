---
id: employment-spells
translatedFrom: "8b86f7ad7ad6"
title: Ukončení pracovního poměru a návrat bývalého kolegy
summary: Jak pracovní poměr začíná a končí s adresářem i bez něj, co změní Ukončit pracovní poměr, kde jsou lidé, kteří odešli, a jak nové působení vracejícího se člověka převezme údaje ze starého.
keywords:
  [
    ukončit pracovní poměr,
    odchod zaměstnance,
    offboarding,
    někdo odešel,
    výpověď,
    poslední den,
    bývalí,
    bývalí zaměstnanci,
    znovu přijmout,
    opětovný nástup,
    vracející se zaměstnanec,
    působení,
    kopírovat z předchozího působení,
    bez skupiny,
  ]
goldenQuestions:
  - question: Zaměstnanec odchází. Jak ho ve Flexi Day odhlásím?
    expectedArticles: [employment-spells]
    mustMention: [Ukončit pracovní poměr, Poslední den, budoucí záznamy se zruší]
  - question: Bývalá zaměstnankyně se vrátila. Můžu použít její starý profil?
    expectedArticles: [employment-spells]
    mustMention:
      [
        nové působení začíná prázdné,
        Kopírovat z předchozího působení,
        Kontakt Osobní údaje a Profilová fotka,
      ]
  - question: Odebral jsem někoho z poslední skupiny, ale v adresáři pořád je. Proč?
    expectedArticles: [employment-spells]
    mustMention: [odebrání ze skupiny už pracovní poměr neukončí, Ukončit pracovní poměr]
---

Pracovní poměr je doba, po kterou člověk pracuje pro jednu organizaci. Začne, když se poprvé přidá do
některé z jejích skupin nebo když ho někdo přidá do adresáře, a patří k němu docházka i profil v
adresáři. Jeden úsek od začátku do konce se nazývá působení.

## Jak pracovní poměr končí

- **Bez adresáře:** skončí sám, když člověk ztratí poslední vazbu na organizaci, třeba když ho někdo
  odebere z poslední skupiny. Vlastník a správci organizace ho mohou ukončit i na kartě
  „{{ui:organization.people.title}}“ na stránce {{ui:nav.organization}}.
- **Se zapnutým adresářem:** odebrání ze skupiny pracovní poměr nikdy neukončí. Člověk zůstane
  zaměstnaný, bez skupiny, dokud ho někdo ručně neukončí. Vlastník a správci organizace takové lidi
  najdou filtrem „{{ui:directory.noGroupFilter}}“ na stránce adresáře.

## Ukončení pracovního poměru

1. Otevři profil člověka v části {{ui:nav.directory}}.
2. Stiskni „{{ui:directory.end.action}}“ („{{ui:directory.end.actionExternal}}“ u externího
   spolupracovníka).
3. Vyber „{{ui:directory.end.dateLabel}}“: dnešek nebo dřívější den, ne však před jeho nástupem.
   Navrhne se datum odchodu z profilu.
4. Přečti si, co se změní, a potvrď.

Ukončení najednou:

- odebere člověka ze všech skupin organizace a z míst schvalovatele;
- zruší jeho čekající žádosti a budoucí záznamy; minulé záznamy zůstanou;
- ukončí jeho přístup správce organizace a roli HR nebo Vedení;
- smaže údaj „komu podléhá“ u všech, kdo podléhali jemu;
- odstraní sekce, jejichž uchovávání je nastavené tak, že končí s pracovním poměrem.

Pracovní poměr může ve výchozím stavu ukončit vlastník, HR a správci organizace. Pracovní poměr
vlastníka ukončit nejde a kdo vede skupinu, potřebuje pro ni nejdřív jiného manažera. Žádný tarif
není potřeba.

## Lidé, kteří odešli

Záložka „{{ui:directory.former}}“ ukazuje ukončená působení, od nejnovějšího, vlastníkovi, správcům
organizace a HR. Jejich profily pro ně zůstávají čitelné a co se uchová, určují doby uchovávání
organizace.

## Když se někdo vrátí

Člověk, který se vrátí, začíná nové působení s prázdným profilem, označeným
„{{ui:directory.markers.REJOINED}}“ pro vlastníka, správce organizace a HR. Dřívější působení zůstane
v „{{ui:directory.former}}“.

Na novém profilu nabídne pruh „{{ui:directory.copySpell.action}}“. Zkopíruje Kontakt, Osobní údaje a
Profilovou fotku z předchozího působení, pokud je uchovávání ponechalo. Karta, Pracovní kontakt a
Pracovní údaje se nepřenášejí nikdy a sekce, kterou nové působení už má, se nikdy nepřepíše.
Kopírovat může vlastník, správci organizace a HR.
