import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/** { status: "loading" | "authenticated" | "anonymous", user, login, register, logout, setUser } */
export const useAuth = () => {
    const auth = useContext(AuthContext);
    if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
    return auth;
};
