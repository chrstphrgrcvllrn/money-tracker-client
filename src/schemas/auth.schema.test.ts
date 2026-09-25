import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  usernameSchema,
} from "@/schemas/auth.schema";

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("username rules (must match the backend)", () => {
  it.each(["abc", "a.b_c", "USER_1", "x".repeat(30)])("accepts %s", (name) => {
    expect(usernameSchema.safeParse(name).success).toBe(true);
  });

  it.each([
    ["ab", "at least 3"],
    ["x".repeat(31), "at most 30"],
    ["bad name", "letters, numbers"],
    ["emoji😀", "letters, numbers"],
    ["dash-name", "letters, numbers"],
  ])("rejects %s", (name, message) => {
    const result = usernameSchema.safeParse(name);
    expect(result.success).toBe(false);
    expect(firstError(result)).toContain(message);
  });
});

describe("registerSchema", () => {
  const valid = { username: "alice", password: "password123", confirmPassword: "password123" };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the passwords to match, and reports it on confirmPassword", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different1" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("enforces 8 to 72 characters (bcrypt's limit)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "1234567", confirmPassword: "1234567" }).success).toBe(false);
    const long = "x".repeat(73);
    expect(registerSchema.safeParse({ ...valid, password: long, confirmPassword: long }).success).toBe(false);
    const max = "x".repeat(72);
    expect(registerSchema.safeParse({ ...valid, password: max, confirmPassword: max }).success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("only requires both fields (registration rules don't apply, so the migrated owner can sign in)", () => {
    expect(loginSchema.safeParse({ username: "chrstphrvllrn", password: "abc" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "old-password", newPassword: "new-password", confirmPassword: "new-password" };

  it("accepts valid input", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a confirmation mismatch and an unchanged password", () => {
    expect(changePasswordSchema.safeParse({ ...valid, confirmPassword: "nope-nope" }).success).toBe(false);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "same-password", newPassword: "same-password", confirmPassword: "same-password" }).success
    ).toBe(false);
  });
});
