import { ChangePasswordResult } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useActor } from "@/hooks/useActor";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ── PIN input ─────────────────────────────────────────────────
function PinBoxes({
  value,
  onChange,
  disabled,
  ocidPrefix,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ocidPrefix: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split("").slice(0, 4);
    arr[idx] = char;
    const next = arr.join("").slice(0, 4);
    onChange(next);
    if (char && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      const arr = value.split("");
      if (arr[idx]) {
        arr[idx] = "";
        onChange(arr.join(""));
      } else if (idx > 0) {
        const a2 = value.split("");
        a2[idx - 1] = "";
        onChange(a2.join(""));
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) refs.current[idx - 1]?.focus();
    else if (e.key === "ArrowRight" && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (p) {
      onChange(p);
      refs.current[Math.min(p.length, 3)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
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
            "w-11 h-11 text-center text-xl font-bold rounded-lg border-2 bg-background transition-all outline-none",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            value[idx] ? "border-primary bg-primary/5" : "border-border",
            disabled ? "opacity-50" : "",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ── ChangePasswordModal ───────────────────────────────────────
function ChangePasswordModal({
  open,
  onClose,
  token,
}: {
  open: boolean;
  onClose: () => void;
  token: string | null;
}) {
  const { actor } = useActor();
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setError("");
    };
  const toggleShow = (k: keyof typeof show) => () =>
    setShow((p) => ({ ...p, [k]: !p[k] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current || !form.newPass || !form.confirm) {
      setError("All fields are required");
      return;
    }
    if (form.newPass !== form.confirm) {
      setError("New passwords do not match");
      return;
    }
    if (form.newPass.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (!actor || !token) {
      setError("Service not ready");
      return;
    }

    setIsLoading(true);
    try {
      const result = await actor.changePassword(
        token,
        form.current,
        form.newPass,
      );
      if (result === ChangePasswordResult.ok) {
        setSuccess(true);
        toast.success("Password changed successfully");
        setTimeout(() => {
          setSuccess(false);
          onClose();
          setForm({ current: "", newPass: "", confirm: "" });
        }, 1500);
      } else if (result === ChangePasswordResult.invalidCredentials) {
        setError("Current password is incorrect");
      } else {
        setError("Session expired. Please log in again.");
      }
    } catch {
      setError("Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setForm({ current: "", newPass: "", confirm: "" });
      setError("");
      setSuccess(false);
    }
  };

  const PasswordField = ({
    id,
    label,
    field,
    placeholder,
    autocomplete,
  }: {
    id: string;
    label: string;
    field: keyof typeof form;
    placeholder: string;
    autocomplete: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          type={show[field as keyof typeof show] ? "text" : "password"}
          autoComplete={autocomplete}
          placeholder={placeholder}
          value={form[field]}
          onChange={update(field)}
          className="pl-10 pr-10"
          data-ocid={`profile.change_password.${field}.input`}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={toggleShow(field as keyof typeof show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          data-ocid={`profile.change_password.${field}.toggle`}
        >
          {show[field as keyof typeof show] ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent data-ocid="profile.change_password.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div
            className="flex flex-col items-center py-6 gap-3"
            data-ocid="profile.change_password.success_state"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">
              Password updated!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                data-ocid="profile.change_password.error_state"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <PasswordField
              id="cp-current"
              label="Current Password"
              field="current"
              placeholder="Your current password"
              autocomplete="current-password"
            />
            <PasswordField
              id="cp-new"
              label="New Password"
              field="newPass"
              placeholder="Min. 6 characters"
              autocomplete="new-password"
            />
            <PasswordField
              id="cp-confirm"
              label="Confirm New Password"
              field="confirm"
              placeholder="Repeat new password"
              autocomplete="new-password"
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isLoading}
                data-ocid="profile.change_password.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
                data-ocid="profile.change_password.submit_button"
              >
                {isLoading ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── ChangePinModal ────────────────────────────────────────────
function ChangePinModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { changePin, currentUser } = useAuth();
  const [step, setStep] = useState<"verify" | "new">("verify");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerifyOld = () => {
    if (oldPin.length < 4) {
      setError("Enter your current 4-digit PIN");
      return;
    }
    const stored = localStorage.getItem(`sdcorp_pin_${currentUser?.userId}`);
    if (!stored || btoa(oldPin) !== stored) {
      setError("Incorrect PIN");
      setOldPin("");
      return;
    }
    setError("");
    setStep("new");
  };

  const handleSaveNew = () => {
    if (newPin.length < 4) {
      setError("Enter a new 4-digit PIN");
      return;
    }
    if (confirmPin.length < 4) {
      setError("Confirm your new PIN");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      setConfirmPin("");
      return;
    }
    const ok = changePin(oldPin, newPin);
    if (ok) {
      setSuccess(true);
      toast.success("PIN changed successfully");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError("Failed to update PIN");
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("verify");
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setError("");
      setSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent data-ocid="profile.change_pin.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Change PIN</DialogTitle>
          <DialogDescription>
            {step === "verify"
              ? "Verify your current PIN first."
              : "Set your new 4-digit PIN."}
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div
            className="flex flex-col items-center py-6 gap-3"
            data-ocid="profile.change_pin.success_state"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">PIN updated!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                data-ocid="profile.change_pin.error_state"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {step === "verify" ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Enter current PIN
                  </p>
                  <PinBoxes
                    value={oldPin}
                    onChange={(v) => {
                      setOldPin(v);
                      setError("");
                    }}
                    ocidPrefix="profile.change_pin.old_pin"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    data-ocid="profile.change_pin.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleVerifyOld}
                    disabled={oldPin.length < 4}
                    data-ocid="profile.change_pin.verify_button"
                  >
                    Verify
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      New PIN
                    </p>
                    <PinBoxes
                      value={newPin}
                      onChange={(v) => {
                        setNewPin(v);
                        setError("");
                      }}
                      ocidPrefix="profile.change_pin.new_pin"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Confirm new PIN
                    </p>
                    <PinBoxes
                      value={confirmPin}
                      onChange={(v) => {
                        setConfirmPin(v);
                        setError("");
                      }}
                      ocidPrefix="profile.change_pin.confirm_pin"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    data-ocid="profile.change_pin.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveNew}
                    disabled={newPin.length < 4 || confirmPin.length < 4}
                    data-ocid="profile.change_pin.submit_button"
                  >
                    Save PIN
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── ProfilePage ───────────────────────────────────────────────
export default function ProfilePage() {
  const { currentUser, sessionToken, logout } = useAuth();
  const navigate = useNavigate();

  const [changePwOpen, setChangePwOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);

  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const infoRows = [
    { icon: User, label: "Full Name", value: currentUser?.name ?? "—" },
    { icon: Mail, label: "Email", value: currentUser?.email ?? "—" },
    { icon: Shield, label: "User ID", value: currentUser?.userId ?? "—" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account
        </p>
      </motion.div>

      {/* Avatar + info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
      >
        <Card className="shadow-card" data-ocid="profile.card">
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shadow-md">
                {initials}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-display font-bold text-foreground">
                  {currentUser?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{currentUser?.userId}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Info rows */}
            <div className="space-y-4">
              {infoRows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account settings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base font-display">
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {/* Change Password */}
            <button
              type="button"
              onClick={() => setChangePwOpen(true)}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-muted/50 transition-colors group"
              data-ocid="profile.change_password.button"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Change Password
                </p>
                <p className="text-xs text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <Separator />

            {/* Change PIN */}
            <button
              type="button"
              onClick={() => setChangePinOpen(true)}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-muted/50 transition-colors group"
              data-ocid="profile.change_pin.button"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Change PIN
                </p>
                <p className="text-xs text-muted-foreground">
                  Update your 4-digit unlock PIN
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <Separator />

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-destructive/5 transition-colors group"
              data-ocid="profile.logout.button"
            >
              <div className="w-9 h-9 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-destructive">Log Out</p>
                <p className="text-xs text-muted-foreground">
                  Sign out of your account
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            </button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        token={sessionToken}
      />
      <ChangePinModal
        open={changePinOpen}
        onClose={() => setChangePinOpen(false)}
      />
    </div>
  );
}
