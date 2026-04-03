/**
 * Use Secure cookies only when the client connection is HTTPS (or TLS-terminated proxy).
 * Browsers ignore Secure cookies on plain HTTP, which breaks login on http:// VPS URLs.
 */
export function useSecureAuthCookie(request: Request): boolean {
  const env = process.env.AUTH_COOKIE_SECURE?.toLowerCase();
  if (env === "false" || env === "0") return false;
  if (env === "true" || env === "1") return true;

  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0].trim().toLowerCase() === "https";
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
