---
id: people-directory
translatedFrom: "c6c1978d548f"
title: Zapnutí adresáře lidí a kdo co vidí
summary: Co je adresář lidí na tarifu Enterprise, jak ho vlastník zapne nebo vypne a jak tabulka oprávnění a role HR a Vedení určují, kdo čte a mění kterou část profilu.
keywords:
  [
    adresář,
    adresář lidí,
    adresář zaměstnanců,
    hr,
    personalistika,
    profily zaměstnanců,
    seznam zaměstnanců,
    tabulka oprávnění,
    kdo co vidí,
    vedení,
    role v adresáři,
    smlouva k adresáři,
    vypnout adresář,
    smazat data adresáře,
  ]
goldenQuestions:
  - question: Jak si nastavím adresář zaměstnanců s personálními údaji?
    expectedArticles: [people-directory]
    mustMention:
      [Enterprise, zapnout ho může jen vlastník, karta Adresář lidí na stránce Organizace]
  - question: Uvidí kolegové v adresáři moji adresu bydliště?
    expectedArticles: [people-directory, directory-profiles]
    mustMention: [sloupec Kolega, Kontakt a Osobní údaje mají ve výchozím stavu Nic]
  - question: Jak dám kolegyni z personálního přístup ke všem profilům?
    expectedArticles: [people-directory]
    mustMention: [Role v adresáři, HR, přiděluje je jen vlastník]
---

Adresář lidí vede profil každého, s kým tvoje organizace spolupracuje, včetně lidí bez účtu ve Flexi
Day a externích spolupracovníků. Je součástí tarifu Enterprise, je vypnutý, dokud ho vlastník
nezapne, a pak ho každý v organizaci najde na stránce {{ui:nav.directory}}.

## Zapnutí

1. Vlastník otevře stránku {{ui:nav.organization}} a najde kartu „{{ui:organization.directory.title}}“.
2. Stiskne „{{ui:organization.directory.turnOn}}“, přečte si smlouvu k adresáři a přijme ji za
   organizaci.
3. Nechá zaškrtnuté „{{ui:organization.directory.dialog.tellMembers}}“, aby každý s účtem dostal
   upozornění, ať si zkontroluje svůj profil.

Každý zaměstnaný v organizaci se objeví pod jménem ze svého účtu. Od té chvíle už odebrání ze skupiny
pracovní poměr neukončí; viz [Pracovní poměr a odchod](help:employment-spells).

Seznam úkolů na stránce adresáře pak navrhne první kroky: přidat oddělení, přidat lokality, určit HR
a doplnit pracovní pozice.

## Stránka adresáře

„{{ui:directory.people}}“ ukazuje všechny, které vidíš, jako karty nebo tabulku. Hledej podle jména
nebo pracovní pozice a filtruj podle oddělení nebo lokality. Vlastník, správci organizace a HR mají
navíc „{{ui:directory.former}}“, tedy lidi, kteří odešli, a „{{ui:directory.settings.tab}}“.
Kliknutím na kohokoli otevřeš jeho profil; viz [Profily v adresáři](help:directory-profiles).

## Kdo co vidí: tabulka oprávnění

Profil má šest sekcí: {{ui:directory.history.sections.CARD}},
{{ui:directory.history.sections.PHOTO}}, {{ui:directory.history.sections.WORK_CONTACT}},
{{ui:directory.history.sections.JOB}}, {{ui:directory.history.sections.CONTACT}} a
{{ui:directory.history.sections.PERSONAL}}. U každé sekce „{{ui:directory.settings.permissions}}“ v
části {{ui:directory.settings.tab}} určuje, co smí která skupina lidí:
{{ui:directory.settings.values.NONE}}, {{ui:directory.settings.values.READ}} nebo
{{ui:directory.settings.values.WRITE}}. Skupiny lidí jsou sloupce tabulky:
{{ui:directory.history.audiences.OWNER}}, {{ui:directory.history.audiences.SELF}},
{{ui:directory.history.audiences.COLLEAGUE}}, {{ui:directory.history.audiences.EXTERNAL_WORKER}},
{{ui:directory.history.audiences.GROUP_ADMIN}}, {{ui:directory.history.audiences.HR}},
{{ui:directory.history.audiences.LEADERSHIP}} a
{{ui:directory.history.audiences.ORGANIZATION_ADMIN}}. Kdo patří do více sloupců, dostane nejširší
oprávnění.

Ve výchozím stavu:

- **{{ui:directory.history.audiences.COLLEAGUE}}:** čte sekce {{ui:directory.history.sections.CARD}},
  {{ui:directory.history.sections.PHOTO}} a {{ui:directory.history.sections.WORK_CONTACT}} a nic ze
  sekcí {{ui:directory.history.sections.JOB}}, {{ui:directory.history.sections.CONTACT}} ani
  {{ui:directory.history.sections.PERSONAL}}.
- **{{ui:directory.history.audiences.SELF}}:** čteš celý svůj profil a upravuješ svoje sekce
  {{ui:directory.history.sections.PHOTO}}, {{ui:directory.history.sections.CONTACT}} a
  {{ui:directory.history.sections.PERSONAL}}.
- **{{ui:directory.history.audiences.GROUP_ADMIN}}** a
  **{{ui:directory.history.audiences.LEADERSHIP}}:** čtou sekce {{ui:directory.history.sections.CARD}},
  {{ui:directory.history.sections.PHOTO}}, {{ui:directory.history.sections.WORK_CONTACT}} a
  {{ui:directory.history.sections.JOB}}; správce skupiny u členů své skupiny, Vedení u všech.
- **{{ui:directory.history.audiences.HR}}** a
  **{{ui:directory.history.audiences.ORGANIZATION_ADMIN}}:** čtou a upravují všechny sekce u všech.

Tabulka obsahuje i pět úkonů: přidat osobu bez účtu, poslat pozvánku do adresáře, změnit typ
spolupráce, ukončit pracovní vztah a spravovat oddělení a pracoviště. Ve výchozím stavu je smí
vlastník, HR a správci organizace.

Tabulku mění jen vlastník. Vlastník vždy upravuje všechno a ty vždy čteš svůj vlastní profil. Kolegové
a externí spolupracovníci můžou dostat nejvýš {{ui:directory.settings.values.READ}}. Každá změna se
uchovává v historii oprávnění.

## HR a Vedení

„{{ui:directory.settings.roles}}“ se přidělují lidem, ne skupinám. Přiděluje je vlastník v části
{{ui:directory.settings.tab}}. Vyžadují účet a trvající pracovní poměr, končí s jeho koncem a role
správce organizace žádnou z nich nepřináší.

## Vypnutí

Vlastník na téže kartě stiskne „{{ui:organization.directory.turnOff}}“. Nikomu pracovní poměr
neskončí, adresář se všem zavře a jeho data zůstanou. Uchovávání dat a záznam o čtení dál běží.
„{{ui:organization.directory.deleteAll}}“ pak natrvalo odstraní profily, fotky, seznamy, role a lidi
bez účtu; je k tomu potřeba napsat název organizace.

Když vyprší tarif, adresář zůstane čitelný a data jde mazat, ale ne přidávat.
