interface LegalShellProps {
  title: string;
  /** Human-readable last-updated date, e.g. "23 July 2026". */
  updated: string;
  /** Short one-line summary shown under the title. */
  intro?: string;
  children: React.ReactNode;
}

export function LegalShell({ title, updated, intro, children }: LegalShellProps) {
  return (
    <div className="mx-auto w-full max-w-[760px] px-7 py-14 max-[600px]:px-5 max-[600px]:py-10">
      <h1
        className="font-display font-semibold"
        style={{ fontSize: "clamp(30px, 5vw, 40px)", letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      {intro ? (
        <p className="mt-3 text-[16px]" style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>
          {intro}
        </p>
      ) : null}
      <p className="mt-3 text-[13.5px]" style={{ color: "var(--text-faint)" }}>
        Last updated: {updated}
      </p>
      <article className="legal-prose mt-9">{children}</article>
    </div>
  );
}
