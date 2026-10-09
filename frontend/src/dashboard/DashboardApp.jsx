import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { RequireAuth } from "@/auth/guards";
import { DashboardLayout } from "@/dashboard/DashboardLayout";
import { AccountPage, MessagesPage, OverviewPage } from "@/dashboard/pages/AccountPages";
import {
  AboutPage,
  CertificatesPage,
  EducationPage,
  ExperiencePage,
  LanguagesPage,
  ProfilePage,
  SkillsPage,
  TestimonialsPage,
} from "@/dashboard/pages/ProfilePages";
import { AppearancePage } from "@/dashboard/pages/AppearancePage";
import { ProjectEditorPage, ProjectsPage } from "@/dashboard/pages/ProjectPages";

// A fresh editor per project, so state never leaks between projects
const ProjectEditorRoute = () => {
  const { id } = useParams();
  return <ProjectEditorPage key={id} />;
};

// Mounted at /dashboard/* and lazy-loaded, so portfolio visitors never download it
export default function DashboardApp() {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="appearance" element={<AppearancePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectEditorRoute />} />
          <Route path="experience" element={<ExperiencePage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="languages" element={<LanguagesPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </RequireAuth>
  );
}
