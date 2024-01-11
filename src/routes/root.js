import { Outlet, Link  } from "react-router-dom";
export default function Root() {
    return (
        <>
            <nav className="inline-flex gap-2 p-2 h-12 bg-purple-200 w-full items-center sticky top-0 z-10">
                <Link to={`/`} className="hover:underline decoration-purple-400 decoration-4">Home</Link>
                <Link to={`/login`} className="hover:underline decoration-purple-400 decoration-4">Sign in</Link>
            </nav>
            <div id="detail">
                <Outlet />
            </div>
        </>
    );
}