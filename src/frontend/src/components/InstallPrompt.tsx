import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  if (dismissed || isInstalled || !installEvent) return null;

  return (
    <div
      data-ocid="install.prompt.toast"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4"
    >
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Install SD Corp</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add to your home screen for a full-screen app experience
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={handleInstall}
            className="h-8 text-xs"
            data-ocid="install.prompt.primary_button"
          >
            Install App
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 text-xs"
            data-ocid="install.prompt.cancel_button"
          >
            Not now
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 flex-shrink-0 -mt-1 -mr-1"
        onClick={() => setDismissed(true)}
        data-ocid="install.prompt.close_button"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
