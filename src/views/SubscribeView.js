import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { getDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SignupSchema, InvitationCodeSchema } from '../schemas/SignupSchema';
import { useNavigate } from 'react-router-dom';
import { callableFunction } from '../utils/cloudfunctions';
export default function SubscribeView() {
    const [ email, setEmail ] = useState('');
    const [ showCreateUserForm, setShowCreateUserForm ] = useState(false);
    const [ password, setPassword ] = useState('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ loading, setLoading ] = useState('');
    const [ inviteCode , setInviteCode ] = useState('');
    const [ error, setError ] = useState(null);
    const navigate = useNavigate();
    const validateInvitation = async () => {
        console.log('validateInvitation')
        const { error } = InvitationCodeSchema.validate({ code: inviteCode });
        if (error) {
            console.log('validateInvitation error', error.message)
            setError(error.message);
            return false;
        }
        try {
            const invite =  await getDoc(doc(collection(db, 'invites'), inviteCode));
            console.log('validateInvitation invite', invite)
            if (!invite.exists) {
                console.log('validateInvitation invite does not exist')
                setError('Invalid invitation code');
                return false;
            }
            if (invite.data().used) {
                console.log('validateInvitation invite used')
                setError('Invitation code already used');
                return false;
            }
            console.log('validateInvitation valid')
            return true;
        } catch (error) {
            console.log('validateInvitation error', error.message)
            setError(error.message);
            return false;
        }
    }

    const onCreateUser = async () => {
        try {
            const user = await createUserWithEmailAndPassword(getAuth(), email, password);
            console.log('onCreateUser user created', user)
            return user;
        } catch (error) {
            setError(error.message);
        }
    }

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const valid = await validateInvitation();
        if (valid) {
            console.log('handleInviteSubmit valid invite')
            setShowCreateUserForm(true);
        }
    }
    const handleCreateUserSubmit = async (e) => {
        console.log('handleCreateUserSubmit')
        e.preventDefault();
        setError(null);
        const { error } = SignupSchema.validate({ email, password, confirmPassword });
        if (error) {
            setError(error.message);
            return;
        }
        const user = await onCreateUser();
        if (user) {
            try {
                // consume invite
                const inviteRef = doc(collection(db, 'invites'), inviteCode);
                await setDoc(inviteRef,{
                    used:true,
                    usedBy: user.user.uid
                });
                // set role
                const { func } = callableFunction({
                    funcName:'set_employee_role',
                    input:null,
                    setLoading:setLoading,
                    onSuccess: ()=>{},
                    onError:(e) => {console.log(e)}
                })
                const resp = await func();
                if(resp && resp.data?.status === 200) {
                    console.log("Role set")
                    navigate('/dashboard')
                } else {
                    setError('Failed to set role')
                    return;
                }
            } catch (error) {
                setError(error.message);
                return;
            }
        }
    }
    if (!showCreateUserForm) {
        return (
            <div className='h-screen flex flex-col items-center justify-center gap-2'>
                BFg5JoH2sq9uONHCNUvi
                <h1 className="text-red-400 font-bold">{error}</h1>
                <form onSubmit={handleInviteSubmit} className="flex flex-col gap-2">
                    <label>Enter invitation code</label>
                    <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className='border rounded-md p-2'/>
                    <button type='submit' className="bg-purple-200 text-purple-400 p-2 rounded-md hover:bg-purple-400 font-bold hover:text-purple-200  transition ease-in-out">Validate</button>
                </form>
                <h2 onClick={() => navigate('/login')} className="italic">Already have an account? <span className="font-bold not-italic hover:underline decoration-4">Login here</span></h2>
            </div>
        );
    } else {
        return (
            <div className='h-screen flex flex-col items-center justify-center gap-2'>
                <h1 className="text-red-400 font-bold">{error}</h1>
                <form onSubmit={handleCreateUserSubmit} className="flex flex-col gap-2">
                    <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' className='border rounded-md p-2'/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className='border rounded-md p-2'/>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className='border rounded-md p-2'/>
                    <button type='submit' className="bg-purple-200 text-purple-400 p-2 rounded-md hover:bg-purple-400 font-bold hover:text-purple-200  transition ease-in-out">Create account</button>
                </form>
                <p>
                    {loading ? "...loading" : ''}
                </p>
                <h2 onClick={() => navigate('/login')} className="italic">Already have an account? <span className="font-bold not-italic hover:underline decoration-4">Login here</span></h2>
            </div>
        )
    }
}
