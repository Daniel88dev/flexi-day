// NOTE: The Czech people directory agreement. Keep it in step with
// app/(legal)/directory-agreement/page.tsx; a test fails when their sections drift apart.
// Have it reviewed by a qualified lawyer before relying on it.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { DIRECTORY_AGREEMENT_VERSION, LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Smlouva k adresáři lidí · flexiday",
  description:
    "Smlouva, kterou organizace přijímá, když její vlastník zapne adresář lidí. Doplňuje smlouvu o zpracování osobních údajů.",
};

export default function CsDirectoryAgreementPage() {
  return (
    <LegalShell
      title="Smlouva k adresáři lidí"
      updated={LEGAL.cs.updated}
      locale="cs"
      intro={`Verze ${DIRECTORY_AGREEMENT_VERSION}. Vlastník organizace ji přijímá jménem organizace, když zapne adresář lidí.`}
      translatedPage="directory-agreement"
    >
      <h2>1. Smluvní strany a rozsah</h2>
      <p>
        Tuto smlouvu uzavírá organizace, která zapne adresář lidí (dále jen &bdquo;Správce&ldquo;),
        jednající prostřednictvím svého vlastníka, a <strong>{LEGAL.entity}</strong>, se sídlem{" "}
        {LEGAL.cs.address}, IČO {LEGAL.ico} (dále jen &bdquo;Zpracovatel&ldquo;, &bdquo;my&ldquo;).
        Doplňuje <a href="/cs/dpa/">Smlouvu o zpracování osobních údajů</a> (dále jen
        &bdquo;DPA&ldquo;) pro <strong>data adresáře</strong>: profily, které Správce v adresáři
        lidí vede, fotografie, nouzové kontakty a exporty, které k nim patří, a záznam čtení,
        historii profilu a historii oprávnění, které zaznamenávají jejich použití.
      </p>
      <p>
        Vše, co DPA stanoví pro údaje organizace, platí i pro data adresáře, včetně subzpracovatelů,
        oznamování porušení zabezpečení, auditů a pomoci s žádostmi. Pokud se tato smlouva a DPA v
        otázce dat adresáře liší, má přednost tato smlouva.
      </p>

      <h2>2. Co adresář obsahuje</h2>
      <p>Každý profil patří k jednomu pracovnímu poměru a dělí se na sekce:</p>
      <ul>
        <li>
          <strong>Karta</strong>: jméno, pracovní pozice, oddělení, lokalita a nadřízený.
        </li>
        <li>
          <strong>Fotografie</strong>: profilová fotografie.
        </li>
        <li>
          <strong>Pracovní kontakt</strong>: pracovní e-mail a pracovní telefon.
        </li>
        <li>
          <strong>Pracovní údaje</strong>: úřední jméno, osobní číslo, datum nástupu, odchodu a
          konce zkušební doby, typ smlouvy a pracovní úvazek.
        </li>
        <li>
          <strong>Kontakt</strong>: soukromý telefon, soukromý e-mail a až dva nouzové kontakty,
          každý se jménem a telefonním číslem.
        </li>
        <li>
          <strong>Osobní údaje</strong>: adresa bydliště a datum narození, jen u zaměstnanců.
        </li>
      </ul>
      <p>
        Kontakt a Osobní údaje jsou <strong>citlivé sekce</strong>. Adresář nemá žádné pole pro
        údaje o zdravotním stavu, členství v odborech ani jinou zvláštní kategorii údajů podle
        článku 9 GDPR a Správce by takové údaje neměl zapisovat do žádného textového pole. Datum
        narození v profilu je oddělené od narozenin, které si člověk nastaví ve svém účtu, a jedno
        se nikdy nekopíruje do druhého.
      </p>

      <h2>3. Pokyny Správce</h2>
      <p>
        Správce rozhoduje, co adresář obsahuje a kdo ho vidí. Jeho nastavení ve Službě jsou jeho
        doloženými pokyny podle DPA: tabulka oprávnění, která určuje, kdo jednotlivé sekce čte a
        mění, role HR a Vedení, které přiděluje, lhůta uchování každé sekce, pozastavení mazání,
        výmazy, exporty a zapnutí nebo vypnutí adresáře. Každá změna platí jako pokyn okamžikem
        uložení.
      </p>
      <p>
        Správce zajistí, že má pro data, která v adresáři vede, právní základ, a informuje své lidi
        o adresáři podle článku 13 GDPR. Volba &bdquo;Dát vědět členům&ldquo; pošle každému, kdo zde
        má účet, upozornění, aby si zkontroloval svůj profil; vlastní informace Správce jeho lidem
        nenahrazuje.
      </p>

      <h2>4. Žádné biometrické zpracování</h2>
      <p>
        Nikdy nespouštíme rozpoznávání obličejů, porovnávání obličejů ani jinou identifikaci osoby
        na profilových fotografiích ani na žádném jiném obrázku ve Službě, docházku nevyjímaje.
        Nevytváříme biometrické šablony a žádný obrázek neposíláme službě třetí strany pro
        počítačové vidění nebo rozpoznávání. Profilovou fotografii zpracováváme jen tak, že ji
        dekódujeme, zmenšíme na malou a plnou velikost a odstraníme z ní metadata včetně EXIF a
        údajů o poloze. Profilová fotografie proto není biometrickým údajem podle čl. 4 bodu 14
        GDPR.
      </p>
      <p>
        V rámci současné verze této smlouvy to nezměníme. Jakákoli změna by přišla jen s novou
        verzí, po posouzení vlivu na ochranu osobních údajů, a pro organizaci by platila až poté, co
        tuto verzi přijme její vlastník.
      </p>

      <h2>5. Ochrana citlivých sekcí</h2>
      <p>Nad rámec bezpečnostních opatření, která popisuje DPA:</p>
      <ul>
        <li>
          šifrujeme hodnoty sekcí Kontakt a Osobní údaje v aplikaci, a to datovým klíčem Správce,
          který je zabalen klíčem spravovaným zákazníkem v AWS Key Management Service. Kopie
          databáze nebo jejích záloh obsahuje jen šifrovaný text;
        </li>
        <li>
          ukládáme profilové fotografie a exporty do soukromého úložiště v EU, šifrované stejným
          klíčem spravovaným zákazníkem, a zpřístupňujeme je jen podepsanými odkazy: odkaz na export
          platí hodinu, odkaz na fotografii nejvýše dvě hodiny;
        </li>
        <li>
          citlivé sekce cizího profilu vracíme, jen když si je čtenář nechá zobrazit, a pokaždé
          zapíšeme záznam o čtení: kdo četl které sekce čího profilu, kdy a díky kterému okruhu v
          tabulce oprávnění. Záznam zapíše i každý export údajů o člověku. Záznam o čtení neobsahuje
          žádné hodnoty, uchovává se 12 měsíců a čte ho vlastník a správci organizace;
        </li>
        <li>
          vedeme historii profilu, kdo a kdy měnil která pole, a historii oprávnění se všemi změnami
          tabulky oprávnění a jejích rolí; ani jedna neobsahuje hodnoty profilu;
        </li>
        <li>
          nedáváme hodnoty profilu do logů, chybových hlášení, oznámení, push oznámení ani e-mailů,
          které nesou jen identifikátory;
        </li>
        <li>citlivé hodnoty drží aplikace pro iPhone jen v paměti, nikdy v místním úložišti.</li>
      </ul>
      <p>
        Naše podpora platformy vidí, zda má organizace zapnutý adresář, kterou verzi této smlouvy
        přijala, a počty. Žádné hodnoty profilů nevidí a do dalších údajů nahlížíme jen na písemný
        pokyn vlastníka dané organizace.
      </p>

      <h2>6. Nouzové kontakty</h2>
      <p>
        Nouzové kontakty jsou lidé, kteří Službu nepoužívají. Správce získává jejich údaje od svých
        lidí a musí je informovat podle článku 14 GDPR. Jako pomoc Služba zobrazuje pod poli
        nouzových kontaktů upozornění tomu, kdo je vyplňuje, a žádá ho, aby ho předal dál.
        Upozornění uvádí Správce a aktuální lhůtu uchování sekce Kontakt. Správce může naše výchozí
        znění nahradit vlastním a za obsah svého upozornění odpovídá.
      </p>

      <h2>7. Uchování a výmaz</h2>
      <p>
        Každá sekce se uchovává po dobu, kdy člověk pro Správce pracuje, a poté po lhůtu uchování,
        kterou pro ni Správce nastaví. Lhůta se počítá od pozdějšího z posledního pracovního dne a
        dne, kdy byl konec pracovního poměru zaznamenán. Dokud je Správce nezmění, platí tyto lhůty:
      </p>
      <table>
        <thead>
          <tr>
            <th>Sekce</th>
            <th>Uchování po odchodu</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Karta</td>
            <td>Do výmazu záznamu</td>
          </tr>
          <tr>
            <td>Fotografie</td>
            <td>1 rok</td>
          </tr>
          <tr>
            <td>Pracovní kontakt</td>
            <td>30 dní</td>
          </tr>
          <tr>
            <td>Pracovní údaje</td>
            <td>Do výmazu záznamu</td>
          </tr>
          <tr>
            <td>Kontakt</td>
            <td>30 dní</td>
          </tr>
          <tr>
            <td>Osobní údaje</td>
            <td>3 roky</td>
          </tr>
        </tbody>
      </table>
      <p>
        Noční běh odstraní každou sekci, které uplynula lhůta, pokud Správce u daného člověka
        nezapnul pozastavení mazání. Zkrácení lhůty odstraní, co je za ní, při nejbližším běhu;
        prodloužení nic nevrátí. Vlastník a správci organizace mohou data adresáře o člověku kdykoli
        vymazat. Odstraněné hodnoty zmizí z našich záloh do sedmi dnů. Záznamy o čtení přetrvají
        výmaz až do uplynutí svých 12 měsíců, protože neobsahují žádné hodnoty.
      </p>

      <h2>8. Exporty a žádosti lidí</h2>
      <p>
        Vlastník a správci organizace mohou exportovat data adresáře o jednom člověku, včetně dat a
        účelů čtení jeho citlivých sekcí, bez jmen čtenářů. Vlastník může exportovat celou
        organizaci. Každý export uchováváme sedm dní a stahuje se podepsaným odkazem. Člověk si také
        může stáhnout své vlastní záznamy z každé organizace a žádosti lidí týkající se dat adresáře
        se ke Správci dostanou, jak popisuje DPA.
      </p>

      <h2>9. Vypnutí adresáře a ukončení služby</h2>
      <p>
        Vypnutí adresáře skryje jeho stránky a data ponechá; lhůty uchování dál běží. Smazání všech
        dat adresáře je samostatný krok, který může udělat jen vlastník. Při smazání organizace
        smažeme data adresáře spolu s ostatními údaji organizace a s jejím datovým klíčem, takže
        hodnoty sekcí Kontakt a Osobní údaje, které zůstanou v zálohách databáze, už nelze přečíst.
      </p>

      <h2>10. Verze</h2>
      <p>
        Zaznamenáváme, kdo tuto smlouvu přijal, kdy a kterou verzi. Když zveřejníme novou verzi,
        vlastník je při příští návštěvě požádán o její přijetí a adresář mezitím dál funguje. Dokud
        ji vlastník nepřijme, platí verze, kterou přijal naposledy.
      </p>

      <h2>11. Kontakt</h2>
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
