import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Spinner } from './components/ui';
import AppShell from './components/AppShell';
import Academics from './pages/Academics';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import ChangePassword from './pages/ChangePassword';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import EnrollmentPage from './pages/Enrollment';
import Evaluations from './pages/Evaluations';
import Finance from './pages/Finance';
import Grades from './pages/Grades';
import Login from './pages/Login';
import Reports from './pages/Reports';
import StaffPage from './pages/Staff';
import StudentDetail from './pages/StudentDetail';
import Students from './pages/Students';
import Timetable from './pages/Timetable';

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
  return (
    <AppShell>
      <Routes>
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
        <Route path="documents" element={<Documents />} />
        <Route path="evaluations" element={<Evaluations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AppShell>
  );
}

export default function App(): ReactNode {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="*" element={<Protected />} />
    </Routes>
  );
}