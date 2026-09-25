import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as registerAccount } from "@/api/auth";
import { toApiError } from "@/api/apiError";
import AuthCard from "@/components/auth/AuthCard";
import { PasswordField, TextField } from "@/components/auth/FormField";
import { useToast } from "@/components/useToast";
import { applyFieldErrors } from "@/lib/formErrors";
import { registerSchema, type RegisterValues } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

export default function RegisterPage() {
  const showToast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  // Signs in automatically: PublicOnlyRoute then moves them into the app.
  const onSubmit = async ({ username, password }: RegisterValues) => {
    try {
      setAuth(await registerAccount({ username, password }));
      showToast("Account created", "success");
    } catch (error) {
      const { status, message, fieldErrors } = toApiError(error);

      if (status === 409) {
        setError("username", { type: "server", message: "That username is already taken" });
      } else if (status === 429) {
        showToast("Too many attempts. Please wait a few minutes and try again.", "error");
      } else if (!applyFieldErrors(setError, ["username", "password"], fieldErrors)) {
        showToast(message || "Could not create the account", "error");
      }
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Your data stays private to you"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
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
          autoComplete="new-password"
          registration={register("password")}
          error={errors.password?.message}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold py-3 rounded-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 outline-none"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
