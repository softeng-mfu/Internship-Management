import { z } from "zod";
import { ApiError, secretMatches } from "./core";
const origin = "https://student-identity.onrender.com";
const envelope = z.object({
  claims: z.object({
    verified: z.boolean(),
    profileComplete: z.boolean(),
    skills: z.array(z.string().max(120)).max(100),
    missingFields: z.array(z.string().max(120)).max(30).optional(),
    name: z
      .object({
        first: z.string().max(160).optional(),
        last: z.string().max(160).optional(),
      })
      .optional(),
  }),
  issuedAt: z.string().datetime({ offset: true }),
});
export async function identityClaims(
  request: Request,
  fetcher: typeof fetch = fetch,
  authorize?: (request: Request) => Promise<void>,
) {
  const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };
  try {
    if (authorize) await authorize(request);
    else {
    const operator = process.env.INTEGRATION_ADMIN_TOKEN;
    if (!operator || operator.length < 32)
      throw new ApiError(
        503,
        "IDENTITY_CONFIGURATION_MISSING",
        "Operator access is not configured.",
      );
    if (
      !secretMatches(request.headers.get("Authorization"), "Bearer " + operator)
    )
      throw new ApiError(401, "UNAUTHORIZED", "An operator token is required.");
    }
    if (
      process.env.IDENTITY_SERVICE_CONFIRMED !== "true" ||
      !process.env.IDENTITY_API_KEY ||
      !process.env.IDENTITY_CLIENT_ID
    )
      throw new ApiError(
        503,
        "IDENTITY_SETUP_PENDING",
        "The Identity team must confirm the Internship service registration and key before claims can be requested.",
      );
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new ApiError(415, "CONTENT_TYPE_REQUIRED", "Use application/json.");
    const { readBody } = await import("./core");
    const input = z
      .object({ studentId: z.string().regex(/^\d{10}$/) })
      .strict()
      .safeParse(await readBody(request));
    if (!input.success)
      throw new ApiError(
        400,
        "INVALID_STUDENT_ID",
        "Provide a ten-digit student ID.",
      );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const result = await fetcher(
        `${origin}/students/${input.data.studentId}/claims`,
        {
          headers: {
            "X-API-Key": process.env.IDENTITY_API_KEY,
            Accept: "application/json",
          },
          redirect: "error",
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (result.status === 401)
        throw new ApiError(
          502,
          "IDENTITY_KEY_REJECTED",
          "The Identity service rejected the service key. Contact the Identity team.",
        );
      if (result.status === 403)
        throw new ApiError(
          403,
          "IDENTITY_CONSENT_REQUIRED",
          "Claims access was denied. Check profile:read consent for the registered service, its scope, and account status.",
        );
      if (result.status === 404)
        throw new ApiError(
          404,
          "IDENTITY_STUDENT_NOT_FOUND",
          "The Identity service could not find this student.",
        );
      if (!result.ok)
        throw new ApiError(
          503,
          "IDENTITY_UNAVAILABLE",
          "Student Identity is temporarily unavailable.",
          true,
        );
      const reader = result.body?.getReader();
      if (!reader)
        throw new ApiError(
          502,
          "IDENTITY_INVALID_RESPONSE",
          "Identity returned an invalid response.",
        );
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 32768) {
          await reader.cancel();
          throw new ApiError(
            502,
            "IDENTITY_INVALID_RESPONSE",
            "Identity returned an oversized response.",
          );
        }
        chunks.push(value);
      }
      let raw;
      try {
        raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        throw new ApiError(
          502,
          "IDENTITY_INVALID_RESPONSE",
          "Identity returned invalid JSON.",
        );
      }
      const parsed = envelope.safeParse(raw);
      if (!parsed.success)
        throw new ApiError(
          502,
          "IDENTITY_INVALID_RESPONSE",
          "Identity returned an unexpected claims format.",
        );
      return Response.json(
        {
          success: true,
          data: {
            studentId: input.data.studentId,
            ...parsed.data,
            service: process.env.IDENTITY_CLIENT_ID,
          },
          authentication: false,
        },
        { headers },
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const e =
      error instanceof ApiError
        ? error
        : new ApiError(
            503,
            "IDENTITY_UNAVAILABLE",
            "Student Identity could not be reached or exceeded the ten-second deadline.",
            true,
          );
    return Response.json(
      {
        success: false,
        error: { code: e.code, message: e.message, retryable: e.retryable },
      },
      { status: e.status, headers },
    );
  }
}
