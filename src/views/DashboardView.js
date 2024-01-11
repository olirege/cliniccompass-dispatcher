import { useNavigate } from "react-router-dom"
export default function Dashboard() {
    const navigate = useNavigate();
    return (
        <div className="h-full w-full">
            <div className="flex w-full justify-start h-8 items-center bg-purple-600">
                <h1 className="font-2xl font-bold pl-2">Dashboard</h1>
            </div>
            <div className="grid grid-cols-2 h-full w-full">
                <div className="bg-purple-200 h-full flex justify-center items-center p-2">
                    <div className='bg-white h-96 w-96 flex justify-center items-center' onClick={() => navigate('/callcenter')}>
                        <h1>Call center</h1>
                    </div>
                </div>
                <div className="bg-purple-400 h-full p-2 grid grid-cols-2 gap-2">
                    <div className="bg-white h-96 flex justify-center items-center" onClick={() => navigate('/feedback')}><h1>Feedback</h1></div>
                    <div className="bg-white h-96 flex justify-center items-center" onClick={() => navigate('/stats')}><h1>Stats</h1></div>
                </div>
            </div>
        </div>
    )
}