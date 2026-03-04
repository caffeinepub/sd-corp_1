# SD Corp — Google Drive OAuth Integration

## Current State

The app has Dashboard, Sites, Site Detail (Transactions, Labour, Work Progress), Summary, and Authentication pages. It uses a Motoko backend for all data. There is no Cloud tab, no Google Drive connection, and no file upload/sync functionality.

## Requested Changes (Diff)

### Add
- **Cloud tab** in the sidebar navigation linking to `/cloud`
- **CloudPage** (`/cloud`) — full Google Drive connection management page
- **GoogleDriveContext** — React context that persists Google OAuth access token and folder IDs in localStorage
- **useDriveUpload** hook — uploads a file blob to the correct Google Drive folder and returns the file URL
- **SyncStatusIndicator** component — shows inline Saving / Saved / Syncing / Synced badge
- **Google Identity Services (GSI)** script loaded in `index.html` for OAuth popup flow

### Modify
- `Layout.tsx` — add "Cloud" nav item (icon: `Cloud`) to the sidebar nav list
- `App.tsx` — add `/cloud` route pointing to `CloudPage`
- `index.html` — add Google Identity Services script tag

### Remove
- Nothing removed

## Implementation Plan

1. Load Google Identity Services (`accounts.google.com/gsi/client`) in `index.html`.
2. Create `src/contexts/GoogleDriveContext.tsx`:
   - Stores `{ accessToken, expiresAt, folderIds: { data, sites, documents, photos, transactions, backups } }` in localStorage key `sdcorp_gdrive`.
   - Exposes `connect()` — opens GSI popup with scopes `https://www.googleapis.com/auth/drive.file`.
   - Exposes `disconnect()`, `isConnected`, `syncStatus` (`idle | saving | saved | syncing | synced | error`), `setSyncStatus`, `uploadFileToDrive(file, folder)`.
   - On connect success: calls Drive API to create/find all required folders (`SD_CORP_DATA`, `SD_CORP_DATA/Sites`, `SD_CORP_DATA/Documents`, `SD_CORP_DATA/Photos`, `SD_CORP_DATA/Transactions`, `SD_CORP_BACKUPS`).
   - Token refresh: re-prompt GSI when token is expired.
   - On error: sets `error` state for display.
3. Create `src/pages/CloudPage.tsx`:
   - If not connected: shows "Connect Google Drive" button (opens OAuth popup).
   - If connected: shows connected account email, folder list, disconnect button.
   - Shows sync status badge.
   - Shows error message with Retry button if connection fails.
4. Create `src/components/SyncStatusBadge.tsx` — small animated badge showing Saving / Saved / Syncing / Synced status, consumed from `GoogleDriveContext`.
5. Wrap `AuthProvider` in `GoogleDriveProvider` in `App.tsx`.
6. Add `Cloud` nav item to `Layout.tsx`.
7. Add `/cloud` route to `App.tsx`.
8. Client ID: `924142619659-3htf0had4qp4c40vpp1mc3168pqpr7f.apps.googleusercontent.com`
