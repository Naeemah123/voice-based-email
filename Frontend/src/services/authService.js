import axios from "axios";

export const checkAuth = () => {
    return axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/fetch_user`,
        { withCredentials: true }
    );
};