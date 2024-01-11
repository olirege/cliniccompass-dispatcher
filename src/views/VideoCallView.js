import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react'
import { callableFunction } from '../utils/cloudfunctions';
import AgoraUIKit from 'agora-react-uikit'
export default function VideoCall() {
    const location = useLocation();
    const context = location.state?.context;
    const [videocall, setVideocall] = useState(true)
    const [loading, setLoading] = useState(false)
    const [rtcProps, setRtcProps] = useState({
        appId: '', 
        channel: '', 
        token: '',
        uid: ''
    });
    const { func } = callableFunction({
        funcName: 'employee_ends_call',
        input: null,
        setLoading: setLoading,
        onSuccess: (data) => {
            console.log('acceptCall onSuccess',data);
        },
        onError: (e) => console.log('acceptCall onError', e),
    });
    useEffect(() => {
        if (context && context.length >= 3) {
            setRtcProps({
                appId: context[0],
                channel: context[1],
                token: context[2],
                uid: context[3],
                callbacks: () => {
                    setVideocall(false);
                    func();
                }
            });
        }
    }, [context]);
    return (
        <div className="h-full w-full">
            <div className="flex w-full justify-start h-8 items-center bg-purple-600">
                <h1 className="font-2xl font-bold pl-2">Video call</h1>
            </div>
            <div className="flex flex-grow items-center justify-center">
                <div className="flex flex-grow w-1/2 h-full">
                    {videocall && rtcProps.appId ? (
                        <AgoraUIKit rtcProps={rtcProps}/>
                    ) : (
                        <h1>Loading...</h1>
                    )}
                </div>
            </div>
        </div>
    )
}