import type { ReactNode } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { ErrorBoundary, Spinner } from './components/ui';
import Academics from './pages/Academics';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import ChangePassword from './pages/ChangePassword';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import EnrollmentPage from './pages/Enrollment';
import Finance from './pages/Finance';
import Grades from './pages/Grades';
import Login from './pages/Login';
import Reports from './pages/Reports';
import StaffPage from './pages/Staff';
import StudentDetail from './pages/StudentDetail';
import Students from './pages/Students';
import Timetable from './pages/Timetable';

function NavItem({ to, label, show }: { to: string; label: string; show: boolean }) {
  if (!show) return null;
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {label}
    </NavLink>
  );
}

function Layout() {
  const { user, logout, can, isRole } = useAuth();
  const isStudent = isRole('student');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">USMS</span>
          <span>University System</span>
        </div>
        <nav className="nav">
          <NavItem to="/" label="Dashboard" show />
          {isStudent && <NavItem to="/students/me" label="My Profile" show />}
          <NavItem to="/students" label="Students" show={can('student.view')} />
          <NavItem to="/academics" label="Academics" show={can('academic.view') || can('curriculum.view')} />
          <NavItem to="/courses" label="Courses" show={can('course.view') || can('curriculum.view')} />
          <NavItem to="/staff" label="Staff" show={can('staff.view')} />
          <NavItem to="/enrollment" label="Enrollment" show={can('enrollment.view')} />
          <NavItem to="/timetable" label="Timetable" show={can('timetable.view')} />
          <NavItem to="/attendance" label="Attendance" show={can('attendance.view')} />
          <NavItem to="/grades" label="Grades" show={can('grade.view') || can('assessment.view')} />
          <NavItem to="/finance" label="Finance" show={can('finance.view')} />
          <NavItem to="/reports" label="Reports" show={can('report.view')} />
          <NavItem to="/announcements" label="Announcements" show={can('announcement.view') || can('announcement.manage')} />
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.roleName}</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="boot">
      <Spinner />
    </div>
  );
}

function Protected() {
  const { token, user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Layout />;
}

export default function App(): ReactNode {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/" element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/me" element={<StudentDetail />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="academics" element={<Academics />} />
        <Route path="courses" element={<Courses />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="enrollment" element={<EnrollmentPage />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="grades" element={<Grades />} />
        <Route path="finance" element={<Finance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}