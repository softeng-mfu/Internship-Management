import { z } from "zod";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";

export function advisorRegistration() {
  return {
    id: "advisor-registration",
    endpoints: {
      registerAdvisor: createAuthEndpoint(
        "/sign-up/advisor",
        {
          method: "POST",
          body: z
            .object({
              name: z.string().trim().min(2).max(100),
              email: z
                .string()
                .email()
                .max(254)
                .transform((value) => value.trim().toLowerCase()),
              password: z.string().min(12).max(128),
            })
            .strict(),
        },
        async (ctx) => {
          const origin =
            ctx.headers?.get("origin") ?? ctx.request?.headers.get("origin");
          if (origin !== new URL(ctx.context.baseURL).origin)
            throw new APIError("FORBIDDEN", {
              message: "Request origin is not allowed.",
            });
          const adapter = ctx.context.internalAdapter;
          if (await adapter.findUserByEmail(ctx.body.email))
            throw new APIError("CONFLICT", {
              message:
                "An account already uses this email. Sign in or contact your administrator.",
            });
          const password = await ctx.context.password.hash(ctx.body.password);
          // Registration grants an empty advisor workspace, never student assignments or admin rights.
          const user = await adapter.createUser(
            {
              name: ctx.body.name,
              email: ctx.body.email,
              emailVerified: false,
              role: "advisor",
              authSource: "local",
            },
            { method: "custom" },
          );
          try {
            await adapter.createAccount({
              userId: user.id,
              accountId: user.id,
              providerId: "credential",
              password,
            });
          } catch {
            await adapter.deleteUser(user.id);
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Account creation failed. Please try again.",
            });
          }
          const session = await adapter.createSession(user.id, false);
          if (!session)
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Your account was created. Please sign in.",
            });
          await setSessionCookie(ctx, { user, session });
          return ctx.json({
            success: true,
            user: { id: user.id, name: user.name, role: "advisor" },
          });
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path: string) => path === "/sign-up/advisor",
        window: 60,
        max: 5,
      },
    ],
  };
}
