import AppBar from './components/AppBar/AppBar'
import Footer from './components/Footer/Footer'
import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { login as stateLogin, logout as stateLogout } from '../store/AuthSclice';
import authApi from './api/auth';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await authApi.getMe();
        if (res && res.success && res.user) {
          dispatch(
            stateLogin({
              user: res.user,
              role: res.user.role || "user",
            })
          );
        } else {
          dispatch(stateLogout());
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        dispatch(stateLogout());
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip">
      <AppBar />
      <div className='h-20'></div>
      <main className='flex-1 relative z-10 min-w-0'>
        <Outlet />
      </main>
      <div className='h-20'></div>
      <Footer />
    </div>
  )
}

export default App
