---
id: directory-profiles
translatedFrom: "83b0ea61ae60"
title: Profily v adresáři, fotky, oddělení a lokality
summary: Co obsahuje každá sekce profilu v adresáři, jak upravit svůj nebo cizí profil a fotku a jak fungují oddělení a lokality.
keywords:
  [
    profil,
    upravit profil,
    pracovní pozice,
    oddělení,
    lokalita,
    nadřízený,
    podřízenost,
    pracovní telefon,
    pracovní e-mail,
    nouzový kontakt,
    adresa bydliště,
    datum narození,
    profilová fotka,
    osobní číslo,
    typ smlouvy,
    historie profilu,
  ]
goldenQuestions:
  - question: Jak si ve Flexi Day doplním nouzový kontakt?
    expectedArticles: [directory-profiles]
    mustMention: [Upravit profil, sekce Kontakt]
  - question: Kde někomu změním oddělení?
    expectedArticles: [directory-profiles]
    mustMention: [sekce Karta, Oddělení a lokality v Nastavení adresáře]
  - question: Je profilová fotka stejná jako obrázek mého účtu?
    expectedArticles: [directory-profiles]
    mustMention: [jen na stránkách adresáře, ostatní obrazovky ukazují obrázek účtu]
---

Každý v [adresáři lidí](help:people-directory) má profil rozdělený do šesti sekcí. Co v každé vidíš a
můžeš měnit, určuje tabulka oprávnění tvé organizace.

## Sekce

| Sekce                                          | Obsahuje                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| {{ui:directory.history.sections.CARD}}         | Jméno, pracovní pozici, oddělení, lokalitu a komu člověk podléhá                               |
| {{ui:directory.history.sections.PHOTO}}        | Profilovou fotku                                                                               |
| {{ui:directory.history.sections.WORK_CONTACT}} | Pracovní e-mail a pracovní telefon                                                             |
| {{ui:directory.history.sections.JOB}}          | Úřední jméno, osobní číslo, datum nástupu a odchodu, konec zkušební doby, typ smlouvy a úvazek |
| {{ui:directory.history.sections.CONTACT}}      | Soukromý telefon a e-mail, dva nouzové kontakty                                                |
| {{ui:directory.history.sections.PERSONAL}}     | Adresu bydliště a datum narození                                                               |

{{ui:directory.history.sections.CONTACT}} a {{ui:directory.history.sections.PERSONAL}} jsou citlivé
sekce: jsou šifrované a zůstávají skryté, dokud nestiskneš „{{ui:directory.profile.show}}“. Viz
[Záznam o čtení](help:directory-read-log).

Zkušební doba, typ smlouvy, úvazek a sekce {{ui:directory.history.sections.PERSONAL}} platí jen pro
zaměstnance, ne pro [externí spolupracovníky](help:external-workers).

## Úprava profilu

1. Otevři člověka v části {{ui:nav.directory}}, nebo svůj vlastní profil.
2. Stiskni „{{ui:directory.profile.edit}}“.
3. Změň sekce označené „{{ui:directory.edit.editable}}“ a stiskni „{{ui:directory.edit.save}}“.

Sekce, které smíš jen číst, jsou šedé. Pár pravidel:

- Jméno člověka s účtem pochází z jeho účtu; upravit jde jen u člověka bez účtu.
- Pracovní e-mail je oddělený od přihlašovacího a kolegové vidí ten pracovní.
- Telefon je jedno číslo v mezinárodním tvaru, bez linky.
- Údaj, komu člověk podléhá, je jen informativní a nedává žádná práva.
- Datum odchodu je také jen informativní: nic neukončí.
- Osobní číslo musí být jedinečné mezi současnými zaměstnanci.
- Nouzový kontakt potřebuje jméno i telefon.

„{{ui:directory.profile.history}}“ ukazuje, kdo a kdy změnil která pole, nikdy hodnoty. Otevřít ji
může vlastník, správci organizace a HR.

## Profilová fotka

Na stránce úprav stiskni „{{ui:directory.edit.photo.upload}}“ a vyber obrázek PNG, JPEG, WebP nebo
HEIC o velikosti nejvýš 10 MB. Uloží se hned. Fotka se ukazuje jen na stránkách adresáře; kalendář,
reporty a docházka dál ukazují obrázek účtu. Údaje o poloze se odstraní a fotky se nikdy nepoužívají
k rozpoznávání obličejů. Ve výchozím stavu ji můžeš měnit ty, HR a správci organizace.

## Oddělení a lokality

Každá organizace má vlastní seznamy v části „{{ui:directory.settings.lists}}“ v
{{ui:directory.settings.tab}}. Člověk má nejvýš jedno oddělení a jednu lokalitu. Nejsou svázané se
skupinami a země lokality jen určuje, kde začínají telefonní čísla jejích lidí.

Položku, kterou někdo má, smazat nejde; archivuj ji. Archivovaná položka zmizí z nabídek a lidé, kteří
ji mají, si ji nechají s označením „(archivováno)“. Seznamy ve výchozím stavu spravuje vlastník, HR a
správci organizace.

## Na vypršelém tarifu

Bez tarifu Enterprise zůstane adresář čitelný a hodnoty jde mazat, ale ne nastavovat.
