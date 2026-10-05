import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/api/auth";
import { toApiError } from "@/api/apiError";
import { PasswordField } from "@/components/auth/FormField";
import { useToast } from "@/components/useToast";
import { useLogout } from "@/hooks/useLogout";
import { applyFieldErrors } from "@/lib/formErrors";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

const formatMemberSince = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

export default function AccountPage() {
  const showToast = useToast();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async ({ currentPassword, newPassword }: ChangePasswordValues) => {
    try {
      // The server signs out every other device and hands this one a fresh session.
      setAuth(await changePassword({ currentPassword, newPassword }));
      reset();
      showToast("Password updated. Other devices were signed out.", "success");
    } catch (error) {
      const { status, message, fieldErrors } = toApiError(error);

      if (status === 429) {
        showToast("Too many attempts. Please wait a few minutes and try again.", "error");
      } else if (!applyFieldErrors(setError, ["currentPassword", "newPassword"], fieldErrors)) {
        showToast(message || "Could not change the password", "error");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md md:max-w-xl mx-auto px-6 pt-8 pb-10 space-y-8 text-[var(--text-primary)]">
      {/* PROFILE HEADER */}
      <section aria-labelledby="profile-heading" className="flex flex-col items-center text-center space-y-3 pt-4">
        <h1 id="profile-heading" className="sr-only">
          Profile
        </h1>
        <div
          aria-hidden="true"
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-[var(--btn-bg)] text-[var(--btn-text)]"
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold break-all">{user.username}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Member since {formatMemberSince(user.createdAt)}
          </p>
        </div>
      </section>

      <section aria-labelledby="password-heading" className="space-y-4">
        <h2 id="password-heading" className="text-base font-semibold">
          Change password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Current password"
            autoComplete="current-password"
            registration={register("currentPassword")}
            error={errors.currentPassword?.message}
          />
          <PasswordField
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            registration={register("newPassword")}
            error={errors.newPassword?.message}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            registration={register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] font-semibold py-3 rounded-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 outline-none"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section aria-labelledby="session-heading" className="space-y-3">
        <h2 id="session-heading" className="sr-only">
          Session
        </h2>
        <button
          type="button"
          onClick={logout}
          className="w-full py-3 rounded-lg font-semibold border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-input)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 outline-none"
        >
          Log out
        </button>
      </section>
    </div>
  );
}
