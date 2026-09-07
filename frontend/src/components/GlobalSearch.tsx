import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { Icon } from './icons';
import { initials, Loading } from './ui';

interface Hit {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  program?: { name: string };
  level?: { name: string };
  academicStatus: string;
}

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      setSearched(false);
      return;
    }
    setBusy(true);
    const timer = window.setTimeout(() => {
      http
        .get<{ items: Hit[] }>(`/students?search=${encodeURIComponent(q.trim())}&limit=8`)
        .then((r) => {
          setResults(r.items ?? []);
          setOpen(true);
          setSearched(true);
        })
        .catch(() => {
          setResults([]);
          setOpen(true);
        })
        .finally(() => setBusy(false));
    }, 320);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="topbar-search" ref={boxRef}>
      <Icon name="search" />
      <input
        className="input"
        placeholder="Search students…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim() && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && (
        <div className="search-panel">
          <div className="search-panel-tip">
            Search by student ID or name · press Esc to close
          </div>
          {busy && <Loading text="Searching…" />}
          {!busy && searched && results.length === 0 && (
            <div className="search-empty">No students match “{q}”.</div>
          )}
          {!busy &&
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                className="search-result"
                onClick={() => {
                  setOpen(false);
                  setQ('');
                  navigate(`/students/${r.id}`);
                }}
              >
                <span className="sr-avatar">{initials(r.firstName, r.lastName)}</span>
                <span className="sr-main">
                  <span className="sr-title">
                    {r.studentId} — {r.lastName}, {r.firstName}
                  </span>
                  <span className="sr-sub">
                    {[r.program?.name, r.level?.name, r.academicStatus].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <Icon name="chevronRight" style={{ width: 14, height: 14, color: 'var(--faint)', marginLeft: 'auto' }} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}