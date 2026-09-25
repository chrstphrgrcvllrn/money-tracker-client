import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/api/auth";
import { toApiError } from "@/api/apiError";
import AuthCard from "@/components/auth/AuthCard";
import { PasswordField, TextField } from "@/components/auth/FormField";
import { useToast } from "@/components/useToast";
import { loginSchema, type LoginValues } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const showToast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // On success PublicOnlyRoute sees the new session and sends them to the
  // page they originally wanted (or home).
  const onSubmit = async (values: LoginValues) => {
    try {
      setAuth(await login(values));
      showToast("Signed in", "success");
    } catch (error) {
      const { status, message } = toApiError(error);

      if (status === 401) showToast("Invalid username or password", "error");
      else if (status === 429) showToast("Too many attempts. Please wait a few minutes and try again.", "error");
      else showToast(message || "Could not sign in", "error");
    }
  };

  return (
    <AuthCard
      title="Money Tracker"
      subtitle="Sign in to your account"
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField
          id="username"
          label="Username"
          autoComplete="username"
          autoFocus
          registration={register("username")}
          error={errors.username?.message}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold py-3 rounded-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 outline-none"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
