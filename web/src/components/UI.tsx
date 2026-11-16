import type { ReactNode } from 'react';

export function Brand() {
  return (
    <div className="brand" aria-label="Kuri Labo">
      <span className="brand-brush" aria-hidden="true" />
      <span>KuriLabo<span className="brand-dot">.</span></span>
    </div>
  );
}

export function PaperCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`paper-card ${className}`}>{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label: Record<string, string> = {
    pending_confirmation: 'pending',
    cancellation_requested: 'cancel request',
    completed: 'completed',
    no_show: 'no show',
  };
  return <span className={`status status-${key}`}><i />{label[key] ?? key}</span>;
}

export function PageHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <svg className="scribble" width="76" height="8" viewBox="0 0 76 8" aria-hidden="true">
          <path d="M2 5.5c14-4 25 2 39-1.5 12-3 20 1 33-1" fill="none" />
        </svg>
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state"><span className="empty-flower">✿</span><p>{children}</p></div>;
}

export function LoadingPage() {
  return <div className="loading-page"><span /><span /><span /></div>;
}
