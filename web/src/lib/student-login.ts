import { z } from "zod";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";

const origin = "https://student-identity.onrender.com";
export async function verifyStudent(
  studentId: string,
  password: string,
  fetcher: typeof fetch = fetch,
) {
  const signal = AbortSignal.timeout(15000);
  async function read(path: string, options: RequestInit) {
    const response = await fetcher(origin + path, {
      ...options,
      signal,
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok)
      throw new APIError(
        response.status === 401 || response.status === 403
          ? "UNAUTHORIZED"
          : "BAD_GATEWAY",
        {
          message:
            response.status === 401 || response.status === 403
              ? "Student Identity rejected these credentials or account access."
              : "Student Identity is temporarily unavailable.",
        },
      );
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Missing Identity response");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 32768) {
        await reader.cancel();
        throw new Error("Oversized Identity response");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  try {
    const login = z
      .object({ token: z.string().min(20).max(12000) })
      .parse(
        await read("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, password }),
        }),
      );
    // The token comes directly from the fixed HTTPS provider, never from the caller.
    // Authenticated /me below checks it server-side; decoding alone grants no access.
    const tokenInfo = z
      .object({ sub: z.string(), role: z.literal("student"), exp: z.number() })
      .parse(
        JSON.parse(
          Buffer.from(login.token.split(".")[1], "base64url").toString("utf8"),
        ),
      );
    const profile = z
      .object({
        student_id: z.string().regex(/^\d{10}$/),
        first_name: z.string().max(160),
        last_name: z.string().max(160),
      })
      .parse(
        await read("/me", {
          headers: { Authorization: "Bearer " + login.token },
        }),
      );
    if (
      profile.student_id !== studentId ||
      tokenInfo.sub !== studentId ||
      tokenInfo.exp * 1000 <= Date.now()
    )
      throw new APIError("UNAUTHORIZED", {
        message: "Student identity does not match this account.",
      });
    return {
      studentId,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      expiresAt: new Date(
        Math.min(tokenInfo.exp * 1000, Date.now() + 15 * 60 * 1000),
      ),
    };
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError("BAD_GATEWAY", {
      message:
        "Unable to verify your student account with Student Identity. Please try again.",
    });
  }
}

export function studentIdentityLogin(fetcher: typeof fetch = fetch) {
  return {
    id: "student-identity-login",
    endpoints: {
      signInStudentIdentity: createAuthEndpoint(
        "/sign-in/student-identity",
        {
          method: "POST",
          body: z.object({
            studentId: z.string().regex(/^\d{10}$/),
            password: z.string().min(1).max(128),
          }),
        },
        async (ctx) => {
          const requestOrigin =
            ctx.headers?.get("origin") ?? ctx.request?.headers.get("origin");
          if (requestOrigin !== new URL(ctx.context.baseURL).origin)
            throw new APIError("FORBIDDEN", {
              message: "Request origin is not allowed.",
            });
          const profile = await verifyStudent(
            ctx.body.studentId,
            ctx.body.password,
            fetcher,
          );
          const email = `${profile.studentId}@student-identity.internly.invalid`;
          const adapter = ctx.context.internalAdapter;
          let user = (await adapter.findUserByEmail(email))?.user;
          if (!user)
            user = await adapter.createUser(
              {
                email,
                name: profile.name,
                emailVerified: false,
                role: "student",
                studentId: profile.studentId,
                authSource: "student-identity",
              },
              { method: "custom" },
            );
          const identityUser = user as typeof user & {
            role?: string;
            studentId?: string;
            authSource?: string;
          };
          if (
            identityUser.role !== "student" ||
            identityUser.studentId !== profile.studentId ||
            identityUser.authSource !== "student-identity"
          )
            throw new APIError("FORBIDDEN", {
              message: "This identity is not linked to a student account.",
            });
          const session = await adapter.createSession(
            user.id,
            true,
            { expiresAt: profile.expiresAt },
            true,
          );
          if (!session)
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Unable to create your session.",
            });
          await setSessionCookie(ctx, { session, user }, true);
          return ctx.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              role: "student",
              studentId: profile.studentId,
            },
          });
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path: string) => path === "/sign-in/student-identity",
        window: 60,
        max: 5,
      },
    ],
  };
}
