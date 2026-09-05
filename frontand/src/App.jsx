import AppBar from './components/AppBar/AppBar'
import Footer from './components/Footer/Footer'
import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {login as stateLogin,logout as stateLogout} from '../store/AuthSclice';
import supabase from '../Supabase/Supabase'


function App() {
  const dispatch=useDispatch();
  useEffect(() => {
    const syncUserProfile = async (session) => {
      if (!session?.user) {
        dispatch(stateLogout());
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("userprofile")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        const userData = profile || {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email?.split("@")[0],
          role: "user",
        };

        dispatch(
          stateLogin({
            user: userData,
            session: session,
            role: userData.role || "user",
          })
        );
      } catch (err) {
        console.error("Error fetching user profile:", err);
        dispatch(
          stateLogin({
            user: {
              id: session.user.id,
              email: session.user.email,
              role: "user",
            },
            session: session,
            role: "user",
          })
        );
      }
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (session) {
          await syncUserProfile(session);
        } else {
          dispatch(stateLogout());
        }
      } else if (event === "SIGNED_OUT") {
        dispatch(stateLogout());
      } else if (event === "TOKEN_REFRESHED" && session) {
        await syncUserProfile(session);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [dispatch]);


  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip">
      <AppBar/>
      <div className='h-20'></div>
      <main className='flex-1 relative z-10 min-w-0'>
        <Outlet/>
      </main>
      <div className='h-20'></div>
      <Footer/>
    </div>
  )
}

export default App
