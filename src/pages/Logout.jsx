import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    useEffect(() => {
        // 1. Manually Clear EVERYTHING (Nuclear Option)
        localStorage.clear();    // Wipes 'user', 'token', 'jwt_token' all at once
        sessionStorage.clear();  // Wipes any session data

        // 2. Force Hard Reload immediately
        // usage of 'replace' prevents the user from clicking 'Back' to return
        window.location.replace('/login');
    }, []);

    return <div>Logging out...</div>;
};

export default Logout;
