import { describe, expect, it } from "vitest";
import type { PreSignUpTriggerEvent } from "aws-lambda";
import { handler } from "./handler";

function event(email?: string) {
  return {
    request: { userAttributes: email === undefined ? {} : { email } },
    response: {},
  } as PreSignUpTriggerEvent;
}
describe("Campus signup", () => {
  it.each(["student@iiitm.ac.in", "Student@IIITM.AC.IN"])(
    "allows exact campus domain: %s",
    async (email) => {
      const input = event(email);
      expect(await handler(input)).toBe(input);
      expect(input.response).toEqual({});
    },
  );
  it.each([
    undefined,
    "",
    "student@gmail.com",
    "student@iiitm.ac.in.evil.com",
    "student@other.iiitm.ac.in",
    "student@@iiitm.ac.in",
  ])("rejects non-campus or malformed email: %s", async (email) => {
    await expect(handler(event(email))).rejects.toThrow("campus email");
  });
});
