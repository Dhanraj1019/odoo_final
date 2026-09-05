import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectNotifications,
  removeNotification,
} from "../../features/notifications/notificationSlice";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export default function NotificationToast() {
  const notifications = useSelector(selectNotifications);
  const dispatch = useDispatch();

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      const timer = setTimeout(() => {
        dispatch(removeNotification(latest.id));
      }, latest.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications, dispatch]);

  if (!notifications.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
      {notifications.map((n) => {
        let icon = <Info className="w-5 h-5 text-blue-500" />;
        let borderClass = "border-blue-200 bg-blue-50/95";

        if (n.type === "success") {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
          borderClass = "border-emerald-200 bg-emerald-50/95";
        } else if (n.type === "error") {
          icon = <AlertCircle className="w-5 h-5 text-rose-600" />;
          borderClass = "border-rose-200 bg-rose-50/95";
        } else if (n.type === "warning") {
          icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;
          borderClass = "border-amber-200 bg-amber-50/95";
        }

        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 ${borderClass}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 text-sm font-medium text-slate-800 leading-snug">
              {n.message}
            </div>
            <button
              onClick={() => dispatch(removeNotification(n.id))}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
