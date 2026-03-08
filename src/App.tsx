import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonPlayer from "./pages/LessonPlayer";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import CreateCourse from "./pages/CreateCourse";
import Checkout from "./pages/Checkout";
import Certificate from "./pages/Certificate";
import Profile from "./pages/Profile";
import BecomeInstructor from "./pages/BecomeInstructor";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/courses/:id" element={<CourseDetail />} />
    <Route path="/courses/:id/learn/:lessonId" element={
      <ProtectedRoute><LessonPlayer /></ProtectedRoute>
    } />
    <Route path="/checkout/:courseId" element={
      <ProtectedRoute><Checkout /></ProtectedRoute>
    } />
    <Route path="/certificate/:courseId" element={
      <ProtectedRoute><Certificate /></ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute><Profile /></ProtectedRoute>
    } />
    <Route path="/become-instructor" element={
      <ProtectedRoute><BecomeInstructor /></ProtectedRoute>
    } />
    <Route path="/dashboard/student" element={
      <ProtectedRoute roles={['student', 'admin']}><StudentDashboard /></ProtectedRoute>
    } />
    <Route path="/dashboard/instructor" element={
      <ProtectedRoute roles={['instructor', 'admin']}><InstructorDashboard /></ProtectedRoute>
    } />
    <Route path="/dashboard/admin" element={
      <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
    } />
    <Route path="/instructor/create-course" element={
      <ProtectedRoute roles={['instructor', 'admin']}><CreateCourse /></ProtectedRoute>
    } />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

function DashboardRedirect() {
  const { profile } = useAuth();
  const path = profile?.role === 'admin' ? '/dashboard/admin'
    : profile?.role === 'instructor' ? '/dashboard/instructor'
    : '/dashboard/student';
  return <Navigate to={path} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
