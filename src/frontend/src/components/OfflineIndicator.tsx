import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      data-ocid="offline.indicator.toast"
      className={`fixed top-16 left-4 right-4 md:left-auto md:right-6 md:max-w-xs z-50 rounded-lg px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium shadow-lg transition-all ${
        isOnline
          ? "bg-green-600 text-white"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      {isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
          Back online — syncing data...
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          No internet — working offline
        </>
      )}
    </div>
  );
}
