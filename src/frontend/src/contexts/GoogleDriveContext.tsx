import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ── Constants ─────────────────────────────────────────────────
const GDRIVE_STORAGE_KEY = "sdcorp_gdrive";
const GOOGLE_CLIENT_ID =
  "924142619659-3htf0had4qp4c40vpp1mc3168pqpr7f.apps.googleusercontent.com";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
const FOLDER_MIME = "application/vnd.google-apps.folder";

// ── Types ─────────────────────────────────────────────────────
interface FolderIds {
  data: string;
  sites: string;
  documents: string;
  photos: string;
  transactions: string;
  backups: string;
}

interface StoredGDriveData {
  accessToken: string;
  expiresAt: number;
  email: string;
  folderIds: FolderIds | null;
}

export type SyncStatus =
  | "idle"
  | "saving"
  | "saved"
  | "syncing"
  | "synced"
  | "error";

export type DriveFolder =
  | "sites"
  | "documents"
  | "photos"
  | "transactions"
  | "backups";

interface GoogleDriveContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  connectedEmail: string | null;
  folderIds: FolderIds | null;
  syncStatus: SyncStatus;
  errorMessage: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  uploadFileToDrive: (
    file: File,
    folderKey: DriveFolder,
  ) => Promise<string | null>;
  setSyncStatus: (status: SyncStatus) => void;
}

