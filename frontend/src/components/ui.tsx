import { Component, useState, type ErrorInfo, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="box error-box" role="alert">
          <h3>Something went wrong</h3>
          <p className="muted">{this.state.error.message}</p>
          <button
            type="button"
            className="btn"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Spinner() {
  return <span className="spinner" aria-label="loading" />;
}

export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="loading">
      <Spinner /> {text}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

export function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return <Alert kind="error">{text}</Alert>;
}

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`btn ${props.className ?? ''}`} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input ${props.className ?? ''}`} />;
}

export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <b>*</b>}
      </span>
      {children}
    </label>
  );
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card-header">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function Table({
  columns,
  children,
  empty = 'No records',
}: {
  columns: string[];
  children: ReactNode;
  empty?: string;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!children && (
        <div className="table-empty">{empty}</div>
      )}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            &times;
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function useModal() {
  const [open, setOpen] = useState(false);
  return { open, close: () => setOpen(false), openModal: () => setOpen(true) };
}

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateTime(s: string | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleString();
}

export function dateOnly(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString();
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${(Number(n) * 100).toFixed(1)}%`;
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];