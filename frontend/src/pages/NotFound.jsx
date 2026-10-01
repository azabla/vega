import { Link } from "react-router-dom";

export const NotFound = () => {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
            <p className="relative font-mono text-sm text-primary">404</p>
            <h1 className="relative text-4xl font-semibold tracking-tight">Page not found</h1>
            <p className="relative text-muted-foreground">The page you're looking for doesn't exist.</p>
            <Link
                to="/"
                className="relative mt-2 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
                Go home
            </Link>
        </div>
    );
};
