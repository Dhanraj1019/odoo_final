import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './components/Login/Login.jsx'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Home from './Pages/Home.jsx'
import UnderDevelopment from './components/UnderDevelopment.jsx'
import SignUp from './components/Login/SignUp.jsx'
import { Provider } from 'react-redux'
import { store } from '../store/store.js'
import UpdateProfile from './components/Forms/UpdateProfile.jsx'
import Loader from './components/Loader.jsx'
import UserProtect from './components/Protected/UserProtect.jsx'

import Notification from './components/Notification.jsx'

import AuthCallback from '../src/components/Login/AuthCallback.jsx'
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/home",
        element: <Home />
      },
      {
        path: "/login",
        element: <UserProtect authentication={false}>
          <Login />
        </UserProtect>
      },
      {
        path: "/signup",
        element: <UserProtect authentication={false}>
          <SignUp />
        </UserProtect>
      },
      {
        path: "/loader",
        element: <div className="flex justify-center items-center min-h-lvh">
            <Loader />
          </div>
      },
      {
        path: "/update-profile",
        element: <UserProtect authentication={true}>
          <UpdateProfile />
        </UserProtect>
      },
      {
        path: "/auth/callback",
        element: <AuthCallback />
      },
      {
        path: "/*",
        element: <UnderDevelopment header="Modal" content="// Theme customization coming soon..." />
      }
    ]
  }
])
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Notification/>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
