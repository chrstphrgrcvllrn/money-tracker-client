import { describe, expect, it } from "vitest";
import { readUserItem, writeUserItem } from "@/lib/userStorage";

describe("per-user browser storage", () => {
  it("keeps two users on the same browser apart", () => {
    writeUserItem("budgets", "alice-id", "alice's budgets");
    writeUserItem("budgets", "bob-id", "bob's budgets");

    expect(readUserItem("budgets", "alice-id")).toBe("alice's budgets");
    expect(readUserItem("budgets", "bob-id")).toBe("bob's budgets");
  });

  it("a new user starts with nothing, even if someone else has saved data", () => {
    writeUserItem("budgets", "alice-id", "alice's budgets");
    expect(readUserItem("budgets", "carol-id")).toBeNull();
  });

  it("the first user to open the app adopts pre-accounts data once; nobody else gets it", () => {
    localStorage.setItem("budgets", "legacy value"); // saved before accounts existed

    expect(readUserItem("budgets", "owner-id")).toBe("legacy value");
    expect(localStorage.getItem("budgets")).toBeNull(); // bare key removed
    expect(readUserItem("budgets", "someone-else")).toBeNull();
    expect(readUserItem("budgets", "owner-id")).toBe("legacy value"); // still theirs
  });
});
