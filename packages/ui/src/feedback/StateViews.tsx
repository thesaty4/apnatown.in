import type { ComponentPropsWithRef, ReactNode } from 'react';

type StateProps = Omit<ComponentPropsWithRef<'section'>, 'title'> & {
  title: string;
  message: string;
  action: ReactNode;
  icon?: ReactNode;
};

function StateView({
  title,
  message,
  action,
  icon,
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
        className="grid size-state-icon place-items-center rounded-pill bg-primary-soft text-state-icon"
      >
        {icon}
      </div>
      <h1 className="font-display text-h3">{title}</h1>
      <p className="max-w-state-copy text-text-2 [overflow-wrap:anywhere]">
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
