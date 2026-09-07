import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ErrorInfo,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon, type IconName } from './icons';

/* ---------------------------------------------------------------------------
   Error boundary
--------------------------------------------------------------------------- */
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
        <div className="error-box" role="alert">
          <div className="error-code">System error</div>
          <h3>Something went wrong</h3>
          <p className="muted">{this.state.error.message}</p>
          <button
            type="button"
            className="btn mt"
            onClick={() => window.location.reload()}
          >
            <Icon name="refresh" /> Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------------------------------------------------------------------
   Feedback: spinner, loading, alerts
--------------------------------------------------------------------------- */
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

export function Alert({
  kind,
  children,
}: {
  kind: 'error' | 'success' | 'info' | 'warning';
  children: ReactNode;
}) {
  const icon = kind === 'error' ? 'alertTriangle' : kind === 'success' ? 'checkCircle' : kind === 'warning' ? 'alertTriangle' : 'info';
  return (
    <div className={`alert alert-${kind}`}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  );
}

export function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return <Alert kind="error">{text}</Alert>;
}

/* ---------------------------------------------------------------------------
   Page primitives
--------------------------------------------------------------------------- */
export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-title-line">
        <div>
          <h1>{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
          <div className="gold-rule" />
        </div>
        {actions && <div className="row gap">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <Icon name={icon} />
      </div>
      <h4>{title}</h4>
      {body && <p>{body}</p>}
      {action && <div className="es-action">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function Card({
  title,
  icon,
  children,
  actions,
  bodyClassName = '',
}: {
  title?: string;
  icon?: IconName;
  children: ReactNode;
  actions?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card-header">
          {title && (
            <h3>
              {icon && (
                <Icon name={icon} style={{ width: 16, height: 16, color: 'var(--gold)', marginRight: 6, verticalAlign: -2 }} />
              )}
              {title}
            </h3>
          )}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={`card-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Stat cards — differentiated variants
--------------------------------------------------------------------------- */
const statVariantConfig: Record<
  string,
  { accent: string; variant: string; icon: IconName }
> = {
  default: { accent: 'a-navy', variant: '', icon: 'sparkle' },
  financial: { accent: 'a-gold', variant: 'v-gold', icon: 'dollar' },
  academic: { accent: 'a-navy', variant: 'v-navy', icon: 'graduationCap' },
  progress: { accent: 'a-green', variant: 'v-green', icon: 'checkCircle' },
  alert: { accent: 'a-red', variant: 'v-red', icon: 'alertCircle' },
  activity: { accent: 'a-purple', variant: 'v-purple', icon: 'clock' },
  action: { accent: 'a-ivory', variant: '', icon: 'arrowUpRight' },
};

export function StatCard({
  label,
  value,
  sub,
  variant = 'default',
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  variant?: 'default' | 'financial' | 'academic' | 'progress' | 'alert' | 'activity' | 'action';
  icon?: IconName;
  trend?: { dir: 'up' | 'down' | 'flat'; text: string };
}) {
  const cfg = statVariantConfig[variant] ?? statVariantConfig.default;
  return (
    <div className={`stat-card ${cfg.variant}`}>
      <div className={`stat-accent ${cfg.accent}`}>
        <Icon name={icon ?? cfg.icon} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value num">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {trend && (
        <span className={`stat-trend ${trend.dir}`}>
          <Icon name={trend.dir === 'up' ? 'arrowUpRight' : trend.dir === 'down' ? 'arrowUpRight' : 'sparkle'}
            style={{ width: 13, height: 13, transform: trend.dir === 'down' ? 'rotate(90deg)' : undefined }} />
          {trend.text}
        </span>
      )}
    </div>
  );
}

export function ProgressMini({
  label,
  value,
  display,
  tone = 'default',
}: {
  label: string;
  value: number;
  display?: string;
  tone?: 'default' | 'gold' | 'green' | 'amber' | 'red';
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="row-between">
        <span className="stat-label">{label}</span>
        <span className="pct-label">{display ?? `${pct.toFixed(0)}%`}</span>
      </div>
      <div className={`progress-bar ${tone === 'default' ? '' : tone}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Buttons / inputs
--------------------------------------------------------------------------- */
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

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrap">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="input"
      />
      <button
        type="button"
        className="password-toggle"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <Icon name={show ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  );
}

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <b>*</b>}
      </span>
      {children}
      {hint && <span className="section-note">{hint}</span>}
    </label>
  );
}

/* ---------------------------------------------------------------------------
   Table + pagination
--------------------------------------------------------------------------- */
export function Table({
  columns,
  children,
  empty,
  emptyIcon = 'inbox',
  pagination,
}: {
  columns: string[];
  children: ReactNode;
  empty?: string;
  emptyIcon?: IconName;
  pagination?: { page: number; pages: number; total: number; onPage: (p: number) => void };
}) {
  const hasRows = children != null && (Array.isArray(children) ? children.length > 0 : true);
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
        {!hasRows && (
          <EmptyState icon={emptyIcon} title={empty ?? 'No records'} />
        )}
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <span className="pg-info">
            Page {pagination.page} of {pagination.pages} · {pagination.total} records
          </span>
          <button className="pg-btn" disabled={pagination.page <= 1} onClick={() => pagination.onPage(pagination.page - 1)}>
            <Icon name="chevronLeft" style={{ width: 14, height: 14, verticalAlign: -2 }} />
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 2)
            .reduce<number[]>(
              (acc, p) => (acc[acc.length - 1] === p ? acc : [...acc, p]),
              [],
            )
            .map((p) => (
              <button
                key={p}
                className={`pg-btn ${p === pagination.page ? 'active' : ''}`}
                onClick={() => pagination.onPage(p)}
              >
                {p}
              </button>
            ))}
          <button className="pg-btn" disabled={pagination.page >= pagination.pages} onClick={() => pagination.onPage(pagination.page + 1)}>
            <Icon name="chevronRight" style={{ width: 14, height: 14, verticalAlign: -2 }} />
          </button>
        </div>
      )}
    </>
  );
}

