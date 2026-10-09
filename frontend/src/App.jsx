import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/auth/AuthProvider"
import { GuestOnly } from "@/auth/guards"
import { PageGate } from "@/components/PageGate"
import { Toaster } from "@/components/ui/toaster"
import { Home } from "./pages/Home"
import { NotFound } from "./pages/NotFound"
import { Login, Register } from "./pages/auth/AuthPages"

// Home loads with the app; every other page is its own chunk
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))
const ProjectArchive = page(() => import("./pages/ProjectArchive"), "ProjectArchive")
const ProjectDetail = page(() => import("./pages/ProjectDetail"), "ProjectDetail")
const Experience = page(() => import("./pages/Experience"), "Experience")
const Skills = page(() => import("./pages/Skills"), "Skills")
const About = page(() => import("./pages/About"), "About")
const Resume = page(() => import("./pages/Resume"), "Resume")
const Contact = page(() => import("./pages/Contact"), "Contact")
const DashboardApp = lazy(() => import("./dashboard/DashboardApp"))

// [path, element, page key in settings.pages]
const PORTFOLIO_ROUTES = [
  ["", <Home />],
  ["projects", <ProjectArchive />, "projects"],
  ["projects/:slug", <ProjectDetail />, "projects"],
  ["experience", <Experience />, "experience"],
  ["skills", <Skills />, "skills"],
  ["about", <About />, "about"],
  ["resume", <Resume />, "resume"],
  ["contact", <Contact />, "contact"],
]

const gated = (element, key) => (key ? <PageGate page={key}>{element}</PageGate> : element)

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            {PORTFOLIO_ROUTES.map(([path, element, key]) => (
              <Route key={`root-${path}`} path={path || undefined} index={!path} element={gated(element, key)} />
            ))}
            {PORTFOLIO_ROUTES.map(([path, element, key]) => (
              <Route key={`u-${path}`} path={`u/:username${path ? `/${path}` : ""}`} element={gated(element, key)} />
            ))}
            <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="dashboard/*" element={<DashboardApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
