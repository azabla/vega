import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

// Development only (docs/15): try portfolio subdomains and custom domains locally.
//   VITE_DEV_PROXY=http://127.0.0.1:8001  serve /api and /media through Vite, keeping the Host header,
//                                         so hana.localhost:5173 works without CORS (use VITE_API_URL=/api)
//   VITE_DEV_HOSTS=.test,hana.example     extra hostnames the dev server answers (*.localhost always works)
const devProxy = process.env.VITE_DEV_PROXY;
const devHosts = process.env.VITE_DEV_HOSTS?.split(",").filter(Boolean);

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    ...(devHosts?.length ? { allowedHosts: devHosts } : {}),
    ...(devProxy ? { proxy: { "/api": devProxy, "/media": devProxy } } : {}),
  },
})
