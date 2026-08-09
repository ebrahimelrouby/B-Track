import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./auth/PrivateRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ExerciseList from "./pages/exercises/ExerciseList";
import ExerciseDetail from "./pages/exercises/ExerciseDetail";
import ExerciseCreate from "./pages/exercises/ExerciseCreate";
import ExerciseEdit from "./pages/exercises/ExerciseEdit";
import QualityReview from "./pages/exercises/QualityReview";
import BulkEdit from "./pages/exercises/BulkEdit";
import DuplicateReview from "./pages/exercises/DuplicateReview";
import ImportWizard from "./pages/import/ImportWizard";
import ImportHistory from "./pages/import/ImportHistory";
import MediaManager from "./pages/media/MediaManager";
import TranslationManager from "./pages/translations/TranslationManager";
import AuditLog from "./pages/audit/AuditLog";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground mt-2">Admin role required</p>
              <a href="/login" className="text-primary underline mt-4 block">Back to Login</a>
            </div>
          </div>
        } />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exercises" element={<ExerciseList />} />
            <Route path="/exercises/create" element={<ExerciseCreate />} />
            <Route path="/exercises/quality" element={<QualityReview />} />
            <Route path="/exercises/bulk-edit" element={<BulkEdit />} />
            <Route path="/exercises/duplicates" element={<DuplicateReview />} />
            <Route path="/exercises/:id" element={<ExerciseDetail />} />
            <Route path="/exercises/:id/edit" element={<ExerciseEdit />} />
            <Route path="/import" element={<ImportWizard />} />
            <Route path="/import/history" element={<ImportHistory />} />
            <Route path="/media" element={<MediaManager />} />
            <Route path="/translations" element={<TranslationManager />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
