import { ApiError, secretMatches } from "./core";
import { getAuth } from "./auth";

export async function requireAdmin(request: Request, authenticate = getAuth) {
  return requireAccount(request, authenticate, true);
}

export async function requireAccount(request: Request, authenticate = getAuth, adminOnly = false) {
  // Retain explicit operator credentials for server-to-server tools only.
  const operator = process.env.INTEGRATION_ADMIN_TOKEN;
  if (operator && operator.length >= 32 && secretMatches(request.headers.get("authorization"), "Bearer " + operator)) return;
  if (!request.headers.has("cookie")) throw new ApiError(401, "UNAUTHORIZED", "Sign in to access integrations.");
  const session = await authenticate().api.getSession({ headers: request.headers });
  if (!session) throw new ApiError(401, "UNAUTHORIZED", "Your session has expired. Please sign in again.");
  if (adminOnly && session.user.role !== "admin") throw new ApiError(403, "FORBIDDEN", "This page is available to administrators only.");
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (request.headers.get("origin") !== new URL(process.env.BETTER_AUTH_URL!).origin)
      throw new ApiError(403, "INVALID_ORIGIN", "Request origin is not allowed.");
  }
}
