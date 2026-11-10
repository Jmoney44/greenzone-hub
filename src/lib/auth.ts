import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "gz_session";
const SESSION_DAYS = 30;

export const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

/** Signs the user in. Any other device signed in to the same account is signed out. */
export async function startSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.deleteMany({ where: { userId } });
  await db.session.create({ data: { id: sha(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha(token) } });
  jar.delete(COOKIE);
}

export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { id: sha(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
});

export type Me = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export const isSubscribed = (u: Me) => !!u.subscriptionEndsAt && u.subscriptionEndsAt > new Date();

/** Where a signed-in person belongs. */
export function homeFor(u: Me) {
  if (u.role === "ADMIN") return "/admin";
  if (u.role === "TEACHER") return "/teachers";
  return isSubscribed(u) ? "/library" : "/subscribe";
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/signin");
  return u;
}

export async function requireRole(role: "PARENT" | "TEACHER" | "ADMIN") {
  const u = await requireUser();
  if (u.role !== role && u.role !== "ADMIN") redirect(homeFor(u));
  return u;
}

/** A parent with an active subscription (admins pass too). */
export async function requireSubscriber() {
  const u = await requireRole("PARENT");
  if (u.role === "PARENT" && !isSubscribed(u)) redirect("/subscribe");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect(homeFor(u));
  return u;
}
