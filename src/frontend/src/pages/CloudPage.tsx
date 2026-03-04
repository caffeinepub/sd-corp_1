import SyncStatusBadge from "@/components/SyncStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  FileText,
  FolderOpen,
  HardDriveUpload,
  ImageIcon,
  Loader2,
  Receipt,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ── Folder tree item ──────────────────────────────────────────
function FolderTreeItem({
  name,
  level = 0,
  ocid,
}: {
  name: string;
  level?: number;
  ocid?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 py-1.5"
      style={{ paddingLeft: level === 0 ? 0 : level * 20 }}
      data-ocid={ocid}
    >
      <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-sm font-mono text-foreground/80">{name}</span>
    </div>
  );
}

// ── Sync info card ────────────────────────────────────────────
function SyncInfoCard({
  icon: Icon,
  label,
  destination,
}: {
  icon: React.ElementType;
  label: string;
  destination: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
          {destination}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function CloudPage() {
  const {
    isConnected,
    isConnecting,
    connectedEmail,
    folderIds,
    syncStatus,
    errorMessage,
    connect,
    disconnect,
  } = useGoogleDrive();

  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // Error is already set in context
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDisconnectOpen(false);
  };

  return (
    <div
      className="min-h-full p-4 md:p-6 max-w-2xl mx-auto"
      data-ocid="cloud.page"
    >
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Cloud Storage
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sync your business data to Google Drive automatically
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              <SyncStatusBadge />
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── NOT CONNECTED ─────────────────────────────────── */}
        {!isConnected && (
          <motion.div
            key="not-connected"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="border-dashed border-2 border-border/60">
              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <HardDriveUpload className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Connect Google Drive
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Automatically sync your site data, documents, and photos to
                    Google Drive. Files are organized into folders
                    automatically.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  data-ocid="cloud.connect.button"
                  className="gap-2 min-w-[200px]"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      Connect Google Drive
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    Secure OAuth 2.0 — SD Corp only accesses files it creates
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Error state */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="border-destructive/40 bg-destructive/5"
                    data-ocid="cloud.error.panel"
                  >
                    <CardContent className="pt-4 pb-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-destructive">
                          Connection Failed
                        </p>
                        <p className="text-xs text-destructive/80 mt-1">
                          {errorMessage}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        data-ocid="cloud.retry.button"
                        className="gap-1.5 flex-shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* What syncs info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  What gets synced
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2.5">
                <SyncInfoCard
                  icon={ImageIcon}
                  label="Site Photos"
                  destination="SD_CORP_DATA/Photos"
                />
                <SyncInfoCard
                  icon={FileText}
                  label="Documents & Bills"
                  destination="SD_CORP_DATA/Documents"
                />
                <SyncInfoCard
                  icon={Receipt}
                  label="Transaction Records"
                  destination="SD_CORP_DATA/Transactions"
                />
                <SyncInfoCard
                  icon={Wallet}
                  label="Backups & Reports"
                  destination="SD_CORP_BACKUPS"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── CONNECTED ─────────────────────────────────────── */}
        {isConnected && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
            data-ocid="cloud.status.panel"
          >
            {/* Connected badge + account */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                      <Cloud className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          Connected
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">
                        {connectedEmail}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Google Drive is active
                      </p>
                    </div>
                  </div>

                  {/* Disconnect button */}
                  <Dialog
                    open={disconnectOpen}
                    onOpenChange={setDisconnectOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid="cloud.disconnect.button"
                        className="gap-1.5 flex-shrink-0 border-red-300/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-800/60 dark:text-red-400"
                      >
                        <CloudOff className="w-3.5 h-3.5" />
                        Disconnect
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-ocid="cloud.disconnect.dialog">
                      <DialogHeader>
                        <DialogTitle>Disconnect Google Drive?</DialogTitle>
                        <DialogDescription>
                          Your existing files in Google Drive will not be
                          deleted. You can reconnect at any time.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDisconnectOpen(false)}
                          data-ocid="cloud.disconnect.cancel_button"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDisconnect}
                          data-ocid="cloud.disconnect.confirm_button"
                        >
                          Disconnect
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Sync status card */}
            {syncStatus !== "idle" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cloud className="w-4 h-4" />
                  <span>Sync status</span>
                </div>
                <SyncStatusBadge />
              </motion.div>
            )}

            {/* Folder structure */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  Drive Folder Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/40">
                  <FolderTreeItem
                    name="SD_CORP_DATA/"
                    level={0}
                    ocid="cloud.folder.item.1"
                  />
                  <div className="pl-5">
                    <FolderTreeItem
                      name="Sites/"
                      level={1}
                      ocid="cloud.folder.item.2"
                    />
                    <FolderTreeItem
                      name="Documents/"
                      level={1}
                      ocid="cloud.folder.item.3"
                    />
                    <FolderTreeItem
                      name="Photos/"
                      level={1}
                      ocid="cloud.folder.item.4"
                    />
                    <FolderTreeItem name="Transactions/" level={1} />
                  </div>
                  <FolderTreeItem
                    name="SD_CORP_BACKUPS/"
                    level={0}
                    ocid="cloud.folder.item.5"
                  />
                </div>

                {folderIds && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    All folders created and ready
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Sync info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Auto-sync destinations
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2.5">
                <SyncInfoCard
                  icon={ImageIcon}
                  label="Site Photos"
                  destination="SD_CORP_DATA/Photos"
                />
                <SyncInfoCard
                  icon={FileText}
                  label="Documents & Bills"
                  destination="SD_CORP_DATA/Documents"
                />
                <SyncInfoCard
                  icon={Receipt}
                  label="Transaction Records"
                  destination="SD_CORP_DATA/Transactions"
                />
                <SyncInfoCard
                  icon={Wallet}
                  label="Backups & Reports"
                  destination="SD_CORP_BACKUPS"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
