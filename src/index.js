import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import App from './App';
import AuthProvider from './auth/auth_provider';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Root from './routes/root';
import ErrorView from './views/ErrorView';
import LoginView from './views/LoginView';
import SubscribeView from './views/SubscribeView';
import DashboardView from './views/DashboardView';
import CallCenterView from './views/CallCenterView';
import UserStatsView from './views/UserStatsView';
import FeedbackView from './views/FeedbackView';
import VideoCallView from './views/VideoCallView';
import ChatCallView from './views/ChatCallView';
const root = ReactDOM.createRoot(document.getElementById('root'));
const router = createBrowserRouter([
  {
    path: "/",
    element: ( 
      <AuthProvider>
          <Root />
      </AuthProvider>
      ),
    errorElement: <ErrorView />,
    children: [
      {
        path: "login",
        element: (
            <LoginView />
        ),
      },
      {
        path: "signup",
        element: <SubscribeView />,
      },
      {
        path: "dashboard",
        element: <DashboardView />,
      },
      {
        path: "callcenter",
        element: <CallCenterView />,
      },
      {
        path: "stats",
        element: <UserStatsView />,
      },
      {
        path: "feedback",
        element: <FeedbackView />,
      },
      {
        path: "videocall",
        element: <VideoCallView />,
      },
      {
        path: "chat",
        element: <ChatCallView />,
      },
    ]
  },
]);
root.render(
  <React.StrictMode>
      <RouterProvider router={router}>
            <App />
      </RouterProvider>
  </React.StrictMode>
);
reportWebVitals();
