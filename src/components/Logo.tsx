export function Logo100x({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bulbGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="filamentGrad" x1="24" y1="16" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>
      {/* Bulb body */}
      <path
        d="M24 4C16.268 4 10 10.268 10 18c0 5.4 3.1 10.1 7.6 12.5V34c0 1.1.9 2 2 2h8.8c1.1 0 2-.9 2-2v-3.5C34.9 28.1 38 23.4 38 18c0-7.732-6.268-14-14-14z"
        fill="url(#bulbGrad)"
      />
      {/* Bulb bottom */}
      <rect x="19" y="34" width="10" height="4" rx="2" fill="url(#bulbGrad)" opacity="0.8" />
      {/* Lightning bolt */}
      <path
        d="M27 12l-6 10h4l-2 8 8-12h-5l2-6z"
        fill="url(#filamentGrad)"
      />
    </svg>
  );
}