export function Badge({ children, tone = 'plain' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-plain ${tone ? `badge-${tone}` : ''}`}>{children}</span>;
}

/* ---------------------------------------------------------------------------
   Tabs
--------------------------------------------------------------------------- */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon?: IconName }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={`tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.icon && <Icon name={t.icon} style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Modal
--------------------------------------------------------------------------- */
export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  width,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string | number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
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

/* ---------------------------------------------------------------------------
   Dropdown menu
--------------------------------------------------------------------------- */
export function Dropdown({
  header,
  children,
  align = 'right',
}: {
  header?: string;
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <div className="dropdown" style={align === 'left' ? { left: 0, right: 'auto' } : undefined}>
      {header && <div className="dropdown-header">{header}</div>}
      {children}
    </div>
  );
}

export function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

/* ---------------------------------------------------------------------------
   Toasts
--------------------------------------------------------------------------- */
interface ToastItem {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  body?: string;
  leaving?: boolean;
}

interface ToastContextValue {
  notify: (kind: 'success' | 'error' | 'info', title: string, body?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 240);
  }, []);

  const notify = useCallback(
    (kind: 'success' | 'error' | 'info', title: string, body?: string) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev, { id, kind, title, body }]);
      window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind} ${t.leaving ? 'leaving' : ''}`}>
            <Icon name={t.kind === 'success' ? 'checkCircle' : t.kind === 'error' ? 'alertCircle' : 'info'} />
            <div>
              <div className="toast-title">{t.title}</div>
              {t.body && <div className="toast-body">{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ---------------------------------------------------------------------------
   Charts (pure SVG/CSS, dependency-free)
--------------------------------------------------------------------------- */
export function Donut({
  segments,
  size = 150,
  thickness = 16,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = Math.max(segments.reduce((s, x) => s + x.value, 0), 0.0001);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--warmgrey)" strokeWidth={thickness} />
          {segments
            .filter((s) => s.value > 0)
            .map((s, i) => {
              const frac = s.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={`${s.label}-${i}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                >
                  <animate attributeName="stroke-dasharray" from="0 0" to={`${dash} ${c - dash}`} dur="0.7s" fill="freeze" />
                </circle>
              );
              offset += dash;
              return el;
            })}
        </svg>
        {(centerLabel || centerSub) && (
          <div
            className="donut-center"
            style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}
          >
            <div>
              <b>{centerLabel}</b>
              <span>{centerSub}</span>
            </div>
          </div>
        )}
      </div>
      <div className="chart-legend" style={{ flexDirection: 'column', alignItems: 'flex-start', margin: 0 }}>
        {segments.filter((s) => s.value > 0).map((s) => (
          <span key={s.label} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number; gold?: boolean }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="bar-col">
          <span className="bar-val">{d.value}</span>
          <div
            className={`bar-fill ${d.gold ? 'gold' : ''}`}
            style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, animationDelay: '150ms' }}
          />
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Value helpers
--------------------------------------------------------------------------- */
export function money(n: number | string | null | undefined): string {
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
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${(Number(n) * 100).toFixed(1)}%`;
}

export function initials(first?: string, last?: string): string {
  return `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || 'U';
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function today(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];