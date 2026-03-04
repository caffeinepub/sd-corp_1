import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import InstallPrompt from "./components/InstallPrompt";
import Layout from "./components/Layout";
import OfflineIndicator from "./components/OfflineIndicator";
import { ThemeProvider } from "./components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import PinSetupPage from "./pages/PinSetupPage";
import PinUnlockPage from "./pages/PinUnlockPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SiteDetail from "./pages/SiteDetail";
import Sites from "./pages/Sites";
import Summary from "./pages/Summary";

// ── Root component ────────────────────────────────────────────
function RootComponent() {
  const { isAuthenticated, pinSetupRequired, pinLocked, isInitializing } =
    useAuth();

  const showFullLayout =
    isAuthenticated && !pinSetupRequired && !pinLocked && !isInitializing;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showFullLayout ? (
        <Layout>
          <Outlet />
        </Layout>
      ) : (
        <Outlet />
      )}
      <Toaster richColors position="top-right" />
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}

// ── Login route guard component ───────────────────────────────
function ProtectedRoute({
  component: Component,
}: { component: React.ComponentType }) {
  const { isAuthenticated, pinSetupRequired, pinLocked, isInitializing } =
    useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;
  if (pinSetupRequired) return <PinSetupPage />;
  if (pinLocked) return <PinUnlockPage />;

  return <Component />;
}

// ── Public route guard ────────────────────────────────────────
function PublicRoute({
  component: Component,
}: { component: React.ComponentType }) {
  const { isAuthenticated, pinSetupRequired, pinLocked } = useAuth();

  // If already authenticated and no PIN issues, don't show login/register
  if (isAuthenticated && !pinSetupRequired && !pinLocked) {
    // Redirect to dashboard — just render dashboard
    return <Dashboard />;
  }

  return <Component />;
}

// ── Routes ────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <RootComponent />
      </AuthProvider>
    </ThemeProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <ProtectedRoute component={Dashboard} />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <PublicRoute component={LoginPage} />,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => <PublicRoute component={RegisterPage} />,
});

const sitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites",
  component: () => <ProtectedRoute component={Sites} />,
});

const siteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sites/$siteId",
  component: () => <ProtectedRoute component={SiteDetail} />,
});

const summaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/summary",
  component: () => <ProtectedRoute component={Summary} />,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => <ProtectedRoute component={ProfilePage} />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  sitesRoute,
  siteDetailRoute,
  summaryRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
