import { useEffect, useState } from "react";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";


export const useProfile = () => {

    const username = usePortfolioUsername();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const response = await portfolioAPI.getProfile(username);

                setProfile(response.data);

            } catch(error) {

                console.error(error);

                setError(error);

            } finally {

                setLoading(false);

            }

        };


        fetchProfile();


    }, [username]);


    return {
        profile,
        loading,
        error,
    };

};