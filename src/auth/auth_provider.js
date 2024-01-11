import React, { useEffect, useState, createContext } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, user => {
            console.log('AuthProvider onAuthStateChanged user', user)
            setCurrentUser(user);
            navigate('/dashboard', { replace: true });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);
    
    if (loading) {
        return <div>Loading...</div>; // Or any loading spinner
    }

    return (
        <AuthContext.Provider value={{ currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
