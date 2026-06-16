import type { H3Event } from "h3";
import { auth } from "./auth";

export type UserRole = "admin" | "dispatcher" | "driver";

export interface SessionContext {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  sessionToken: string;
}

export async function requireSession(event: H3Event): Promise<SessionContext> {
  const request = toWebRequest(event);

  let session: any = null;
  try {
    const sessionPromise = auth.api.getSession({ headers: request.headers });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Session check timeout")), 2000)
    );
    session = await Promise.race([sessionPromise, timeoutPromise]);
  } catch (e: any) {
    if (e?.message === "Session check timeout") {
      console.warn("[guards] Session check timed out (2s). Falling back to bypass/dev mode.");
    } else {
      console.warn("[guards] Session check failed:", e?.message || e);
    }
    session = null;
  }

  if (session && session.user) {
    return {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as UserRole,
      sessionToken: session.session.token,
    };
  }

  const bypassHeader = request.headers.get("x-bypass-auth");
  const isDevBypass =
    process.env.NODE_ENV === "development" && bypassHeader === "true";

  if (isDevBypass) {
    console.warn(
      "[SECURITY WARNING] Auth bypass used for development. Request from:",
      request.headers.get("x-forwarded-for") || "unknown"
    );
    return {
      userId: "dev_bypass_user",
      name: "Dev Bypass",
      email: "dev@localhost",
      role: "admin",
      sessionToken: "dev_bypass_token",
    };
  }

  throw createError({
    statusCode: 401,
    statusMessage: "Unauthorized: Active session required",
  });
}

export async function getOptionalSession(
  event: H3Event
): Promise<SessionContext | null> {
  try {
    return await requireSession(event);
  } catch {
    return null;
  }
}

export async function requireRole(
  event: H3Event,
  allowedRoles: UserRole[]
): Promise<SessionContext> {
  const session = await requireSession(event);

  if (!allowedRoles.includes(session.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden: Access restricted to ${allowedRoles.join(", ")}`,
    });
  }

  return session;
}

export async function requireDriver(event: H3Event): Promise<SessionContext> {
  return requireRole(event, ["driver", "admin"]);
}
export async function requireDispatcher(
  event: H3Event
): Promise<SessionContext> {
  return requireRole(event, ["dispatcher", "admin"]);
}

export async function requireAdmin(event: H3Event): Promise<SessionContext> {
  return requireRole(event, ["admin"]);
}

export function sanitizeZodError(
  zodError: { format: () => unknown } | null
): { message: string; details: unknown } {
  if (process.env.NODE_ENV === "development") {
    return {
      message: "Validation error",
      details: zodError?.format() ?? null,
    };
  }

  return {
    message: "Invalid input data. Please check your request.",
    details: null,
  };
}
