import { Link } from "react-router-dom";

export const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground px-4 text-center">
            <p className="text-6xl font-bold text-primary">404</p>
            <p className="text-muted-foreground">This page doesn't exist.</p>
            <Link to="/" className="cosmic-button">Go home</Link>
        </div>
    );
};
