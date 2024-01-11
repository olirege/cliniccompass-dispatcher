import { getFunctions, httpsCallable  } from 'firebase/functions';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
const functions = getFunctions();

export const callableFunction = (context) => {
    const callable =  httpsCallable(functions, context.funcName);
    const func = async () => {
        console.log(`Starting ${context.funcName}`)
        context.setLoading(true);
        try {
            console.log(`Executing ${context.funcName} callable`)
            const resp = await callable(context.input)
            console.log(`Executing ${context.funcName} onSuccess`)
            context.onSuccess(resp);
        } catch(e) {
            console.log(`Function ${context.funcName} failed`)
            context.onError(e);
        }
        context.setLoading(false);
        console.log(`Ending ${context.funcName}`)
        return
    }
    return { func }
}

export const subscribeToDocument = (context) => {
    const { documentId, callback,  } = context;
    const docRef = doc(db, context.documentRef, documentId);
    const unsubscribe = onSnapshot(docRef,(doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            console.log("No such document!");
        }
    });
    return unsubscribe;
}
export const subscribeToQuery = (context) => {
    console.log('subscribeToQuery context', context)
    const { query, callback  } = context;
    const unsubscribe = onSnapshot(query,(querySnapshot) => {
        console.log('subscribeToQuery querySnapshot', querySnapshot)
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        console.log('subscribeToQuery data', data)
        callback(data);
        console.log('subscribeToQuery callback', callback)
    });
    return unsubscribe;
}