// ── Context ───────────────────────────────────────────────────
const GoogleDriveContext = createContext<GoogleDriveContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────
function loadStoredData(): StoredGDriveData | null {
  try {
    const raw = localStorage.getItem(GDRIVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredGDriveData;
  } catch {
    return null;
  }
}

function saveStoredData(data: StoredGDriveData) {
  try {
    localStorage.setItem(GDRIVE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function clearStoredData() {
  try {
    localStorage.removeItem(GDRIVE_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function isTokenExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt - 60_000; // 1-minute buffer
}

// ── Google Drive API helpers ──────────────────────────────────
async function findFolder(
  name: string,
  parentId: string | null,
  accessToken: string,
): Promise<string | null> {
  const parentQuery = parentId
    ? ` and '${parentId}' in parents`
    : " and 'root' in parents";
  const q = encodeURIComponent(
    `name='${name}' and mimeType='${FOLDER_MIME}' and trashed=false${parentQuery}`,
  );
  const res = await fetch(`${DRIVE_API}?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { files: { id: string; name: string }[] };
  return data.files.length > 0 ? data.files[0].id : null;
}

async function createFolder(
  name: string,
  parentId: string | null,
  accessToken: string,
): Promise<string> {
  const body: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: FOLDER_MIME,
  };
  if (parentId) body.parents = [parentId];

  const res = await fetch(DRIVE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create folder "${name}": ${res.statusText}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

async function findOrCreateFolder(
  name: string,
  parentId: string | null,
  accessToken: string,
): Promise<string> {
  const existing = await findFolder(name, parentId, accessToken);
  if (existing) return existing;
  return createFolder(name, parentId, accessToken);
}

async function setupFolders(accessToken: string): Promise<FolderIds> {
  // 1. SD_CORP_DATA (root)
  const dataId = await findOrCreateFolder("SD_CORP_DATA", null, accessToken);

  // 2. Sub-folders in parallel
  const [sitesId, documentsId, photosId, transactionsId] = await Promise.all([
    findOrCreateFolder("Sites", dataId, accessToken),
    findOrCreateFolder("Documents", dataId, accessToken),
    findOrCreateFolder("Photos", dataId, accessToken),
    findOrCreateFolder("Transactions", dataId, accessToken),
  ]);

  // 3. SD_CORP_BACKUPS (root)
  const backupsId = await findOrCreateFolder(
    "SD_CORP_BACKUPS",
    null,
    accessToken,
  );

  return {
    data: dataId,
    sites: sitesId,
    documents: documentsId,
    photos: photosId,
    transactions: transactionsId,
    backups: backupsId,
  };
}

// ── Provider ─────────────────────────────────────────────────
export function GoogleDriveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [folderIds, setFolderIds] = useState<FolderIds | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref for resolve function of pending connect promise
  const connectResolveRef = useRef<(() => void) | null>(null);
  const connectRejectRef = useRef<((e: Error) => void) | null>(null);

  // ── Restore from localStorage on mount ─────────────────────
  useEffect(() => {
    const stored = loadStoredData();
    if (!stored) return;
    if (isTokenExpired(stored.expiresAt)) {
      clearStoredData();
      return;
    }
    setAccessToken(stored.accessToken);
    setExpiresAt(stored.expiresAt);
    setConnectedEmail(stored.email);
    setFolderIds(stored.folderIds);
  }, []);

  const isConnected = !!accessToken && !isTokenExpired(expiresAt);

  // ── disconnect ──────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAccessToken(null);
    setExpiresAt(0);
    setConnectedEmail(null);
    setFolderIds(null);
    setSyncStatusState("idle");
    setErrorMessage(null);
    clearStoredData();
  }, []);

  // ── setSyncStatus (public) ──────────────────────────────────
  const setSyncStatus = useCallback((status: SyncStatus) => {
    setSyncStatusState(status);
  }, []);

  // ── connect ─────────────────────────────────────────────────
  const connect = useCallback((): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.google === "undefined") {
        const msg =
          "Google Identity Services not loaded. Please refresh the page.";
        setErrorMessage(msg);
        reject(new Error(msg));
        return;
      }

      connectResolveRef.current = resolve;
      connectRejectRef.current = reject;

      setIsConnecting(true);
      setErrorMessage(null);

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope:
          "https://www.googleapis.com/auth/drive.file email profile openid",
        callback: async (response) => {
          if (response.error || !response.access_token) {
            const msg =
              response.error === "access_denied"
                ? "Google Drive access was denied. Please try again."
                : response.error
                  ? `Google OAuth error: ${response.error}`
                  : "Failed to obtain access token.";
            setErrorMessage(msg);
            setIsConnecting(false);
            connectRejectRef.current?.(new Error(msg));
            return;
          }

          const token = response.access_token;
          const expiry = Date.now() + (response.expires_in ?? 3600) * 1_000;

          try {
            // Fetch user email from Google
            const profileRes = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const profile = profileRes.ok
              ? ((await profileRes.json()) as { email?: string })
              : null;
            const email = profile?.email ?? "Connected";

            setSyncStatusState("syncing");

            // Create/verify Drive folders
            const ids = await setupFolders(token);

            setAccessToken(token);
            setExpiresAt(expiry);
            setConnectedEmail(email);
            setFolderIds(ids);
            setSyncStatusState("synced");
            setErrorMessage(null);

            saveStoredData({
              accessToken: token,
              expiresAt: expiry,
              email,
              folderIds: ids,
            });

            connectResolveRef.current?.();
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : "Failed to set up Google Drive folders.";
            setErrorMessage(msg);
            setSyncStatusState("error");
            connectRejectRef.current?.(new Error(msg));
          } finally {
            setIsConnecting(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    });
  }, []);

  // ── uploadFileToDrive ────────────────────────────────────────
  const uploadFileToDrive = useCallback(
    async (file: File, folderKey: DriveFolder): Promise<string | null> => {
      if (!accessToken || isTokenExpired(expiresAt)) {
        setErrorMessage("Session expired. Please reconnect.");
        setSyncStatusState("error");
        disconnect();
        return null;
      }

      if (!folderIds) {
        setErrorMessage("Drive folders not set up. Please reconnect.");
        setSyncStatusState("error");
        return null;
      }

      const folderId = folderIds[folderKey];

      setSyncStatusState("syncing");

      try {
        const metadata = JSON.stringify({
          name: file.name,
          parents: [folderId],
        });

        const form = new FormData();
        form.append(
          "metadata",
          new Blob([metadata], { type: "application/json" }),
        );
        form.append("file", file);

        const res = await fetch(DRIVE_UPLOAD_API, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        const data = (await res.json()) as { id: string };
        setSyncStatusState("synced");

        // Update localStorage with latest token state
        saveStoredData({
          accessToken,
          expiresAt,
          email: connectedEmail ?? "",
          folderIds,
        });

        return data.id;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "File upload failed.";
        setErrorMessage(msg);
        setSyncStatusState("error");
        return null;
      }
    },
    [accessToken, expiresAt, folderIds, connectedEmail, disconnect],
  );

  return (
    <GoogleDriveContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectedEmail,
        folderIds,
        syncStatus,
        errorMessage,
        connect,
        disconnect,
        uploadFileToDrive,
        setSyncStatus,
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useGoogleDrive(): GoogleDriveContextValue {
  const ctx = useContext(GoogleDriveContext);
  if (!ctx)
    throw new Error("useGoogleDrive must be used within GoogleDriveProvider");
  return ctx;
}
