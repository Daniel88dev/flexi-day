---
id: assistant-weekly-limit
translatedFrom: "d5bab59baec0"
title: Týdenní limit a využití
summary: Jak se využití Asistenta počítá do Týdenního limitu tvé organizace a co se stane, když se limit blíží nebo je vyčerpaný.
keywords:
  [
    týdenní limit,
    využití,
    limit vyčerpán,
    pozastaveno,
    obnovení,
    zobrazit využití,
    není k dispozici,
    asistent,
    cena,
  ]
goldenQuestions:
  - question: Proč nám Asistent tento týden přestal odpovídat?
    expectedArticles: [assistant-weekly-limit]
    mustMention: [Týdenní limit, obnoví se v pondělí]
  - question: Asistent píše, že není k dispozici. Vyčerpali jsme limit?
    expectedArticles: [assistant-weekly-limit]
    mustMention: [neodpovídá poskytovatel AI, nejde o limit organizace]
---

Využití je to, kolik organizaci stojí odpovědi Asistenta: ceníková cena poskytovatele AI za každý
krok odpovědi, včetně odpovědí, které se ještě píšou. Každá organizace má na využití Týdenní limit,
společný pro všechny její členy. Obnoví se každé pondělí v 00:00 UTC, zobrazeno ve tvém časovém
pásmu.

## Když se limit blíží

Od 80 % limitu ukazuje pruh pod polem pro zprávu, kolik je vyčerpáno a kdy se limit obnoví. Členové
vidí procenta, vlastník a správci organizace i částky.

## Když je limit vyčerpaný

Asistent se pro celou organizaci pozastaví do obnovení a pole pro zprávu řekne, do kdy. Tvoje chaty
zůstanou čitelné. Odpověď, která na limit narazí v polovině, si nechá, co už napsala, a skončí
řádkem, že se zastavila. Vlastník a správci uvidí „{{ui:assistant.limit.seeUsage}}“, které otevře
stránku Využití AI s využitím organizace po jednotlivých lidech.

## Asistent není k dispozici

„{{ui:assistant.unavailable}}“ znamená, že neodpovídá samotný poskytovatel AI. Nejde o limit tvé
organizace a nic se do něj nepočítá.
