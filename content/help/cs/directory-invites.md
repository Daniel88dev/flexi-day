---
id: directory-invites
translatedFrom: "a88b57c9529a"
title: Přidání lidí bez účtu a pozvánky do adresáře
summary: Jak přidat do adresáře někoho, kdo nemá účet ve Flexi Day, a jak si díky pozvánce do adresáře převezme profil jako svůj.
keywords:
  [
    přidat osobu,
    přidat zaměstnance,
    bez účtu,
    nemá účet,
    pozvánka do adresáře,
    pozvat do flexi day,
    převzít profil,
    nástup,
    nový zaměstnanec,
    poslat pozvánku znovu,
    pozvánka odeslána,
  ]
goldenQuestions:
  - question: Můžu přidat zaměstnance do adresáře dřív, než bude mít účet?
    expectedArticles: [directory-invites]
    mustMention: [Přidat osobu, Bez účtu, Enterprise]
  - question: Jak se člověk, kterého jsem přidal, dostane ke svému profilu?
    expectedArticles: [directory-invites]
    mustMention: [Poslat pozvánku, e-mail v profilu, platí 14 dní]
  - question: Nový kolega se zaregistroval se stejným e-mailem, ale k profilu se nepřipojil. Proč?
    expectedArticles: [directory-invites]
    mustMention: [profil připojí jen pozvánka, samotná registrace ne]
---

Adresář může obsahovat lidi, kteří ještě nemají účet ve Flexi Day, třeba nového kolegu před prvním
dnem nebo někoho, kdo si nikdy volno nezadává. Pozvánka do adresáře jim pak umožní převzít profil
vlastním účtem.

## Přidání osoby

1. Otevři stránku {{ui:nav.directory}} a stiskni „{{ui:directory.addPerson.action}}“.
2. Zadej jméno a vyber typ pracovníka: „{{ui:directory.addPerson.employee}}“ nebo
   „{{ui:directory.addPerson.external}}“.
3. Pokud chceš, vyplň kartu: pracovní pozici, oddělení, lokalitu a komu podléhá.
4. Pokud ho chceš pozvat, přidej e-mail. Nesmí patřit nikomu jinému v organizaci.
5. Stiskni „{{ui:directory.addPerson.confirm}}“. Otevře se jeho profil a zbytek doplníš tam.

Ve výchozím stavu přidávají lidi vlastník, HR a správci organizace, na tarifu Enterprise. Člověk je
pro vlastníka, správce organizace a HR označený „{{ui:directory.markers.NO_ACCOUNT}}“.

Dokud nemá účet, není v žádné skupině: nikdo mu nezadává volno, nenastavuje nárok ani nezadává
docházku, nedostává upozornění a nezapočítává se do limitů členů tarifu.

## Odeslání pozvánky do adresáře

1. Otevři jeho profil. Pokud ještě nemá e-mail, doplň ho přes „{{ui:directory.invite.addEmail}}“.
2. Stiskni „{{ui:directory.invite.action}}“.
3. Případně vyber skupinu v „{{ui:directory.invite.group}}“; přidá se do ní, až pozvánku přijme.
4. Stiskni „{{ui:directory.invite.confirm}}“.

E-mail uvádí název organizace a obsahuje odkaz, který platí 14 dní. Dokud je pozvánka otevřená,
profil ukazuje „{{ui:directory.markers.INVITE_SENT}}“. „{{ui:directory.invite.again}}“ dřívější
pozvánku stáhne a stejně tak změna e-mailu v profilu.

## Převzetí profilu

Přijetím pozvánky si člověk vytvoří účet nebo se přihlásí a profil se stane jeho. Od té chvíle se
jméno a e-mail profilu řídí jeho účtem.

- Profil připojí jen pozvánka. Kdo se zaregistruje se stejným e-mailem bez pozvánky, připojený není,
  a připojit se k organizaci s tímto e-mailem jinou cestou nejde, dokud profil někdo nepřevezme nebo
  se e-mail nezmění.
- Profil převezme i běžná pozvánka do skupiny poslaná na stejnou adresu.
- Pokud už člověk v organizaci pracovní poměr má, převzetí se odmítne a duplicitu vyřeší správce.
- Pozvánka přestane fungovat, jakmile pracovní poměr člověka skončí nebo profil dostane účet.

Vypnutí adresáře stáhne otevřené pozvánky, které nejmenují žádnou skupinu; pozvánky do skupiny
zůstávají platné. Jak pozvat lidi rovnou do skupiny, popisuje [Pozvání lidí](help:invite-people).
