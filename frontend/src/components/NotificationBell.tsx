import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { useAuth } from '../auth';
import { Icon } from './icons';
import { useOutsideClose } from './ui';
import type { Announcement } from '../types';

interface BellItem {
  id: number;
  title: string;
  body: string;
  publishedAt: string;
  targetType: string;
  unread: boolean;
}

export default function NotificationBell() {
  const { user, isRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellItem[]>([]);
  const wrapRef = useOutsideClose<HTMLDivElement>(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const sid = user?.linkedStudentId;
    if (isRole('student') && sid) {
      http
        .get<Announcement[]>(`/notifications/student/${sid}?programId=&levelId=&cohortId=`)
        .then((list) =>
          setItems(
            list.map((a) => ({
              ...a,
              unread:
                Date.now() - new Date(a.publishedAt).getTime() < 3 * 24 * 60 * 60 * 1000,
            })),
          ),
        )
        .catch(() => setItems([]));
    } else {
      http
        .get<Announcement[]>(`/notifications/announcements?active=true`)
        .then((list) =>
          setItems(
            list.map((a) => ({
              ...a,
              unread:
                Date.now() - new Date(a.publishedAt).getTime() < 3 * 24 * 60 * 60 * 1000,
            })),
          ),
        )
        .catch(() => setItems([]));
    }
  }, [open, isRole, user?.linkedStudentId]);

  const unreadCount = items.filter((i) => i.unread).length;

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button type="button" className="topbar-icon-btn" onClick={() => setOpen((s) => !s)} aria-label="Notifications">
        <Icon name="bell" />
        {unreadCount > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="bell-panel">
          <div className="bell-panel-head">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <BadgeDot label={`${unreadCount} new`} />
            )}
          </div>
          <div className="bell-panel-body">
            {items.length === 0 ? (
              <div className="search-empty">You are all caught up.</div>
            ) : (
              items.slice(0, 12).map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className={`bell-item ${it.unread ? 'unread' : ''}`}
                  onClick={() => {
                    setOpen(false);
                    navigate('/announcements');
                  }}
                >
                  <div className="bell-item-title">{it.title}</div>
                  <div className="bell-item-msg">{it.body}</div>
                  <div className="bell-item-meta">
                    {new Date(it.publishedAt).toLocaleString()}
                    {' · '}
                    {it.targetType.replace(/_/g, ' ')}
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            className="bell-foot"
            onClick={() => {
              setOpen(false);
              navigate('/announcements');
            }}
          >
            View all announcements
          </button>
        </div>
      )}
    </div>
  );
}

function BadgeDot({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)', color: '#8a6a2e', background: 'var(--gold-soft)', padding: '3px 10px', borderRadius: 999 }} title={label}>
      {label}
    </span>
  );
}