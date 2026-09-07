import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Icon, type IconName } from './icons';
import { greeting, initials, today } from './ui';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  show: (can: (p: string) => boolean, isStudent: boolean, user: { username: string }) => boolean;
}

interface NavGroup {
  title: string;
  items: NavEntry[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: 'dashboard', show: () => true },
      {
        to: '/students/me',
        label: 'My Profile',
        icon: 'profile',
        show: (_c, isStudent) => isStudent,
      },
    ],
  },
  {
    title: 'Academic Operations',
    items: [
      { to: '/students', label: 'Students', icon: 'students', show: (c) => c('student.view') },
      {
        to: '/academics',
        label: 'Academics',
        icon: 'academics',
        show: (c) => c('academic.view') || c('curriculum.view'),
      },
      { to: '/courses', label: 'Courses', icon: 'course', show: (c) => c('course.view') || c('curriculum.view') },
      { to: '/enrollment', label: 'Enrollment', icon: 'enrollment', show: (c) => c('enrollment.view') },
      { to: '/staff', label: 'Staff', icon: 'staff', show: (c) => c('staff.view') },
      { to: '/timetable', label: 'Timetable', icon: 'timetable', show: (c) => c('timetable.view') },
      { to: '/attendance', label: 'Attendance', icon: 'attendance', show: (c) => c('attendance.view') || c('attendance.manage') },
      { to: '/grades', label: 'Grades', icon: 'grades', show: (c) => c('grade.view') || c('assessment.view') },
      {
        to: '/evaluations',
        label: 'Evaluations',
        icon: 'evaluation',
        show: (c) => c('evaluation.view') || c('evaluation.submit') || c('evaluation.config') || c('evaluation.result') || c('evaluation.analyze'),
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/finance', label: 'Finance', icon: 'finance', show: (c) => c('finance.view') },
      { to: '/documents', label: 'Documents', icon: 'documents', show: (c) => c('document.view') || c('document.generate') },
      {
        to: '/announcements',
        label: 'Announcements',
        icon: 'announcements',
        show: (c) => c('announcement.view') || c('announcement.manage'),
      },
      { to: '/reports', label: 'Reports', icon: 'reports', show: (c) => c('report.view') },
    ],
  },
];

export function NavList({ collapsed }: { collapsed: boolean }) {
  const { can, isRole, user } = useAuth();
  const navigate = useNavigate();
  const isStudent = isRole('student');

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => i.show(can, isStudent, { username: user?.username ?? '' })),
      })).filter((g) => g.items.length > 0),
    [can, isStudent, user],
  );

  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="nav-group">
          <div className={`nav-group-title ${collapsed ? 'hidden-in-collapse' : ''}`}>{group.title}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              onKeyDown={(e) => {
                if (collapsed && (e.key === 'Enter' || e.key === ' ')) navigate(item.to);
              }}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} className="nav-ico" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </>
  );
}

