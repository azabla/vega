import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { RequireAuth } from "@/auth/guards";
import { DashboardLayout } from "@/dashboard/DashboardLayout";
import { AccountPage, MessagesPage, OverviewPage } from "@/dashboard/pages/AccountPages";
import {
  AboutPage,
  AchievementsPage,
  CertificatesPage,
  EducationPage,
  ExperiencePage,
  LanguagesPage,
  ProfilePage,
  SkillsPage,
  TestimonialsPage,
} from "@/dashboard/pages/ProfilePages";
import { AppearancePage } from "@/dashboard/pages/AppearancePage";
import { DomainPage } from "@/dashboard/pages/DomainPage";
import { WelcomePage } from "@/dashboard/pages/WelcomePage";
import { CVListPage } from "@/dashboard/pages/CVPages";
import { ListSkeleton } from "@/dashboard/components/Page";
import { ProjectEditorPage, ProjectsPage } from "@/dashboard/pages/ProjectPages";

// The CV editor brings the rich-text editor; only load it when it's opened
const CVEditorPage = lazy(() => import("@/dashboard/pages/CVEditorPage").then((m) => ({ default: m.CVEditorPage })));

// A fresh editor per project, so state never leaks between projects
const ProjectEditorRoute = () => {
  const { id } = useParams();
  return <ProjectEditorPage key={id} />;
};

const CVEditorRoute = () => {
  const { id } = useParams();
  return (
    <Suspense fallback={<ListSkeleton rows={5} />}>
      <CVEditorPage key={id} />
    </Suspense>
  );
};

// Mounted at /dashboard/* and lazy-loaded, so portfolio visitors never download it
export default function DashboardApp() {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="appearance" element={<AppearancePage />} />
          <Route path="cv" element={<CVListPage />} />
          <Route path="cv/:id" element={<CVEditorRoute />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectEditorRoute />} />
          <Route path="experience" element={<ExperiencePage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="languages" element={<LanguagesPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="domain" element={<DomainPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </RequireAuth>
  );
}
