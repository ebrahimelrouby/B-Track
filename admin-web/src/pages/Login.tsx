import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Dumbbell, Eye, EyeOff, Languages, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuthStore } from "@/auth/authStore";
import { login } from "@/api/exercises";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});
type FormData = z.infer<typeof schema>;

const HIGHLIGHTS = [
  { icon: Dumbbell, text: "Manage the full exercise catalog" },
  { icon: Upload, text: "Import and review new exercises" },
  { icon: Languages, text: "Translate content into 4 languages" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login: storeLogin, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const authenticated = isAuthenticated();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (authenticated) navigate("/", { replace: true });
  }, [authenticated, navigate]);

  if (authenticated) return null;

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const res = await login(data.email, data.password);
      if (res.role !== "ADMIN" && res.role !== "SUPER_ADMIN") {
        setError("Access denied. Admin role required.");
        return;
      }
      storeLogin(res);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Login failed. Check your credentials.");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">BT</span>
          </div>
          <span className="text-lg font-semibold">B-Track Admin</span>
        </div>
        <div className="relative space-y-8">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Keep the exercise catalog in shape.
          </h1>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-50/10">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-zinc-500">
          Admin and Super Admin access only.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center bg-muted/30 p-6">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">BT</span>
              </div>
              <span className="text-lg font-semibold">B-Track Admin</span>
            </div>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Admin access only. Use your admin credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@btrack.app"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
