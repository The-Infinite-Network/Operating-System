import { describe, expect, it } from "vitest";
import { auth, isCompleteFirebaseConfig } from "./firebase";

describe("firebase local configuration guard", () => {
  it("does not create live auth when required Firebase env values are missing", () => {
    expect(
      isCompleteFirebaseConfig({
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      }),
    ).toBe(false);
    expect(auth).toBeNull();
  });
});
