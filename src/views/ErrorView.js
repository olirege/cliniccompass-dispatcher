import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl">Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p className="text-slate-500">
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}