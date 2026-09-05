import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../Loader";

export default function UserProtect({ children, authentication = true }) {
  const [loader, setLoader] = useState(true);
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (authentication && !authStatus) {
      navigate("/login", { replace: true });
    } else if (!authentication && authStatus) {
      navigate("/home", { replace: true });
    } else {
      setLoader(false);
    }
  }, [authStatus, navigate, authentication]);

  return loader ? (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader />
    </div>
  ) : (
    <>{children}</>
  );
}