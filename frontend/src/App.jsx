import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { AuthProvider } from "@/auth/AuthProvider"
import { GuestOnly } from "@/auth/guards"
import { PageGate } from "@/components/PageGate"
import { Toaster } from "@/components/ui/toaster"
import { ROOT_USERNAME, mainSiteUrl } from "@/lib/site"
import { useSite } from "@/site/context"
import { SiteProvider } from "@/site/SiteProvider"
import { Home } from "./pages/Home"
import { NotFound, UnknownDomain } from "./pages/NotFound"
import { Login, Register } from "./pages/auth/AuthPages"

// Home loads with the app; every other page is its own chunk
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))
const Landing = page(() => import("./pages/Landing"), "Landing")
const ProjectArchive = page(() => import("./pages/ProjectArchive"), "ProjectArchive")
const ProjectDetail = page(() => import("./pages/ProjectDetail"), "ProjectDetail")
const Experience = page(() => import("./pages/Experience"), "Experience")
const Skills = page(() => import("./pages/Skills"), "Skills")
const About = page(() => import("./pages/About"), "About")
const Achievements = page(() => import("./pages/Achievements"), "Achievements")
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
  ["achievements", <Achievements />, "achievements"],
  ["about", <About />, "about"],
  ["resume", <Resume />, "resume"],
  ["contact", <Contact />, "contact"],
]

const gated = (element, key) => (key ? <PageGate page={key}>{element}</PageGate> : element)

// The portfolio at the root of this host, and every portfolio under /u/<username>
const rootPortfolioRoutes = () =>
  PORTFOLIO_ROUTES.map(([path, element, key]) => (
    <Route key={`root-${path}`} path={path || undefined} index={!path} element={gated(element, key)} />
  ))
const userPortfolioRoutes = () =>
  PORTFOLIO_ROUTES.map(([path, element, key]) => (
    <Route key={`u-${path}`} path={`u/:username${path ? `/${path}` : ""}`} element={gated(element, key)} />
  ))

// Accounts live on the main site, so a portfolio's own address sends login and dashboard there
const ToMainSite = () => {
  const { pathname, search } = useLocation()
  useEffect(() => window.location.replace(mainSiteUrl(pathname + search)), [pathname, search])
  return null
}

const SiteRoutes = () => {
  const site = useSite()
  if (site.kind === "loading") return null
  if (site.kind === "unknown") return <UnknownDomain />

  if (site.kind === "portfolio") {
    return (
      <Routes>
        {rootPortfolioRoutes()}
        {userPortfolioRoutes()}
        <Route path="login" element={<ToMainSite />} />
        <Route path="register" element={<ToMainSite />} />
        <Route path="dashboard/*" element={<ToMainSite />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* the main site: the product's landing page, unless it hosts one person's portfolio */}
      {ROOT_USERNAME ? rootPortfolioRoutes() : <Route index element={<Landing />} />}
      {userPortfolioRoutes()}
      <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="dashboard/*" element={<DashboardApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <SiteProvider>
          <Suspense fallback={null}>
            <SiteRoutes />
          </Suspense>
        </SiteProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
