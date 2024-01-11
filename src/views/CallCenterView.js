import { useState, useEffect, useCallback } from 'react';
import { subscribeToQuery, callableFunction } from '../utils/cloudfunctions';
import { query, collectionGroup, where } from '@firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
export default function CallCenter() {
    const [queue, setQueue] = useState([])
    const [loading, setLoading] = useState(false)
    const [unsubscribe, setUnsubscribe] = useState(null)
    const [isLive, setIsLive] = useState(false)
    const acceptCallsCallableContext = {
        funcName: 'employee_accept_calls',
        input: null,
        setLoading,
        onSuccess: () => console.log('acceptCalls onSuccess'),
        onError: (e) => console.log('acceptCalls onError', e),
    }
    const navigate = useNavigate();
    const acceptsCallCallableContext = {
        funcName: 'employee_accepts_call',
        input: null,
        setLoading,
        onSuccess: (data) => {
            console.log('acceptCall onSuccess',data);
            if (data.data.context.type === "video") {
                console.log('on video',data)
                const token = data.data.context.host_token;
                const channel = data.data.context.channel;
                const appId = data.data.context.appId;
                const uid = data.data.context.employee_id;
                navigate('/videocall',{ state: { context:[ appId, channel, token, uid]  } });
            } else if (data.data.context.type === "chat") {
                console.log('on chat',data)
                const channel = data.data.context.channel;
                const employeeId = data.data.context.employee_id;
                const userId = data.data.context.user_id;
                navigate('/chat',{ state: { context:[ channel, employeeId, userId]  } });
            }
        },
        onError: (e) => console.log('acceptCall onError', e),
    }
    const rejectsCallCallableContext = {
        funcName: 'employee_rejects_call',
        input: null,
        setLoading,
        onSuccess: (data) => console.log('rejectCall onSuccess', data),
        onError: (e) => console.log('rejectCall onError', e),
    }
    const subContext = {
        query: query(collectionGroup(db, 'jobs'), where('parentId', '==', getAuth().currentUser.uid)),
        callback: (data) => {
            setLoading(true)
            console.log('CallCenterView subscribeToDocument data', data)
            if (data) {
                setQueue(data || [])
            } else {
                setQueue([])
            }
            setLoading(false)
        }
    }
    const onAcceptCalls = async () => {
        if (isLive) return
        const { func } = callableFunction(acceptCallsCallableContext)
        try {
            await func()
            console.log('onAcceptCalls');
            const newUnsubscribe = subscribeToQuery(subContext);
            setUnsubscribe(() => newUnsubscribe)
            setIsLive(true)
        } catch (e) {
            console.log('acceptCalls error', e)
            return;
        }
    }
    const onRefuseCalls = useCallback(async () => {
        if (!isLive) return
        const rejectCallsCallableContext = {
            funcName: 'employee_reject_calls',
            input: null,
            setLoading,
            onSuccess: () => console.log('rejectCalls onSuccess'),
            onError: (e) => console.log('rejectCalls onError', e),
        }
        try {
            const { func } = callableFunction(rejectCallsCallableContext)
            await func()
            console.log('onRefuseCalls');
            if (unsubscribe) {
                unsubscribe()
                setUnsubscribe(null);
            }
            setIsLive(false)
            setQueue([])
        } catch (e) {
            console.log('rejectCalls error', e)
            return;
        }
    },[isLive, unsubscribe])
    const onAcceptCall = async (job) => {
        if (!isLive) return
        try {
            acceptsCallCallableContext.input = job
            const { func } = callableFunction(acceptsCallCallableContext)
            await func()
        } catch (e) {
            console.log('acceptCalls error', e)
            return;
        }
    }
    const onRefuseCall = async (job) => {
        if (!isLive) return
        try {
            rejectsCallCallableContext.input = job
            const { func } = callableFunction(rejectsCallCallableContext)
            await func()
        } catch (e) {
            console.log('rejectCalls error', e)
            return;
        }
    }
    useEffect(() => {
        return () => { if (unsubscribe) { unsubscribe(); console.log('unsubscribed') } }
    }, [unsubscribe]);
    
    // useEffect(() => {
    //     let inactivityTimer;
      
    //     const resetTimer = () => {
    //       clearTimeout(inactivityTimer);
    //       inactivityTimer = setTimeout(() => {
    //         onRefuseCalls(); // Call refuseCalls after inactivity
    //       }, 60000); // Set time of inactivity (e.g., 60 seconds)
    //     };
      
    //     window.addEventListener('mousemove', resetTimer);
    //     window.addEventListener('keydown', resetTimer);
      
    //     resetTimer(); // Initialize timer on component mount
      
    //     return () => {
    //       clearTimeout(inactivityTimer);
    //       window.removeEventListener('mousemove', resetTimer);
    //       window.removeEventListener('keydown', resetTimer);
    //     };
    // }, [onRefuseCalls]);
    
    // useEffect(() => {
    //     const handleTabClose = (event) => {
    //         onRefuseCalls(); // Call refuseCalls when the tab is closed
    //     };
    //     window.addEventListener('beforeunload', handleTabClose);
        
    //     return () => {
    //         window.removeEventListener('beforeunload', handleTabClose);
    //     };
    // }, [onRefuseCalls]);
    return (
        <div className="max-h-full max-w-full">
            <div className="flex w-full justify-between h-8 items-center bg-purple-600 px-2">
                <h1 className="font-2xl font-bold">Call Center</h1>
                {loading ? <p>Loading...</p> : null}
            </div>
            <div className="grid grid-cols-3">
                <div className="col-span-1">
                    {!isLive &&
                        <div className="h-full flex justify-center items-center bg-green-200" onClick={onAcceptCalls}>
                            <h1>Accept calls</h1>
                        </div>
                    }
                    {isLive &&
                        <div className="h-full flex justify-center items-center bg-red-200" onClick={onRefuseCalls}>
                            <h1>Refuse calls</h1>
                        </div>
                    }
                </div>
                <div className="col-span-2">
                    <div className="flex justify-start items-center pl-2 bg-purple-200 h-8">
                        <h2 className="font-bold">Call Queue</h2>
                    </div>
                    <div className="relative h-full overflow-auto">
                        {!isLive &&
                            <div className="absolute top-0 left-0 bg-slate-700/20 z-2 w-full" />
                        }
                        <div>
                            {
                                queue.map((job, index) => (
                                    <div key={index} className="p-2 m-2">
                                        <p>Job ID: {job.id}</p>
                                        <p>Job PARENTID: {job.parentId}</p>
                                        <p>type: {job.type}</p>
                                        <div className="flex flex-row gap-2">
                                            <button className="bg-green-200" onClick={()=>onAcceptCall(job)}>
                                                Accept
                                            </button>
                                            <button className="bg-red-200" onClick={()=>onRefuseCall(job)}>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}