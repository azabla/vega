import { useEffect, useState } from "react";
import { portfolioAPI } from "@/services/portfolioAPI";


export const useProfile = () => {

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const response = await portfolioAPI.getProfile();

                setProfile(response.data);

            } catch(error) {

                console.error(error);

                setError(error);

            } finally {

                setLoading(false);

            }

        };


        fetchProfile();


    }, []);


    return {
        profile,
        loading,
        error,
    };

};