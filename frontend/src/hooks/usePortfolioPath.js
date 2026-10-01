import { useParams } from "react-router-dom";

// Base path for links inside a portfolio: "" on /, "/u/<username>" on /u/<username>/...
export const usePortfolioPath = () => {
    const { username } = useParams();
    return username ? `/u/${username}` : "";
};
