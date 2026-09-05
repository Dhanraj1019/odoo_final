import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import {
  selectCurrentUser,
  selectAuthStatus,
  setCredentials,
  setAuthLoading,
  setAuthError,
} from "../features/auth/authSlice";
import { apiFetch } from "../lib/apiClient";
import Spinner from "../components/common/Spinner";

export default function RequireAuth({ children }) {
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // Only attempt session restore if idle and no user
    if (status === "idle" && !user) {
      dispatch(setAuthLoading());
      apiFetch("/auth/me")
        .then((res) => {
          if (res?.data?.user) {
            dispatch(setCredentials(res.data.user));
          } else {
            dispatch(setAuthError("No active session"));
          }
        })
        .catch((err) => {
          dispatch(setAuthError(err.message || "Failed to restore session"));
        });
    }
  }, [status, user, dispatch]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Restoring session...
        </p>
      </div>
    );
  }

  if (!user && status !== "idle") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
