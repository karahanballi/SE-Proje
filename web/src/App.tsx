import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import SebGate from "./components/SebGate";

const Login = lazy(() => import("./pages/Login"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Quiz = lazy(() => import("./pages/Quiz"));
const AdminCourses = lazy(() => import("./pages/AdminCourses"));
const AdminQuizEditor = lazy(() => import("./pages/AdminQuizEditor"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute>
              <SebGate>
                <Quiz />
              </SebGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/quizzes/:courseId"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminQuizEditor />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
