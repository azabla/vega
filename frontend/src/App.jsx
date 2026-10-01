import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Home } from "./pages/Home"
import { NotFound } from "./pages/NotFound"
import { ProjectArchive } from "./pages/ProjectArchive"
import { ProjectDetail } from "./pages/ProjectDetail"
import { Toaster } from "@/components/ui/toaster";



function App() {
  

  return (
    <>
    <Toaster />
     <BrowserRouter>
      <Routes>
        <Route index element={<Home />}></Route>
        <Route path="projects" element={<ProjectArchive />}></Route>
        <Route path="projects/:slug" element={<ProjectDetail />}></Route>
        <Route path="u/:username" element={<Home />}></Route>
        <Route path="u/:username/projects" element={<ProjectArchive />}></Route>
        <Route path="u/:username/projects/:slug" element={<ProjectDetail />}></Route>
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
     </BrowserRouter>
     
    </>
  )
}

export default App
