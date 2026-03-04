import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import type { SyncStatus } from "@/contexts/GoogleDriveContext";
import { CheckCircle2, CloudUpload, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// ── Status config ─────────────────────────────────────────────
const statusConfig: Record<
  Exclude<SyncStatus, "idle">,
  {
    icon: React.ReactNode;
    label: string;
    className: string;
  }
> = {
  saving: {
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: "Saving...",
    className:
      "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  },
  saved: {
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: "Saved",
    className:
      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  },
  syncing: {
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: "Syncing...",
    className:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  synced: {
    icon: <CloudUpload className="w-3 h-3" />,
    label: "Synced",
    className:
      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  },
  error: {
    icon: <X className="w-3 h-3" />,
    label: "Sync failed",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  },
};

// ── Component ─────────────────────────────────────────────────
export default function SyncStatusBadge() {
  const { syncStatus, isConnected } = useGoogleDrive();

  // Only show if connected and status is not idle
  const shouldShow = isConnected && syncStatus !== "idle";

  const config = syncStatus !== "idle" ? statusConfig[syncStatus] : null;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && config && (
        <motion.div
          key={syncStatus}
          initial={{ opacity: 0, scale: 0.85, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1
            rounded-full border text-xs font-medium
            select-none whitespace-nowrap
            ${config.className}
          `}
          aria-live="polite"
          aria-label={`Sync status: ${config.label}`}
        >
          {config.icon}
          <span>{config.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
