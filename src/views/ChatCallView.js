import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react'
import { callableFunction } from '../utils/cloudfunctions';
import { onSnapshot, collection, query, orderBy, doc, addDoc } from '@firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { formatTimestamp } from '../utils/formatTimestamp';
export default function ChatCall() {
    const location = useLocation();
    const context = location.state?.context;
    const [chat, setChat] = useState(true)
    const [roomSub, setRoomSub] = useState(null)
    const [messagesSub, setMessagesSub] = useState(null)
    const [messages, setMessages] = useState([])
    const [messagesRef, setMessageRef] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [chatProps, setChatProps] = useState({
        channel: '', 
        employeeId: '', 
        userId: ''
    });
    const roomCallback = (data) => {
        setLoading(true)
        if (data) {
            const room = data.data();
            console.log('Room data', room)
        } else {
        }
        setLoading(false)
    }
    const messagesCallback = (data) => {
        console.log('Messages data', data);
        if (data) {
            const messages = data.docs.map((doc) => {
                const message = doc.data();
                const messageId = doc.id;
                return (
                    <div>
                        <h1>{formatTimestamp(message.timestamp)}</h1>
                        <div key={messageId} className="flex flex-col">
                            <h1>{message.message}</h1>
                        </div>
                    </div>
                );
            });
            setMessages(messages || []);
        } 
    };
    useEffect(() => {
        if (context && context.length >= 3) {
            setChatProps({
                channel: context[0],
                employeeId: context[1],
                userId: context[2],
            });
        }
         // Reference to the specific chat room
         const roomRef = doc(db, 'chats', context[0]);
         const roomSub = onSnapshot(roomRef, roomCallback);

         // Reference to the messages within the chat room, ordered by timestamp
         const messagesRef = collection(roomRef, 'messages');
         const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
         const messagesSub = onSnapshot(messagesQuery, messagesCallback);

         setRoomSub(() => roomSub);
         setMessagesSub(() => messagesSub);
         setMessageRef(messagesRef);

    }, [context]);
    const { func } = callableFunction({
        funcName: 'employee_ends_call',
        input: null,
        setLoading: setLoading,
        onSuccess: (data) => {
            console.log('acceptCall onSuccess',data);
        },
        onError: (e) => console.log('acceptCall onError', e),
    });
    const onLeaveChat = () => {
        setChat(false);
        roomSub();
        func();
    }
    const sendMessage = async () => {
        if (!message) return
        if (!messagesRef) return
        const messageData = {
            message,
            sender: getAuth().currentUser.uid,
            timestamp: Date.now()
        }
        await addDoc(messagesRef, messageData);
        setMessage('');
    }
    return (
        <div className="h-full w-full">
            <div className="flex w-full justify-start h-8 items-center bg-purple-600">
                <h1 className="font-2xl font-bold pl-2">Chat</h1>
            </div>
            <div className="flex flex-grow items-center justify-center">
                <div className="flex flex-grow w-1/2 h-full">
                    {chat && chatProps.channel && !loading ? (
                        <div className="flex flex-col w-full h-full">
                            <div className="flex flex-grow justify-between items-center bg-purple-200 h-8">
                                <h1 className="font-bold pl-2">{chatProps.channel}</h1>
                                <button className="bg-red-200 h-6 w-6 rounded-full mr-2" onClick={onLeaveChat}>
                                    <h1 className="font-bold text-center">X</h1>
                                </button>
                            </div>
                            <div className="flex flex-col flex-grow bg-gray-200">
                                {messages}    
                            </div>
                            <div className="flex justify-between items-center bg-purple-200 h-8">
                                <input className="flex-grow h-full" value={message} onChange={(e) => setMessage(e.target.value)} />
                                <button className="bg-green-200 h-6 w-6 rounded-full mr-2" onClick={sendMessage}>
                                    <h1 className="font-bold text-center">></h1>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <h1>Loading...</h1>
                    )}
                </div>
            </div>
        </div>
    )
}