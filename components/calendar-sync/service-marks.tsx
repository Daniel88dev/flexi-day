// Simplified service brand marks for the subscribe / integration rows.

export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h11.9c-.2 1.9-1.5 4.8-4.4 6.7l6.7 5.2c4-3.7 6.9-9.2 6.9-15.2z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.8 0 10.6-1.9 14.2-5.2l-6.7-5.2c-1.8 1.2-4.2 2.1-7.5 2.1-5.7 0-10.6-3.8-12.3-9.1l-7 5.4C8.2 41 15.5 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.7 28.6c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1l-7-5.4C4 17.7 3.2 20.7 3.2 24s.8 6.3 2.4 9l6.1-4.4z"
      />
      <path
        fill="#EA4335"
        d="M24 10.8c3.2 0 5.4 1.4 6.6 2.5l5.9-5.8C32.6 4.1 28.9 2.5 24 2.5 15.5 2.5 8.2 7.5 5.6 15l7 5.4C14.3 15.1 19.3 10.8 24 10.8z"
      />
    </svg>
  );
}

export function MicrosoftMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="4" y="4" width="43" height="43" fill="#F25022" />
      <rect x="53" y="4" width="43" height="43" fill="#7FBA00" />
      <rect x="4" y="53" width="43" height="43" fill="#00A4EF" />
      <rect x="53" y="53" width="43" height="43" fill="#FFB900" />
    </svg>
  );
}

export function AppleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2 1.6-2.9 1.7-3-.9-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.4 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-.9 2.3-1.9c.7-1.1 1-2.1 1-2.2-.1 0-2-.8-2.2-3.3zM14.6 6.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.8-.4 2.3-1.1z" />
    </svg>
  );
}
