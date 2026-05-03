"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginRole = "customer" | "staff" | "admin";

type AuthForm = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const initialForm: AuthForm = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
};

const roleOptions: Array<{
  role: LoginRole;
  title: string;
  description: string;
  icon: LucideIcon;
  credentials?: { email: string; password: string };
}> = [
  {
    role: "customer",
    title: "Customer",
    description: "Use your registered Gmail or email address and password.",
    icon: User,
  },
  {
    role: "staff",
    title: "Staff",
    description: "Use an active staff username created by admin.",
    icon: Briefcase,
  },
  {
    role: "admin",
    title: "Admin",
    description: "Use the gallery admin account.",
    icon: ShieldCheck,
    credentials: {
      email: "admin",
      password: "artspace2024",
    },
  },
];

function isSafeRedirect(path: string | null) {
  return Boolean(
    path &&
      path.startsWith("/") &&
      !path.startsWith("//") &&
      !path.startsWith("/api")
  );
}

function roleLabel(role: LoginRole) {
  if (role === "admin") return "Admin";
  if (role === "staff") return "Staff";
  return "Customer";
}

function defaultRedirectForRole(role: LoginRole) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/customer/dashboard";
}

function getAllowedRedirect(next: string | null, role: LoginRole) {
  if (!isSafeRedirect(next)) {
    return defaultRedirectForRole(role);
  }

  const safeNext = next!;

  if (role === "admin") {
    if (safeNext.startsWith("/admin")) return safeNext;
    return "/admin";
  }

  if (role === "staff") {
    if (safeNext.startsWith("/staff")) return safeNext;
    return "/staff";
  }

  if (role === "customer") {
    if (safeNext.startsWith("/customer")) return safeNext;
    if (safeNext.startsWith("/shop")) return safeNext;
    if (safeNext.startsWith("/cart")) return safeNext;
    if (safeNext.startsWith("/artwork")) return safeNext;
    if (safeNext.startsWith("/collections")) return safeNext;
    if (safeNext.startsWith("/artists")) return safeNext;
    if (safeNext.startsWith("/sale")) return safeNext;
    return "/customer/dashboard";
  }

  return defaultRedirectForRole(role);
}

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AuthForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const selectRole = (role: LoginRole) => {
    setSelectedRole(role);
    setIsSignUp(false);
    setFormError("");
    setFormSuccess("");

    const option = roleOptions.find((item) => item.role === role);

    if (option?.credentials) {
      setFormData((current) => ({
        ...current,
        email: option.credentials!.email,
        password: option.credentials!.password,
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      email: "",
      password: "",
    }));
  };

  const handleGoogleLogin = async () => {
    setFormError("");
    setFormSuccess("");
    setIsGoogleLoading(true);

    await signIn("google", {
      callbackUrl: "/customer/dashboard",
      redirect: true,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    const identifier = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!identifier || !password) {
      setFormError("Email/username and password are required.");
      return;
    }

    if (isSignUp) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setFormError("First name and last name are required.");
        return;
      }

      if (!identifier.includes("@")) {
        setFormError("Enter a valid email address.");
        return;
      }

      if (password.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }

      if (password !== formData.confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";

      const payload = isSignUp
        ? {
            ...formData,
            email: identifier,
          }
        : {
            identifier,
            password,
            role: selectedRole,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(
          result.error ||
            (isSignUp ? "Unable to create account." : "Unable to sign in.")
        );
        return;
      }

      const finalRole = (result.role || selectedRole) as LoginRole;

      if (!isSignUp && typeof window !== "undefined") {
        localStorage.setItem(
          "galeria_user",
          JSON.stringify({
            role: finalRole,
            identifier,
            name: roleLabel(finalRole),
          })
        );
      }

      setFormSuccess(
        isSignUp
          ? "Account created. Redirecting..."
          : `${roleLabel(finalRole)} signed in. Redirecting...`
      );

      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;

      const redirectTo = isSignUp
        ? "/customer/dashboard"
        : getAllowedRedirect(next, finalRole);

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setFormError(
        "Unable to reach the authentication server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const selectedOption = roleOptions.find(
    (item) => item.role === selectedRole
  )!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.14),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(139,92,246,0.14),transparent_34%)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-border bg-card/95 text-card-foreground shadow-2xl backdrop-blur"
        >
          <div className="bg-gradient-to-r from-orange-500/15 via-pink-500/15 to-violet-600/15 px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 shadow-lg shadow-pink-500/20">
              <User className="h-7 w-7 text-white" />
            </div>

            <h1 className="mb-3 font-serif text-3xl text-foreground md:text-4xl">
              {isSignUp ? "Create Account" : "Sign In"}
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              {isSignUp
                ? "Create a customer account with a valid Gmail or email address."
                : "Choose your role, then sign in using your saved credentials."}
            </p>
          </div>

          <div className="p-6">
            {!isSignUp && (
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedRole === option.role;

                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => selectRole(option.role)}
                      className={`rounded-2xl border p-4 text-left transition hover:border-accent hover:bg-accent/10 ${
                        isSelected
                          ? "border-accent bg-gradient-to-br from-orange-500/15 via-pink-500/15 to-violet-600/15 shadow-md"
                          : "border-border bg-background/70"
                      }`}
                    >
                      <Icon className="mb-3 h-5 w-5 text-accent" />

                      <div className="font-bold text-foreground">
                        {option.title}
                      </div>

                      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!isSignUp && selectedRole === "customer" && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="relative z-50 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-black text-[#4285f4] shadow-sm">
                    G
                  </span>
                  {isGoogleLoading
                    ? "Opening Google..."
                    : "Continue with Google"}
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    or
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                {formSuccess}
              </div>
            )}

            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Maria"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="h-12 border-border bg-background pl-10 text-foreground"
                        required={isSignUp}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Reyes"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="h-12 border-border bg-background pl-10 text-foreground"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {isSignUp
                    ? "Email Address"
                    : selectedRole === "admin"
                      ? "Admin Username"
                      : selectedRole === "staff"
                        ? "Staff Username"
                        : "Customer Gmail or Email"}
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    name="email"
                    type={isSignUp ? "email" : "text"}
                    placeholder={
                      isSignUp
                        ? "maria@gmail.com"
                        : selectedRole === "admin"
                          ? "admin"
                          : selectedRole === "staff"
                            ? "username from Admin > Staff"
                            : "maria@gmail.com"
                    }
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12 border-border bg-background pl-10 text-foreground"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+63 917 000 0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-12 border-border bg-background pl-10 text-foreground"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isSignUp
                        ? "At least 8 characters"
                        : selectedRole === "admin"
                          ? "artspace2024"
                          : selectedRole === "staff"
                            ? "staff password"
                            : "your account password"
                    }
                    value={formData.password}
                    onChange={handleInputChange}
                    className="h-12 border-border bg-background pl-10 pr-10 text-foreground"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Enter Password Again
                  </Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter the same password again"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="h-12 border-border bg-background pl-10 pr-10 text-foreground"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              {!isSignUp && (
                <div className="rounded-xl bg-muted px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                  Selected role:{" "}
                  <span className="font-semibold text-foreground">
                    {selectedOption.title}
                  </span>
                  . {selectedOption.description}

                  {selectedRole === "staff" && (
                    <span className="block">
                      Staff login uses the{" "}
                      <span className="font-semibold text-foreground">
                        username
                      </span>{" "}
                      and password saved in{" "}
                      <span className="font-semibold text-foreground">
                        Admin &gt; Staff
                      </span>
                      . Seeded accounts use password{" "}
                      <span className="font-semibold text-foreground">
                        artspace2024
                      </span>
                      .
                    </span>
                  )}

                  {selectedRole === "admin" && (
                    <span className="block">
                      Admin credentials:{" "}
                      <span className="font-semibold text-foreground">
                        admin
                      </span>{" "}
                      /{" "}
                      <span className="font-semibold text-foreground">
                        artspace2024
                      </span>
                    </span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-sm font-bold tracking-wide text-white shadow-lg shadow-pink-500/20 hover:opacity-95"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : isSignUp
                    ? "Create Account"
                    : `Sign In as ${roleLabel(selectedRole)}`}

                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                {isSignUp
                  ? "Already have an account?"
                  : "Need to create a customer account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp((value) => !value);
                    setFormData(initialForm);
                    setSelectedRole("customer");
                    setFormError("");
                    setFormSuccess("");
                  }}
                  className="font-semibold text-accent hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </motion.div>

            {isSignUp && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-4 text-center text-xs text-muted-foreground"
              >
                Accounts are stored in the{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  customers
                </code>{" "}
                table using a scrypt password hash.
              </motion.p>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}