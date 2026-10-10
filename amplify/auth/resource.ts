import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";
export const auth = defineAuth({
  loginWith: { email: true },
  groups: ["IIITM_MEMBERS", "IIITM_ORGANISERS"],
  triggers: { preSignUp },
});
