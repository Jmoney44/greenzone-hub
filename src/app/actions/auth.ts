"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  checkPassword, currentUser, endSession, hashPassword, homeFor, newToken, requireUser, sha, startSession,
} from "@/lib/auth";
import { claimPayments } from "@/lib/access";
import { sendMail } from "@/lib/mail";

export type FormState = { error?: string; ok?: string } | undefined;

const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const name = clean(form.get("name"));
  const email = clean(form.get("email")).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (name.length < 2) return { error: "Please enter your full name." };
  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Your password needs at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) {
    return { error: "An account with this email already exists. Sign in instead." };
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: "PARENT" },
  });
  await claimPayments(user.id, email);
  await startSession(user.id);
  redirect(homeFor((await db.user.findUniqueOrThrow({ where: { id: user.id } }))));
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email")).toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return { error: "That email and password do not match. Please try again." };
  }
  await startSession(user.id);
  redirect(homeFor(user));
}

export async function signOut() {
  await endSession();
  redirect("/");
}

export async function requestReset(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email")).toLowerCase();
  const user = validEmail(email) ? await db.user.findUnique({ where: { email } }) : null;
  if (user) {
    const token = newToken();
    await db.passwordReset.deleteMany({ where: { userId: user.id } });
    await db.passwordReset.create({
      data: { id: sha(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const site = process.env.SITE_URL ?? "http://localhost:3000";
    await sendMail(
      email,
      "Reset your Greenzone Learning Hub password",
      `Hello ${user.name},\n\nUse this link to choose a new password. It works for one hour.\n\n${site}/reset/${token}\n\nIf you did not ask for this, you can ignore this email.`,
    );
  }
  // Same answer either way, so nobody can test which emails have accounts.
  return { ok: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const token = clean(form.get("token"));
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Your password needs at least 8 characters." };
  const row = await db.passwordReset.findUnique({ where: { id: sha(token) } });
  if (!row || row.expiresAt < new Date()) return { error: "This reset link has expired. Please request a new one." };
  await db.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(password) } });
  await db.passwordReset.deleteMany({ where: { userId: row.userId } });
  await startSession(row.userId);
  redirect(homeFor(await db.user.findUniqueOrThrow({ where: { id: row.userId } })));
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const name = clean(form.get("name"));
  if (name.length < 2) return { error: "Please enter your full name." };
  await db.user.update({ where: { id: me.id }, data: { name } });
  return { ok: "Your name has been updated." };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await checkPassword(current, me.passwordHash))) return { error: "Your current password is not correct." };
  if (next.length < 8) return { error: "Your new password needs at least 8 characters." };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
  return { ok: "Your password has been changed." };
}

export async function goHome() {
  const me = await currentUser();
  redirect(me ? homeFor(me) : "/signin");
}
