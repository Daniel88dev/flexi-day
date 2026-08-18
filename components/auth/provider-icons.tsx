export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.5 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.9a5 5 0 0 1-2.18 3.3v2.74h3.52c2.06-1.9 3.26-4.7 3.26-7.88z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.94 0 5.4-.97 7.2-2.63l-3.52-2.73c-.98.66-2.23 1.05-3.68 1.05-2.83 0-5.23-1.91-6.09-4.48H2.27v2.82A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.91 14.21a6.6 6.6 0 0 1 0-4.42V6.97H2.27a11 11 0 0 0 0 9.86z" />
      <path
        fill="#EA4335"
        d="M12 5.5c1.6 0 3.03.55 4.16 1.62l3.12-3.12C17.4 2.2 14.94 1.2 12 1.2A11 11 0 0 0 2.27 6.97l3.64 2.82C6.77 7.4 9.17 5.5 12 5.5z"
      />
    </svg>
  );
}

export function MicrosoftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <rect x="4" y="4" width="43" height="43" fill="#F25022" />
      <rect x="53" y="4" width="43" height="43" fill="#7FBA00" />
      <rect x="4" y="53" width="43" height="43" fill="#00A4EF" />
      <rect x="53" y="53" width="43" height="43" fill="#FFB900" />
    </svg>
  );
}
