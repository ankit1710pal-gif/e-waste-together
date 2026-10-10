import type { PreSignUpTriggerEvent } from "aws-lambda";

export async function handler(event: PreSignUpTriggerEvent) {
  const email = event.request.userAttributes.email;
  if (typeof email !== "string" || !/^[^\s@]+@iiitm\.ac\.in$/i.test(email)) {
    throw new Error("Use your @iiitm.ac.in campus email to register.");
  }
  // Cognito still verifies ownership; admission and organiser status are manual.
  return event;
}
