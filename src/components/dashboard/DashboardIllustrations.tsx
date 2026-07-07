// Original hand-coded SVG illustrations for the Dashboard — no external image assets.

export const HeroIllustration = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 260 220" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="heroSky" cx="50%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#312e81" stopOpacity="0.35" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <linearGradient id="heroMountain" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#14532d" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id="heroBackpack" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <linearGradient id="heroHoodie" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>

    <circle cx="130" cy="90" r="110" fill="url(#heroSky)" />

    {/* stars */}
    {[
      [30, 30, 2.2], [60, 15, 1.4], [200, 25, 1.8], [230, 55, 1.3],
      [20, 70, 1.6], [240, 95, 2], [15, 120, 1.3], [225, 140, 1.6],
      [45, 45, 1.1], [190, 70, 1.2],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#fbbf24" opacity={0.8} />
    ))}

    {/* mountains */}
    <path d="M0 190 L60 120 L100 160 L150 100 L200 160 L260 130 L260 220 L0 220 Z" fill="url(#heroMountain)" />

    {/* character: simplified stylized kid pointing up */}
    <g transform="translate(118 90)">
      {/* backpack strap */}
      <rect x="-6" y="18" width="34" height="46" rx="10" fill="url(#heroBackpack)" />
      {/* body / hoodie */}
      <path d="M-24 40 C-24 18 -8 4 12 4 C32 4 48 18 48 40 L48 80 C48 92 38 100 26 100 L-12 100 C-24 100 -32 92 -32 80 Z" fill="url(#heroHoodie)" />
      {/* V logo on chest */}
      <path d="M2 46 L12 66 L22 46" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* head */}
      <circle cx="12" cy="-14" r="22" fill="#f4b183" />
      {/* hair */}
      <path d="M-10 -22 C-10 -38 34 -38 34 -20 C30 -26 24 -30 12 -30 C0 -30 -6 -26 -10 -22 Z" fill="#1e293b" />
      {/* pointing arm */}
      <path d="M40 30 C58 16 70 -4 78 -22" stroke="#f4b183" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M40 30 C58 16 70 -4 78 -22" stroke="url(#heroHoodie)" strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.001" />
      <circle cx="79" cy="-24" r="7" fill="#f4b183" />
    </g>

    {/* sparkle near pointing hand */}
    <g transform="translate(200 60)" fill="#fde68a">
      <path d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z" />
    </g>
    <g transform="translate(215 85)" fill="#a5b4fc">
      <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" />
    </g>
  </svg>
);

export const RobotAvatar = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="robotBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
      <linearGradient id="robotFace" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    {/* antenna */}
    <line x1="32" y1="6" x2="32" y2="14" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
    <circle cx="32" cy="5" r="3.5" fill="#22c55e" />
    {/* head */}
    <rect x="12" y="14" width="40" height="32" rx="14" fill="url(#robotBody)" />
    {/* face plate */}
    <rect x="18" y="21" width="28" height="18" rx="9" fill="url(#robotFace)" />
    {/* eyes */}
    <circle cx="27" cy="30" r="3.4" fill="#ffffff" />
    <circle cx="37" cy="30" r="3.4" fill="#ffffff" />
    {/* ears */}
    <rect x="6" y="24" width="6" height="12" rx="3" fill="#7dd3fc" />
    <rect x="52" y="24" width="6" height="12" rx="3" fill="#7dd3fc" />
    {/* body */}
    <rect x="18" y="46" width="28" height="14" rx="6" fill="url(#robotBody)" />
    <circle cx="32" cy="53" r="3" fill="#0ea5e9" />
  </svg>
);

export const TreasureChestIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="chestBase" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c2410c" />
        <stop offset="100%" stopColor="#7c2d12" />
      </linearGradient>
      <linearGradient id="chestLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
    </defs>
    <rect x="6" y="24" width="36" height="18" rx="3" fill="url(#chestBase)" />
    <path d="M6 24 C6 14 14 10 24 10 C34 10 42 14 42 24 Z" fill="url(#chestLid)" />
    <rect x="4" y="23" width="40" height="4" rx="2" fill="#92400e" />
    <circle cx="24" cy="27" r="4.5" fill="#fde047" stroke="#a16207" strokeWidth="1.5" />
    <rect x="22.5" y="27" width="3" height="6" fill="#a16207" />
  </svg>
);
