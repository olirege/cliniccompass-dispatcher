import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { LoginSchema } from '../schemas/LoginSchema';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
export default function LoginView(props) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (validateCreds()) {
            try {
                const user = await signInWithEmailAndPassword(getAuth(),email, password)
                console.log('handleSubmit user', user)
                navigate('/dashboard');
            } catch (error) {
                setError('Invalid email or password');
                return;
            }
        }
        return;
    }
    
    const validateCreds = () => {
        const { error } = LoginSchema.validate({ email, password });
        if (error) {
            setError(error.message);
            return false;
        } else {
            return true;
        }
    }
    return (
        <div className='h-screen flex flex-col items-center justify-center gap-2'>
            <h1 className="text-red-400 font-bold">{error}</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className='border rounded-md p-2' placeholder="Email"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className='border rounded-md p-2' placeholder="Password"/>
                <button className="bg-purple-200 text-purple-400 p-2 rounded-md hover:bg-purple-400 font-bold hover:text-purple-200  transition ease-in-out">Login</button>
            </form>
            <h2 onClick={() => navigate('/signup')} className="italic">No account? <span className="font-bold not-italic hover:underline decoration-4">Sign up here</span></h2>
        </div>
    )
}   