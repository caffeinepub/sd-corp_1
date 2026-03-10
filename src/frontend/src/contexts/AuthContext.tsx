import type { AppUser } from "@/backend.d";
import { useActor } from "@/hooks/useActor";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ── Constants ─────────────────────────────────────────────────
const SESSION_KEY = "sdcorp_session_token";
const pinKey = (userId: string) => `sdcorp_pin_${userId}`;

// ── Types ─────────────────────────────────────────────────────
interface AuthContextValue {
  currentUser: AppUser | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  pinSetupRequired: boolean;
  pinLocked: boolean;
  isInitializing: boolean;

  login: (
    userId: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setupPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  changePin: (oldPin: string, newPin: string) => boolean;
  resetPinWithPassword: (
    userId: string,
    password: string,
    newPin: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pinSetupRequired, setPinSetupRequired] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Restore session on mount ────────────────────────────────
  useEffect(() => {
    if (isFetching || !actor) return;

    const savedToken = localStorage.getItem(SESSION_KEY);
    if (!savedToken) {
      setIsInitializing(false);
      return;
    }

    actor
      .verifySession(savedToken)
      .then(async (result) => {
        if (result.__kind__ === "ok") {
          const user = result.ok;
          setCurrentUser(user);
          setSessionToken(savedToken);

          const storedPin = localStorage.getItem(pinKey(user.userId));
          if (!storedPin) {
            setPinSetupRequired(true);
          } else {
            setPinLocked(true);
          }
        } else {
          // Session expired or not found — clear it
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .finally(() => setIsInitializing(false));
  }, [actor, isFetching]);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(
    async (
      userId: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!actor) return { success: false, error: "Service not ready" };

      try {
        const result = await actor.loginUser(userId, password);

        if (result.__kind__ === "ok") {
          const token = result.ok;
          localStorage.setItem(SESSION_KEY, token);

          // Get user info
          const sessionResult = await actor.verifySession(token);
          if (sessionResult.__kind__ === "ok") {
            const user = sessionResult.ok;
            setCurrentUser(user);
            setSessionToken(token);

            const storedPin = localStorage.getItem(pinKey(user.userId));
            if (!storedPin) {
              setPinSetupRequired(true);
              setPinLocked(false);
            } else {
              setPinSetupRequired(false);
              setPinLocked(true);
            }
            return { success: true };
          }
          return { success: false, error: "Failed to retrieve user info" };
        }
        if (result.__kind__ === "userNotFound") {
          return {
            success: false,
            error: "User not found. Check your User ID.",
          };
        }
        if (result.__kind__ === "invalidCredentials") {
          return {
            success: false,
            error: "Incorrect password. Please try again.",
          };
        }
        return { success: false, error: "Login failed. Please try again." };
      } catch {
        return { success: false, error: "Login failed. Please try again." };
      }
    },
    [actor],
  );

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (actor && sessionToken) {
      try {
        await actor.logoutSession(sessionToken);
      } catch {
        // Ignore errors on logout
      }
    }
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setSessionToken(null);
    setPinSetupRequired(false);
    setPinLocked(false);
  }, [actor, sessionToken]);

  // ── PIN management ────────────────────────────────────────
  const setupPin = useCallback(
    (pin: string) => {
      if (!currentUser) return;
      localStorage.setItem(pinKey(currentUser.userId), btoa(pin));
      setPinSetupRequired(false);
      setPinLocked(false);
    },
    [currentUser],
  );

  const verifyPin = useCallback(
    (pin: string): boolean => {
      if (!currentUser) return false;
      const stored = localStorage.getItem(pinKey(currentUser.userId));
      if (!stored) return false;
      const match = btoa(pin) === stored;
      if (match) {
        setPinLocked(false);
      }
      return match;
    },
    [currentUser],
  );

  const changePin = useCallback(
    (oldPin: string, newPin: string): boolean => {
      if (!currentUser) return false;
      const stored = localStorage.getItem(pinKey(currentUser.userId));
      if (!stored || btoa(oldPin) !== stored) return false;
      localStorage.setItem(pinKey(currentUser.userId), btoa(newPin));
      return true;
    },
    [currentUser],
  );

  const resetPinWithPassword = useCallback(
    async (
      userId: string,
      password: string,
      newPin: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!actor) return { success: false, error: "Service not ready" };
      try {
        const result = await actor.loginUser(userId, password);
        if (result.__kind__ === "ok") {
          localStorage.setItem(pinKey(userId), btoa(newPin));
          return { success: true };
        }
        if (result.__kind__ === "userNotFound") {
          return { success: false, error: "User not found" };
        }
        return { success: false, error: "Invalid password" };
      } catch {
        return {
          success: false,
          error: "Verification failed. Please try again.",
        };
      }
    },
    [actor],
  );

  const isAuthenticated = !!currentUser && !!sessionToken;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        sessionToken,
        isAuthenticated,
        pinSetupRequired,
        pinLocked,
        isInitializing,
        login,
        logout,
        setupPin,
        verifyPin,
        changePin,
        resetPinWithPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
