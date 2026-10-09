import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/context";

const FullPageSpinner = () => (
  <div className="flex min-h-dvh items-center justify-center" aria-busy="true" aria-label="Loading">
    <Loader2 className="size-6 animate-spin text-muted-foreground" />
  </div>
);

/** Only signed-in users; others go to /login and come back afterwards. */
export const RequireAuth = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageSpinner />;
  if (status === "anonymous") {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
};

// Only same-site paths, so ?next= can't send someone to another website
const safeNext = (search) => {
  const next = new URLSearchParams(search).get("next");
  return next && /^\/(?![/\\])/.test(next) ? next : "/dashboard";
};

/** Login/register pages: once signed in, continue to ?next= or the dashboard. */
export const GuestOnly = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageSpinner />;
  if (status === "authenticated") return <Navigate to={safeNext(location.search)} replace />;
  return children;
};
