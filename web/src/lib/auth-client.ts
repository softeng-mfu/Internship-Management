"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          defaultValue: "student",
          input: false,
        },
        studentId: { type: "string", required: false, input: false },
        authSource: {
          type: "string",
          required: true,
          defaultValue: "local",
          input: false,
        },
      },
    }),
  ],
});
