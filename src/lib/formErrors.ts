import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

// Puts server-side field errors ({ username: "..." }) on the matching inputs.
// Returns true if at least one landed on a real field.
export const applyFieldErrors = <T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  fieldErrors?: Record<string, string>
): boolean => {
  let applied = false;
  for (const field of fields) {
    const message = fieldErrors?.[field];
    if (message) {
      setError(field, { type: "server", message });
      applied = true;
    }
  }
  return applied;
};
