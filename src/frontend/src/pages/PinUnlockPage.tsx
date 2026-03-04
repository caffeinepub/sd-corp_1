import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { HardHat, LogOut, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

// ── 4-digit PIN input ─────────────────────────────────────────
function PinDigits({
  value,
  onChange,
  disabled,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
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
          data-ocid={`pin_unlock.pin.${idx + 1}`}
          className={[
            "w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-background transition-all outline-none",
            hasError
              ? "border-destructive bg-destructive/5 animate-shake"
              : value[idx]
                ? "border-primary bg-primary/5 focus:ring-2 focus:ring-primary/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ── PinUnlockPage ─────────────────────────────────────────────
export default function PinUnlockPage() {
  const { verifyPin, logout, currentUser } = useAuth();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async () => {
    if (pin.length < 4) return;
    setError("");
    setIsChecking(true);

    await new Promise((r) => setTimeout(r, 200));
    const ok = verifyPin(pin);

    if (!ok) {
      setError("Incorrect PIN. Please try again.");
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 600);
    }
    setIsChecking(false);
  };

  const handlePinChange = (val: string) => {
    setPin(val);
    setError("");
    // Auto-submit when 4 digits entered
    if (val.length === 4) {
      setTimeout(() => {
        const ok = verifyPin(val);
        if (!ok) {
          setError("Incorrect PIN. Please try again.");
          setShake(true);
          setPin("");
          setTimeout(() => setShake(false), 600);
        }
      }, 150);
    }
  };

  const handleUsePassword = async () => {
    await logout();
  };

  // Get initials for avatar
  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/6 blur-3xl -top-20" />
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-3 shadow-lg">
            <HardHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">SD Corp</p>
        </motion.div>

        <Card className="shadow-card-hover border-border/60">
          <CardHeader className="pb-3 pt-6 px-6 text-center">
            {/* Avatar */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-display font-bold text-xl mx-auto mb-3">
              {initials}
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Welcome back, {currentUser?.name?.split(" ")[0] ?? "there"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter your PIN to unlock
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-5">
              {/* PIN digits */}
              <motion.div
                animate={shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <PinDigits
                  value={pin}
                  onChange={handlePinChange}
                  disabled={isChecking}
                  hasError={!!error && shake}
                />
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                  data-ocid="pin_unlock.error_state"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Unlock button */}
              <Button
                className="w-full"
                onClick={handleUnlock}
                disabled={pin.length < 4 || isChecking}
                data-ocid="pin_unlock.submit.button"
              >
                Unlock
              </Button>

              {/* Use password instead */}
              <button
                type="button"
                onClick={handleUsePassword}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                data-ocid="pin_unlock.use_password.button"
              >
                <LogOut className="w-3 h-3" />
                Use password instead
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
