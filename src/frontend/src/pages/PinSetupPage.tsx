import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { HardHat, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

// ── 4-digit PIN input component ───────────────────────────────
function PinInput({
  label,
  value,
  onChange,
  disabled,
  ocidPrefix,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  ocidPrefix: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    // Accept digits only
    if (!/^\d?$/.test(char)) return;
    const arr = value.split("").slice(0, 4);
    arr[idx] = char;
    const next = arr.join("").slice(0, 4);
    onChange(next);

    if (char && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      const arr = value.split("");
      if (arr[idx]) {
        arr[idx] = "";
        onChange(arr.join(""));
      } else if (idx > 0) {
        const newArr = value.split("");
        newArr[idx - 1] = "";
        onChange(newArr.join(""));
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 3);
      inputRefs.current[focusIdx]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground text-center">{label}</p>
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3].map((idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] ?? ""}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            data-ocid={`${ocidPrefix}.${idx + 1}`}
            className={[
              "w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-background transition-all outline-none",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              value[idx]
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-foreground",
              disabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

// ── PinSetupPage ─────────────────────────────────────────────
export default function PinSetupPage() {
  const { setupPin, logout, currentUser } = useAuth();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleSetPin = async () => {
    setError("");
    if (pin.length < 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }
    if (confirmPin.length < 4) {
      setError("Please confirm your PIN");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }
    setIsSettingUp(true);
    // Small delay for animation feel
    await new Promise((r) => setTimeout(r, 300));
    setupPin(pin);
    setIsSettingUp(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
            <HardHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            SD Corp
          </h1>
        </motion.div>

        <Card className="shadow-card-hover border-border/60">
          <CardHeader className="pb-2 pt-6 px-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Set Up Your PIN
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Hi {currentUser?.name?.split(" ")[0] ?? "there"}! Create a 4-digit
              PIN to quickly unlock the app on future visits.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* PIN inputs */}
              <PinInput
                label="Enter 4-digit PIN"
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setError("");
                }}
                disabled={isSettingUp}
                ocidPrefix="pin_setup.pin"
              />

              <PinInput
                label="Confirm PIN"
                value={confirmPin}
                onChange={(v) => {
                  setConfirmPin(v);
                  setError("");
                }}
                disabled={isSettingUp}
                ocidPrefix="pin_setup.confirm_pin"
              />

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive text-center"
                  data-ocid="pin_setup.error_state"
                >
                  {error}
                </motion.p>
              )}

              {/* Security tip */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <KeyRound className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your PIN is stored securely on this device. It replaces your
                  full password for daily use.
                </p>
              </div>

              {/* Set PIN button */}
              <Button
                className="w-full"
                onClick={handleSetPin}
                disabled={
                  pin.length < 4 || confirmPin.length < 4 || isSettingUp
                }
                data-ocid="pin_setup.submit.button"
              >
                {isSettingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  "Set PIN & Continue"
                )}
              </Button>

              {/* Logout option */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                data-ocid="pin_setup.logout.button"
              >
                Log out instead
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