export function Sidebar({ collapsed, onToggle, open, onClose }: {
  collapsed: boolean;
  onToggle: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {open && <div className="mobile-scrim" onClick={onClose} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="emblem">
            <Icon name="graduationCap" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">USMS</span>
            <span className="sidebar-brand-sub">University System</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavList collapsed={collapsed} />
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(user?.username ?? 'U')}</div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className="user-role">
                {(user?.roleName ?? '').replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <div className="row-between">
            <button
              type="button"
              className="sidebar-collapse"
              onClick={onToggle}
              title={collapsed ? 'Expand menu' : 'Collapse menu'}
            >
              {collapsed ? <Icon name="panelLeft" /> : <Icon name="chevronsLeft" />}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#c6cbdb' }}
              onClick={() => {
                if (isRole('student')) {
                  navigate('/students/me');
                } else {
                  logout();
                }
              }}
            >
              <Icon name={isRole('student') ? 'profile' : 'logout'} style={{ width: 14, height: 14 }} />
              {isRole('student') ? 'My Profile' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const ROUTE_META: Array<{ match: string; title: string; crumb: string[] }> = [
  { match: '/students/me', title: 'My Profile', crumb: ['Academic Operations', 'My Profile'] },
  { match: '/students', title: 'Student Management', crumb: ['Academic Operations', 'Students'] },
  { match: '/academics', title: 'Academic Management', crumb: ['Academic Operations', 'Academics'] },
  { match: '/courses', title: 'Courses & Curriculum', crumb: ['Academic Operations', 'Courses'] },
  { match: '/enrollment', title: 'Course Enrollment', crumb: ['Academic Operations', 'Enrollment'] },
  { match: '/staff', title: 'Staff & Lecturers', crumb: ['Academic Operations', 'Staff'] },
  { match: '/timetable', title: 'Timetable & Scheduling', crumb: ['Academic Operations', 'Timetable'] },
  { match: '/attendance', title: 'Attendance', crumb: ['Academic Operations', 'Attendance'] },
  { match: '/grades', title: 'Examinations & Grades', crumb: ['Academic Operations', 'Grades'] },
  { match: '/evaluations', title: 'Lecturer & Course Evaluation', crumb: ['Academic Operations', 'Evaluations'] },
  { match: '/finance', title: 'Finance & Fees', crumb: ['Administration', 'Finance'] },
  { match: '/documents', title: 'Documents', crumb: ['Administration', 'Documents'] },
  { match: '/announcements', title: 'Announcements', crumb: ['Administration', 'Announcements'] },
  { match: '/reports', title: 'Reports', crumb: ['Administration', 'Reports'] },
];

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user, logout, isRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const meta = ROUTE_META.find((r) => location.pathname.startsWith(r.match)) ?? {
    match: '/',
    title: 'Dashboard',
    crumb: ['Main', 'Dashboard'],
  };

  let output: ReactNode = meta.title;
  let isDashboard = false;
  if (location.pathname === '/' || location.pathname === '') {
    isDashboard = true;
  }
  if ((location.pathname.startsWith('/students/') && location.pathname !== '/students' && location.pathname !== '/students/me')) {
    output = 'Student Profile';
    meta.crumb = ['Academic Operations', 'Students', 'Profile'];
  }

  return (
    <header className="topbar">
      <button type="button" className="hamburger" onClick={onOpenSidebar} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      {!isDashboard ? (
        <div>
          <h1>{output}</h1>
          <div className="breadcrumbs">
            {meta.crumb.map((c, i) => (
              <span key={c}>
                {i > 0 && <Icon name="chevronRight" style={{ width: 11, height: 11, verticalAlign: -1 }} />}
                <span className={i === meta.crumb.length - 1 ? 'crumb-current' : 'crumb'}>{c}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {greeting()}
            {user && <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>, {user.username}</span>}
          </h1>
          <div className="breadcrumbs">{today()}</div>
        </div>
      )}

      <div className="topbar-spacer" />

      <GlobalSearch />

      <NotificationBell />

      <div className="profile-menu">
        <button type="button" className="profile-btn" onClick={() => setMenuOpen((s) => !s)}>
          <div className="avatar">{initials(user?.username ?? 'U')}</div>
          <div className="profile-btn-meta">
            <div className="profile-btn-name">{user?.username}</div>
            <div className="profile-btn-role">{(user?.roleName ?? '').replace(/_/g, ' ')}</div>
          </div>
        </button>
        {menuOpen && (
          <div className="dropdown">
            <div className="dropdown-header">{user?.username}</div>
            <button type="button" className="dropdown-item" onClick={() => { setMenuOpen(false); navigate(isRole('student') ? '/students/me' : '/'); }}>
              <Icon name="profile" /> My account
            </button>
            <div className="dropdown-divider" />
            <button type="button" className="dropdown-item danger" onClick={logout}>
              <Icon name="logout" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1200);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    if (window.innerWidth < 768) return;
    setCollapsed((s) => !s);
  };

  return (
    <div className="shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="main">
        <Topbar onOpenSidebar={() => setOpen(true)} />
        <main className="content">
          <div className="page" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}