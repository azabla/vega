import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/auth/AuthProvider"
import { GuestOnly } from "@/auth/guards"
import { Home } from "./pages/Home"
import { NotFound } from "./pages/NotFound"
import { ProjectArchive } from "./pages/ProjectArchive"
import { ProjectDetail } from "./pages/ProjectDetail"
import { Login, Register } from "./pages/auth/AuthPages"
import { Toaster } from "@/components/ui/toaster";

const DashboardApp = lazy(() => import("./dashboard/DashboardApp"))

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />}></Route>
          <Route path="projects" element={<ProjectArchive />}></Route>
          <Route path="projects/:slug" element={<ProjectDetail />}></Route>
          <Route path="u/:username" element={<Home />}></Route>
          <Route path="u/:username/projects" element={<ProjectArchive />}></Route>
          <Route path="u/:username/projects/:slug" element={<ProjectDetail />}></Route>
          <Route path="login" element={<GuestOnly><Login /></GuestOnly>}></Route>
          <Route path="register" element={<GuestOnly><Register /></GuestOnly>}></Route>
          <Route
            path="dashboard/*"
            element={
              <Suspense fallback={null}>
                <DashboardApp />
              </Suspense>
            }
          ></Route>
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
