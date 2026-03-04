import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  HardHat,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function RegisterPage() {
  const { actor } = useActor();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      setError("");
    };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Full name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Invalid email";
    if (!form.userId.trim()) errors.userId = "User ID is required";
    else if (/\s/.test(form.userId))
      errors.userId = "User ID cannot contain spaces";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword)
      errors.confirmPassword = "Please confirm password";
    else if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (!actor) {
      setError("Service not ready. Please try again.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const result = await actor.registerUser(
        form.userId.trim(),
        form.name.trim(),
        form.email.trim(),
        form.password,
      );

      if (result.__kind__ === "ok") {
        setSuccess(true);
        setTimeout(() => navigate({ to: "/login" }), 2500);
      } else if (result.__kind__ === "userIdTaken") {
        setFieldErrors((prev) => ({
          ...prev,
          userId: "This User ID is already taken",
        }));
      } else if (result.__kind__ === "emailTaken") {
        setFieldErrors((prev) => ({
          ...prev,
          email: "This email is already registered",
        }));
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      if (
        message.toLowerCase().includes("userid") ||
        message.toLowerCase().includes("user id")
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          userId: "This User ID is already taken",
        }));
      } else if (message.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "This email is already registered",
        }));
      } else {
        setError(
          "Registration failed. Please check your details and try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
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
          <p className="text-sm text-muted-foreground mt-1">
            Construction Management
          </p>
        </motion.div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="shadow-card-hover border-border/60">
              <CardContent
                className="pt-10 pb-10 px-6 text-center"
                data-ocid="register.success_state"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-2">
                  Account Created!
                </h2>
                <p className="text-sm text-muted-foreground mb-1">
                  Your account has been created successfully.
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to login…
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="shadow-card-hover border-border/60">
            <CardHeader className="pb-2 pt-6 px-6">
              <h2 className="text-xl font-display font-bold text-foreground">
                Create Account
              </h2>
              <p className="text-sm text-muted-foreground">
                Fill in your details to get started
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Global error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                    data-ocid="register.error_state"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={update("name")}
                      className={`pl-10 ${fieldErrors.name ? "border-destructive" : ""}`}
                      data-ocid="register.name.input"
                      disabled={isLoading}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.name.error_state"
                    >
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={update("email")}
                      className={`pl-10 ${fieldErrors.email ? "border-destructive" : ""}`}
                      data-ocid="register.email.input"
                      disabled={isLoading}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.email.error_state"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* User ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-userId" className="text-sm font-medium">
                    User ID
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-userId"
                      type="text"
                      autoComplete="username"
                      placeholder="Choose a unique ID (no spaces)"
                      value={form.userId}
                      onChange={update("userId")}
                      className={`pl-10 ${fieldErrors.userId ? "border-destructive" : ""}`}
                      data-ocid="register.user_id.input"
                      disabled={isLoading}
                    />
                  </div>
                  {fieldErrors.userId && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.user_id.error_state"
                    >
                      {fieldErrors.userId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70">
                    Tip: Use a simple username without spaces (e.g.
                    &quot;twilight&quot; or &quot;john123&quot;)
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={update("password")}
                      className={`pl-10 pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                      data-ocid="register.password.input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide" : "Show"}
                      data-ocid="register.password.toggle"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.password.error_state"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={update("confirmPassword")}
                      className={`pl-10 pr-10 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
                      data-ocid="register.confirm_password.input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? "Hide" : "Show"}
                      data-ocid="register.confirm_password.toggle"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.confirm_password.error_state"
                    >
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-ocid="register.submit.button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Back to login */}
                <Link to="/login" className="block">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground"
                    data-ocid="register.back.button"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
