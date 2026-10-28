// NOTE: The Czech Terms of Service. Keep them in step with app/(legal)/terms/page.tsx;
// a test fails when their sections drift apart. Have them reviewed by a qualified
// lawyer before publication.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Obchodní podmínky — flexiday",
  description: "Podmínky, které upravují používání služby flexiday pro správu volna.",
};

export default function CsTermsPage() {
  return (
    <LegalShell
      title="Obchodní podmínky"
      updated={LEGAL.cs.updated}
      locale="cs"
      translatedPage="terms"
      intro="Tyto podmínky tvoří smlouvu mezi vámi a flexiday, když Službu používáte. Přečtěte si je prosím pozorně."
    >
      <h2>1. Smlouva</h2>
      <p>
        Tyto obchodní podmínky (dále jen &bdquo;Podmínky&ldquo;) upravují přístup ke službě{" "}
        {LEGAL.product} (dále jen &bdquo;Služba&ldquo;) a její používání. Službu provozuje{" "}
        <strong>{LEGAL.entity}</strong> (&bdquo;my&ldquo;), IČO {LEGAL.ico}, se sídlem{" "}
        {LEGAL.cs.address}. Založením účtu nebo používáním Služby s Podmínkami souhlasíte. Pokud
        Službu používáte jménem organizace, potvrzujete, že jste oprávněni Podmínky jejím jménem
        přijmout.
      </p>

      <h2>2. Definice</h2>
      <ul>
        <li>
          <strong>Účet</strong> — přihlašovací údaje a profil, které si pro používání Služby
          vytvoříte.
        </li>
        <li>
          <strong>Tým</strong> — skupina uživatelů a obsahu uspořádaná ve sdíleném pracovním
          prostoru.
        </li>
        <li>
          <strong>Obsah</strong> — veškerá data, která zadáte, včetně žádostí o volno a poznámek.
        </li>
        <li>
          <strong>Organizace</strong> — pracovní prostor, který zákazník ve Službě vede pro lidi,
          kteří pro něj pracují, včetně jeho skupin. Jedná za ni její vlastník.
        </li>
        <li>
          <strong>Údaje organizace</strong> — osobní údaje, které Organizace ve Službě vede o
          lidech, kteří v ní pracují, například pracovní poměry, nepřítomnosti, docházku a nároky.
        </li>
        <li>
          <strong>Údaje účtu</strong> — údaje, které vedeme o samotném držiteli Účtu, například jeho
          přihlášení, nastavení a oznámení. Oba druhy uvádějí naše{" "}
          <a href="/cs/privacy/">Zásady ochrany osobních údajů</a>.
        </li>
      </ul>

      <h2>3. Služba</h2>
      <p>
        {LEGAL.product} je nástroj, ve kterém týmy žádají o volno, schvalují ho a sledují. Funkce
        můžeme postupně přidávat, měnit nebo odebírat, abychom Službu zlepšovali.
      </p>

      <h2>4. Způsobilost a účty</h2>
      <ul>
        <li>Službu smíte používat, jen pokud je vám alespoň 16 let.</li>
        <li>Zavazujete se uvádět přesné údaje a udržovat je aktuální.</li>
        <li>
          Odpovídáte za utajení svých přihlašovacích údajů a za veškerou činnost ve svém Účtu. O
          každém neoprávněném použití nám dejte neprodleně vědět.
        </li>
      </ul>

      <h2>5. Přípustné užití</h2>
      <p>Zavazujete se, že nebudete:</p>
      <ul>
        <li>používat Službu k protiprávnímu účelu nebo v rozporu s těmito Podmínkami;</li>
        <li>pokoušet se o neoprávněný přístup ke Službě nebo k datům jiných uživatelů;</li>
        <li>
          zasahovat do Služby, narušovat ji, přetěžovat ji nebo provádět její zpětnou analýzu;
        </li>
        <li>vytěžovat, přeprodávat nebo zneužívat Službu či její data.</li>
      </ul>

      <h2>6. Váš obsah</h2>
      <p>
        Všechna práva ke svému Obsahu si ponecháváte. Udělujete nám omezenou licenci Obsah ukládat,
        zpracovávat a zobrazovat výhradně za účelem poskytování a zlepšování Služby. Odpovídáte za
        Obsah, který zadáte, a za to, že máte právo sdílet se Službou osobní údaje jiných lidí
        (například kolegů).
      </p>

      <h2>7. Docházka a poloha zaměstnanců</h2>
      <p>
        Docházku, a zejména záznam polohy, zapínáte vy. Je vaší odpovědností informovat lidi ve své
        organizaci, že se při příchodu a odchodu zaznamenává jejich poloha, získat před zapnutím
        souhlas nebo projednání, které vyžaduje místní pracovní právo a právo na ochranu osobních
        údajů, a udržovat je po celou dobu, kdy je nastavení zapnuté. {LEGAL.product} o tomto
        souhlasu nic nezaznamenává a nemůže ho ověřit. Poskytujeme nastavení, upozornění, které vaši
        zaměstnanci vidí v aplikaci, a lhůty uchování popsané v našich{" "}
        <a href="/cs/privacy/">Zásadách ochrany osobních údajů</a>.
      </p>

      <h2>8. Ochrana osobních údajů</h2>
      <p>
        U Údajů organizace je správcem organizace a my jsme jejím zpracovatelem. Naše{" "}
        <a href="/cs/dpa/">Smlouva o zpracování osobních údajů</a> je součástí těchto Podmínek a
        platí pro každou organizaci u každého tarifu. Založením Organizace nebo přijetím těchto
        Podmínek jejím jménem přijímáte za ni i Smlouvu o zpracování osobních údajů. Pokud se
        Smlouva o zpracování osobních údajů a tyto Podmínky ve zpracování Údajů organizace liší, má
        přednost Smlouva o zpracování osobních údajů.
      </p>
      <p>
        U Údajů účtu jsme správcem my, jak popisují naše{" "}
        <a href="/cs/privacy/">Zásady ochrany osobních údajů</a>. Pokud Organizace zapne adresář
        lidí, přijímá její vlastník také <a href="/directory-agreement/">smlouvu k adresáři lidí</a>{" "}
        (v angličtině).
      </p>

      <h2>9. Dostupnost</h2>
      <p>
        Službu poskytujeme průběžně a s vynaložením přiměřeného úsilí. Nezaručujeme, že bude Služba
        fungovat bez přerušení nebo bez chyb, a v případě potřeby můžeme provádět údržbu nebo
        pozastavit některé funkce.
      </p>

      <h2>10. Tarify, poplatky a platby</h2>
      <p>
        Služba nabízí bezplatný tarif a placená předplatná (nyní Pro a Enterprise a volitelné
        skupiny navíc). Limity a ceny jednotlivých tarifů jsou uvedeny na stránce s ceníkem.
        Zobrazené ceny jsou bez DPH; příslušná daň se vypočte a zobrazí v pokladně před zaplacením.
      </p>
      <p>
        Placené tarify prodává náš autorizovaný prodejce, <strong>Paddle.com Market Ltd</strong>{" "}
        (&bdquo;Paddle&ldquo;), jako Merchant of Record. Paddle je prodávajícím u vašeho nákupu:
        zpracuje platbu, vypočte a odvede příslušné daně a vystaví faktury a účtenky. Na samotnou
        platební transakci se vztahují{" "}
        <a href="https://www.paddle.com/legal/checkout-buyer-terms">podmínky pro kupující</a>{" "}
        společnosti Paddle.
      </p>
      <ul>
        <li>
          <strong>Obnovení.</strong> Předplatné se na konci každého měsíčního nebo ročního období
          automaticky obnovuje, dokud ho nezrušíte.
        </li>
        <li>
          <strong>Zrušení.</strong> Předplatné můžete kdykoli zrušit na stránce s fakturací přes
          &bdquo;Spravovat platební metodu&ldquo;, která otevře zákaznický portál Paddle. Tarif
          zůstane aktivní do konce zaplaceného období a poté se neobnoví.
        </li>
        <li>
          <strong>Neúspěšné platby a přechod na nižší tarif.</strong> Pokud platba za obnovení selže
          nebo přejdete na nižší tarif, vaše dosavadní limity fungují ještě 14 dní. Poté se skupiny,
          které limity tarifu překračují, přepnou jen pro čtení — zůstanou viditelné a nic se
          nesmaže — dokud se do limitů tarifu nevrátíte.
        </li>
        <li>
          <strong>Vrácení peněz.</strong> Žádosti o vrácení peněz vyřizuje Paddle podle svých
          pravidel pro vracení plateb a vašich zákonných práv. Protože Služba je digitální služba,
          jejíž poskytování začíná okamžitě, souhlasíte se zahájením plnění hned; zákonná práva
          spotřebitele na odstoupení tím nejsou dotčena tam, kde platí.
        </li>
        <li>
          <strong>Změny cen.</strong> Pokud ceny změníme, nové ceny platí od vašeho dalšího
          zúčtovacího období a předem vás o tom v přiměřené lhůtě informujeme.
        </li>
      </ul>

      <h2>11. Duševní vlastnictví</h2>
      <p>
        Služba, včetně softwaru, designu a ochranných známek, patří {LEGAL.entity} a je chráněna
        zákonem. Tyto Podmínky vám nedávají ke Službě žádná práva kromě práva používat ji v souladu
        s nimi.
      </p>

      <h2>12. Ukončení</h2>
      <p>
        Službu můžete kdykoli přestat používat a svůj Účet smazat. Smazáním Účtu nesmažete Údaje
        organizace, které o vás vedou organizace, ve kterých pracujete; co se s nimi stane,
        rozhoduje každá organizace, jak popisují Zásady ochrany osobních údajů. Smazáním Organizace
        končí zpracování jejích údajů, jak popisuje Smlouva o zpracování osobních údajů. Pokud tyto
        Podmínky porušíte nebo pokud Službu ukončíme, můžeme váš přístup pozastavit nebo ukončit. Po
        ukončení zaniká vaše právo Službu používat; ustanovení, která mají ze své povahy trvat
        (např. duševní vlastnictví, vyloučení záruk a omezení odpovědnosti), zůstávají v platnosti.
      </p>

      <h2>13. Vyloučení záruk</h2>
      <p>
        V rozsahu, který zákon dovoluje, poskytujeme Službu &bdquo;tak, jak je&ldquo; a &bdquo;tak,
        jak je dostupná&ldquo;, bez jakýchkoli výslovných nebo předpokládaných záruk. Nezaručujeme,
        že Služba splní vaše požadavky nebo bude bez chyb.
      </p>

      <h2>14. Omezení odpovědnosti</h2>
      <p>
        V rozsahu, který zákon dovoluje, neodpovídáme za nepřímé, nahodilé ani následné škody ani za
        ztrátu dat, zisku nebo obchodu vzniklou používáním Služby. Nic v těchto Podmínkách neomezuje
        odpovědnost, kterou podle platného práva omezit nelze, včetně vašich zákonných práv
        spotřebitele.
      </p>

      <h2>15. Změny těchto Podmínek</h2>
      <p>
        Tyto Podmínky můžeme čas od času aktualizovat. Změníme pak datum poslední aktualizace výše a
        u podstatných změn vás upozorníme i jinak. Pokud Službu používáte i poté, co změny nabudou
        účinnosti, s aktualizovanými Podmínkami souhlasíte.
      </p>

      <h2>16. Rozhodné právo</h2>
      <p>
        Tyto Podmínky se řídí právem České republiky. K řešení sporů jsou příslušné soudy České
        republiky, aniž jsou dotčena kogentní práva na ochranu spotřebitele, která máte ve státě
        svého bydliště.
      </p>

      <h2>17. Kontakt</h2>
      <p>
        {LEGAL.entity}
        <br />
        {LEGAL.cs.address}
        <br />
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalShell>
  );
}
