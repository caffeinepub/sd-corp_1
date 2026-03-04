import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Cloud,
  HardHat,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import SyncStatusBadge from "./SyncStatusBadge";
import { useTheme } from "./ThemeProvider";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  { to: "/sites", label: "Sites", icon: Building2, ocid: "nav.sites.link" },
  {
    to: "/summary",
    label: "Summary",
    icon: BarChart3,
    ocid: "nav.summary.link",
  },
  { to: "/cloud", label: "Cloud", icon: Cloud, ocid: "nav.cloud.link" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <HardHat className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sidebar-foreground font-bold text-lg leading-tight">
            SD Corp
          </span>
          <span className="text-sidebar-foreground/50 text-xs">
            Construction Mgmt
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
            data-ocid="nav.close.button"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              data-ocid={item.ocid}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sidebar-foreground/70 transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar md:hidden"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            data-ocid="nav.menu.button"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 md:hidden">
            <HardHat className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">
              SD Corp
            </span>
          </div>

          <div className="flex-1" />

          <SyncStatusBadge />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/profile" })}
            data-ocid="nav.profile.button"
            aria-label="Profile"
          >
            <User className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            data-ocid="nav.theme.toggle"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
