import { db } from "../../db";
import { user } from "../../db/schema";
import { requireAdmin } from "../../utils/guards";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);

  const orgId = (session as any).organizationId;

  let usersList;
  if (orgId) {
    usersList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.organizationId, orgId));
  } else {
    usersList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user);
  }

  return {
    success: true,
    data: usersList.map((u) => ({
      ...u,
      role: u.role || "driver",
    })),
  };
});
