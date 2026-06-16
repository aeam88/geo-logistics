import type { H3Event } from "h3";
import { auth } from "./auth";

export interface TenantContext {
  organizationId: string | null;
  userId: string;
  role: string;
}

export async function getTenantContext(event: H3Event): Promise<TenantContext> {
  const request = toWebRequest(event);

  let session: any = null;
  try {
    const sessionPromise = auth.api.getSession({ headers: request.headers });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Session timeout")), 2000)
    );
    session = await Promise.race([sessionPromise, timeoutPromise]);
  } catch {
    session = null;
  }

  if (!session) {
    const bypassHeader = request.headers.get("x-bypass-auth");
    if (process.env.NODE_ENV === "development" && bypassHeader === "true") {
      return {
        organizationId: null, // Sin org en bypass
        userId: "dev_bypass_user",
        role: "admin",
      };
    }
  }

  if (!session || !session.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  return {
    organizationId: (session.user as any).organizationId || null,
    userId: session.user.id,
    role: (session.user as any).role || "driver",
  };
}
export function orgFilter(organizationId: string | null, column: any) {
  if (!organizationId) return undefined;
  return column.eq(organizationId);
}
