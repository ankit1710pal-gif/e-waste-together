import { defineFunction } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
  name: "campus-pre-sign-up",
  entry: "./handler.ts",
  resourceGroupName: "auth",
});
