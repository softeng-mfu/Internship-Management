import "server-only";
import { ApiError, required, secretMatches } from "./core";

export function requireOperator(
  request: Request,
  unauthorizedMessage = "An operator bearer token is required.",
) {
  const token = required("INTEGRATION_ADMIN_TOKEN");
  if (token.length < 32) {
    throw new ApiError(503, "CONFIGURATION_INVALID", "Operator token must have at least 32 characters.");
  }
  if (!secretMatches(request.headers.get("Authorization"), "Bearer " + token)) {
    throw new ApiError(401, "UNAUTHORIZED", unauthorizedMessage);
  }
}
