export default defineEventHandler(() => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw createError({ statusCode: 500, statusMessage: "VAPID public key not configured" });
  }
  return { publicKey };
});
