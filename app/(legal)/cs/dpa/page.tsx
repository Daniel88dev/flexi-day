// NOTE: The Czech Data Processing Agreement. Keep it in step with
// app/(legal)/dpa/page.tsx; a test fails when their sections drift apart. Have it
// reviewed by a qualified lawyer before publication.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Smlouva o zpracování osobních údajů — flexiday",
  description:
    "Jak flexiday zpracovává údaje organizace jako zpracovatel podle článku 28 GDPR. Součást obchodních podmínek.",
};

export default function CsDpaPage() {
  return (
    <LegalShell
      title="Smlouva o zpracování osobních údajů"
      updated={LEGAL.cs.updated}
      locale="cs"
      intro="Tato smlouva stanoví, jak flexiday zpracovává osobní údaje pro organizaci. Je součástí obchodních podmínek."
      translatedPage="dpa"
    >
      <h2>1. Smluvní strany a rozsah</h2>
      <p>
        Tuto smlouvu o zpracování osobních údajů (dále jen &bdquo;Smlouva&ldquo;) uzavírá
        organizace, která používá {LEGAL.product} (dále jen &bdquo;Správce&ldquo;), jednající
        prostřednictvím svého vlastníka, a <strong>{LEGAL.entity}</strong>, se sídlem{" "}
        {LEGAL.cs.address}, IČO {LEGAL.ico} (dále jen &bdquo;Zpracovatel&ldquo;, &bdquo;my&ldquo;).
        Smlouva je součástí <a href="/cs/terms/">Obchodních podmínek</a> a platí pro každou
        organizaci u každého tarifu od okamžiku jejího založení. Vlastník ji přijímá jménem
        organizace tím, že přijme Obchodní podmínky.
      </p>
      <p>
        Smlouva se vztahuje na <strong>údaje organizace</strong>: osobní údaje, které Správce ve
        Službě vede o lidech, kteří u něj pracují. Nevztahuje se na údaje účtu, jako jsou přihlášení
        člověka, jeho nastavení, oznámení, propojení kalendářů, registrace push oznámení a
        narozeniny. Údajů účtu jsme správcem my a řídí se našimi{" "}
        <a href="/cs/privacy/">Zásadami ochrany osobních údajů</a>. Pokud Správce zapne adresář
        lidí, doplňuje tuto Smlouvu pro profilové údaje v adresáři{" "}
        <a href="/directory-agreement/">smlouva k adresáři lidí</a> (v angličtině).
      </p>

      <h2>2. Předmět, doba trvání, povaha a účel zpracování</h2>
      <ul>
        <li>
          <strong>Předmět a účel.</strong> Poskytování Služby Správci: evidence a schvalování
          nepřítomností, vedení nároků, evidence docházky, vedení záznamu změn, zobrazování toho
          všeho lidem, kterým to dovolují nastavení a role Správce, zasílání souvisejících oznámení
          a vytváření exportů.
        </li>
        <li>
          <strong>Povaha.</strong> Shromažďování, ukládání, uspořádání, vyhledávání, zobrazení,
          přenos, export a výmaz, automatizovanými prostředky.
        </li>
        <li>
          <strong>Doba trvání.</strong> Po dobu, kdy organizace ve Službě existuje, a do výmazu
          jejích údajů podle oddílu 12.
        </li>
      </ul>

      <h2>3. Dotčené osoby a údaje</h2>
      <p>
        <strong>Osoby:</strong> zaměstnanci Správce, spolupracovníci na základě jiných smluv a
        kdokoli další, koho Správce do organizace přidá, včetně vlastníka, správců, vedoucích skupin
        a schvalovatelů, a pokud je zapnutý adresář lidí, i kontaktní osoby pro případ nouze, které
        jeho lidé uvedou.
      </p>
      <p>
        <strong>Údaje:</strong> kopie jména a e-mailu každého člověka, kterou vede organizace;
        pracovní poměry, skupiny, role a pozvánky; žádosti o volno s daty, druhem, stavem a
        poznámkami; nároky; záznam změn; přílohy žádostí; časy docházky a, pokud to Správce zapne,
        poloha zaznamenaná při příchodu a odchodu; a pokud je zapnutý adresář lidí, jeho profilová
        pole.
      </p>
      <p>
        Nepřítomnost z důvodu nemoci a přílohy žádostí, jako je potvrzení od lékaře, mohou prozradit
        údaje o zdravotním stavu, tedy zvláštní kategorii podle článku 9 GDPR. Zda tyto funkce
        použije, rozhoduje Správce a odpovídá za to, že pro ně má právní základ.
      </p>

      <h2>4. Pokyny</h2>
      <p>
        Údaje organizace zpracováváme jen na základě doložených pokynů Správce, a to i pokud jde o
        předání mimo EHP, ledaže nám zpracování ukládá právo EU nebo České republiky; v takovém
        případě Správce předem informujeme, pokud to toto právo nezakazuje. Pokyny Správce jsou
        Obchodní podmínky, tato Smlouva a způsob, jakým Správce Službu používá a nastavuje. Ukončení
        pracovního poměru, výmaz záznamů člověka, změna nastavení uchování a smazání organizace jsou
        pokyny dané prostřednictvím Služby. Pokud se domníváme, že pokyn porušuje GDPR nebo jiné
        předpisy o ochraně osobních údajů, neprodleně to Správci sdělíme.
      </p>
      <p>
        Údaje organizace nepoužíváme k žádnému vlastnímu účelu, neprodáváme je a nepoužíváme je k
        reklamě ani k trénování modelů umělé inteligence či strojového učení.
      </p>

      <h2>5. Mlčenlivost</h2>
      <p>
        Každý, koho ke zpracování údajů organizace oprávníme, je vázán mlčenlivostí na základě
        smlouvy nebo zákona a má přístup jen v rozsahu, který jeho úkol vyžaduje.
      </p>

      <h2>6. Zabezpečení</h2>
      <p>
        Přijímáme technická a organizační opatření, která vyžaduje článek 32 GDPR, přiměřená riziku:
        provoz v EU na {LEGAL.cs.hosting}, šifrování při přenosu i v klidu, přístup podle rolí
        uvnitř Služby a zálohy, které postupně vypršují. Popisuje je stránka{" "}
        <a href="/security/">Zabezpečení</a> (v angličtině). Opatření můžeme časem zlepšovat, nikdy
        však nesnížíme úroveň ochrany, kterou poskytují.
      </p>

      <h2>7. Další zpracovatelé</h2>
      <p>Správce nám dává obecné povolení zapojit další zpracovatele. Zapojujeme tyto:</p>
      <table>
        <thead>
          <tr>
            <th>Další zpracovatel</th>
            <th>Účel</th>
            <th>Umístění</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Amazon Web Services (AWS)</td>
            <td>Provoz aplikace, databáze a úložiště souborů</td>
            <td>EU (Frankfurt, Německo)</td>
          </tr>
          <tr>
            <td>Amazon SES (AWS)</td>
            <td>Odesílání e-mailových oznámení</td>
            <td>EU (Frankfurt, Německo)</td>
          </tr>
          <tr>
            <td>Functional Software, Inc. (Sentry)</td>
            <td>Sledování chyb a diagnostika výkonu</td>
            <td>Region EU (Frankfurt, Německo); společnost sídlí ve Spojených státech</td>
          </tr>
          <tr>
            <td>Apple Inc. (Apple Push Notification service)</td>
            <td>
              Doručování push oznámení do aplikace pro iPhone; v textu oznámení vidí jména a data
              nepřítomností a docházky
            </td>
            <td>Spojené státy</td>
          </tr>
        </tbody>
      </table>
      <p>
        O každém zamýšleném přidání nebo nahrazení dalšího zpracovatele Správce informujeme
        aktualizací tohoto seznamu a data jeho poslední aktualizace nejméně 30 dní před změnou a
        e-mailem vlastníkovi. Správce může v této lhůtě vznést námitku z oprávněných důvodů ochrany
        osobních údajů. Pokud námitku nevyřešíme, může Správce organizaci smazat dříve, než změna
        nabude účinnosti. Každý další zpracovatel je smluvně vázán stejnými povinnostmi k ochraně
        osobních údajů jako tato Smlouva a za jeho činnost Správci odpovídáme.
      </p>

      <h2>8. Předávání mimo EHP</h2>
      <p>
        Údaje organizace jsou uloženy v Evropské unii. Pokud je další zpracovatel zpracovává mimo
        Evropský hospodářský prostor, opíráme se o rozhodnutí o odpovídající ochraně nebo o
        standardní smluvní doložky Evropské komise podle kapitoly V GDPR.
      </p>

      <h2>9. Pomoc s žádostmi lidí</h2>
      <p>
        Služba dává Správci nástroje k vyřízení žádostí, které lidé podávají podle kapitoly III
        GDPR: člověk si může stáhnout své vlastní záznamy z každé organizace a vlastník a správci
        mohou exportovat záznamy člověka, ukončit pracovní poměr a vymazat záznamy člověka, který
        smazal svůj účet nebo ho nikdy neměl. Pokud nám někdo pošle žádost týkající se údajů
        organizace, bez zbytečného odkladu ji předáme vlastníkovi a sami na ni neodpovídáme, kromě
        sdělení, že jsme ji předali. Pokud nástroje nestačí, pomůžeme Správci v rozsahu, který je
        pro nás přiměřeně možný.
      </p>

      <h2>10. Porušení zabezpečení osobních údajů</h2>
      <p>
        O porušení zabezpečení, které se týká údajů organizace, informujeme vlastníka bez zbytečného
        odkladu poté, co se o něm dozvíme. Sdělíme, co víme o jeho povaze, dotčených osobách a
        záznamech, pravděpodobných důsledcích a přijatých opatřeních, a doplňujeme informace, jak
        přibývají, aby Správce mohl splnit své povinnosti podle článků 33 a 34 GDPR.
      </p>

      <h2>11. Pomoc s posouzením vlivu</h2>
      <p>
        Poskytneme Správci informace o Službě, které přiměřeně potřebuje k posouzení vlivu na
        ochranu osobních údajů nebo k předchozí konzultaci s dozorovým úřadem podle článků 35 a 36
        GDPR.
      </p>

      <h2>12. Konec služby a výmaz</h2>
      <p>
        Když člověk smaže svůj vlastní účet, není to pokyn organizace. Jeho pracovní poměry
        zůstávají otevřené a jeho údaje organizace zůstávají u organizace, dokud Správce pracovní
        poměr neukončí nebo záznamy nevymaže.
      </p>
      <p>
        Správce ukončuje službu smazáním organizace, k němuž dojde, když vlastník smaže svůj vlastní
        účet poté, co v organizaci už nepracuje nikdo jiný s účtem. Předtím si vlastník může
        stáhnout export jejích údajů. Po smazání organizace její údaje okamžitě odstraníme z
        provozních systémů a z našich záloh zmizí do sedmi dnů, ledaže nám jejich uchování ukládá
        právo EU nebo České republiky.
      </p>

      <h2>13. Audity</h2>
      <p>
        Správci zpřístupníme informace potřebné k doložení, že plníme článek 28 GDPR. Umožníme
        audity, včetně inspekcí, prováděné Správcem nebo jím pověřeným auditorem vázaným
        mlčenlivostí, a přispějeme k nim, a to po přiměřeném písemném oznámení a bez zbytečného
        narušení Služby. Každá strana nese své vlastní náklady.
      </p>

      <h2>14. Odpovědnost, přednost a rozhodné právo</h2>
      <p>
        Odpovědnost podle této Smlouvy se řídí Obchodními podmínkami, aniž by se omezovala
        odpovědnost, kterou článek 82 GDPR omezit nedovoluje. Pokud se tato Smlouva a Obchodní
        podmínky ve zpracování údajů organizace liší, má přednost tato Smlouva. Smlouva se řídí
        právem České republiky.
      </p>

      <h2>15. Kontakt</h2>
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
