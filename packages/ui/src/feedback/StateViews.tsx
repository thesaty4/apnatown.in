import type { ComponentPropsWithRef, ReactNode } from 'react';

/** `immersive` is for always-dark media surfaces such as the Reels feed. */
export type StateTone = 'surface' | 'immersive';

type StateProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
  title: string;
  message: string;
  action: ReactNode;
  icon?: ReactNode;
  tone?: StateTone | undefined;
  /** Use `h2` when the page already owns its `h1`. */
  headingLevel?: 'h1' | 'h2' | undefined;
};

const tones = {
  surface: {
    icon: 'size-state-icon rounded-pill bg-primary-soft',
    message: 'max-w-state-copy text-text-2',
  },
  immersive: {
    icon: '',
    message: 'max-w-reel-state-copy text-reel-text-2',
  },
} as const;

function StateView({
  title,
  message,
  action,
  icon,
  tone = 'surface',
  headingLevel: Heading = 'h1',
  className = '',
  ...props
}: StateProps) {
  return (
    <section
      {...props}
      className={`grid justify-items-center gap-state-gap px-state-inline py-state-block text-center ${className}`}
    >
      <div
        aria-hidden="true"
        className={`grid place-items-center text-state-icon ${tones[tone].icon}`}
      >
        {icon}
      </div>
      <Heading className="m-0 font-display text-h3">{title}</Heading>
      <p
        className={`m-0 [overflow-wrap:anywhere] ${tones[tone].message}`}
      >
        {message}
      </p>
      {action}
    </section>
  );
}

export function EmptyState(props: StateProps) {
  return <StateView icon="📭" {...props} />;
}

export function ErrorState(props: StateProps) {
  return <StateView role="alert" icon="⚠️" {...props} />;
}

export function NoPermissionState(props: StateProps) {
  return <StateView icon="🔒" {...props} />;
}

export function NotFoundState(props: StateProps) {
  return <StateView icon="🧭" {...props} />;
}

export function OfflineState(props: StateProps) {
  return <StateView icon="📡" {...props} />;
}

export function MaintenanceState(props: StateProps) {
  return <StateView icon="🛠️" {...props} />;
}
