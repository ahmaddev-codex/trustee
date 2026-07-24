function IconFrame({
  className,
  label,
  children,
}: {
  className?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

export function EscrowFlowIcon({ className }: { className?: string }) {
  return (
    <IconFrame className={className} label="Payment traveling from buyer into escrow">
      <circle cx="10" cy="32" r="5" fill="currentColor" opacity="0.5" />

      <path
        d="M16 32 H38"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />

      <g transform="translate(46, 32)">
        <path
          d="M0 -13 L11.5 -8 V2 C11.5 8.5 6 12.5 0 15 C-6 12.5 -11.5 8.5 -11.5 2 V-8 Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeOpacity="0.85"
          strokeWidth="1.5"
        >
          <animate
            attributeName="fill-opacity"
            values="0.1;0.22;0.1"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      <circle r="2.75" fill="currentColor" opacity="0.7">
        <animateMotion
          dur="2.6s"
          repeatCount="indefinite"
          path="M16 32 H43"
          keyPoints="0;1;1"
          keyTimes="0;0.7;1"
          calcMode="linear"
        />
        <animate
          attributeName="opacity"
          values="0.85;0.85;0"
          keyTimes="0;0.7;1"
          dur="2.6s"
          repeatCount="indefinite"
        />
      </circle>
    </IconFrame>
  );
}

export function ShipFlowIcon({ className }: { className?: string }) {
  return (
    <IconFrame className={className} label="Package on its way to the buyer">
      <g transform="translate(26, 32)">
        <path
          d="M-11 -7 L0 -12 L11 -7 V7 L0 12 L-11 7 Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeOpacity="0.85"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M-11 -7 L0 -2 L11 -7 M0 -2 V12"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.6"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </g>

      <g opacity="0.6">
        <line x1="42" y1="26" x2="52" y2="26" stroke="currentColor" strokeWidth="1.5">
          <animate
            attributeName="opacity"
            values="0.6;0.1;0.6"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="42" y1="32" x2="55" y2="32" stroke="currentColor" strokeWidth="1.5">
          <animate
            attributeName="opacity"
            values="0.1;0.6;0.1"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="42" y1="38" x2="50" y2="38" stroke="currentColor" strokeWidth="1.5">
          <animate
            attributeName="opacity"
            values="0.6;0.1;0.6"
            dur="1.6s"
            begin="0.3s"
            repeatCount="indefinite"
          />
        </line>
      </g>
    </IconFrame>
  );
}

export function ConfirmFlowIcon({ className }: { className?: string }) {
  return (
    <IconFrame className={className} label="Buyer confirming the item arrived">
      <circle
        cx="32"
        cy="32"
        r="15"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.5"
      >
        <animate
          attributeName="r"
          values="15;16.5;15"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
      <path
        d="M25 32 L30 37 L40 26"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="20"
        strokeDashoffset="20"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="20;0;0;20"
          keyTimes="0;0.4;0.85;1"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </path>
    </IconFrame>
  );
}

export function PayoutFlowIcon({ className }: { className?: string }) {
  return (
    <IconFrame className={className} label="Seller receiving payout">
      <path
        d="M14 28 H50 V42 C50 44 48.5 45.5 46.5 45.5 H17.5 C15.5 45.5 14 44 14 42 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <path
        d="M14 28 L18 20 H46 L50 28"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />

      <circle cx="32" cy="17" r="5" fill="currentColor" opacity="0.6">
        <animate
          attributeName="cy"
          values="14;17;14"
          dur="2.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.9;0.55;0.9"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </circle>
    </IconFrame>
  );
}
