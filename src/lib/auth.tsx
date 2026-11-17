import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { toUser } from "./api";
import type { Me, Role } from "./types";
import { Loading } from "@/components/Loading";

type Auth = { ready: boolean; session: Session | null; me: Me | null; refresh: () => Promise<Me | null>; signOut: () => Promise<void> };
const Ctx = createContext<Auth>({ ready: false, session: null, me: null, refresh: async () => null, signOut: async () => {} });

export const isSubscribed = (u: Me) => !!u.subscriptionEndsAt && u.subscriptionEndsAt > new Date();

/** Where a signed-in person belongs. */
export function homeFor(u: Me) {
  if (u.role === "ADMIN") return "/admin";
  if (u.role === "TEACHER") return "/teachers";
  return isSubscribed(u) ? "/library" : "/subscribe";
}

async function loadProfile(userId: string) {
  // The profile is created by the database when the account is made; give it a moment on first sign-up.
  for (let i = 0; i < 4; i++) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) return toUser(data);
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const userId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id ?? null;
    const profile = id ? await loadProfile(id) : null;
    userId.current = id;
    setSession(data.session);
    setMe(profile);
    return profile;
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const id = s?.user.id ?? null;
      if (id !== userId.current) {
        userId.current = id;
        if (!id) setMe(null);
        else loadProfile(id).then(setMe);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: "local" });
    userId.current = null;
    setSession(null);
    setMe(null);
  }, []);

  return <Ctx.Provider value={{ ready, session, me, refresh, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

/** The signed-in person, inside pages wrapped in <Guard>. */
export function useMe() {
  const { me } = useAuth();
  if (!me) throw new Error("useMe used outside a signed-in page");
  return me;
}

type Need = "user" | "admin" | "subscriber" | Role;

/** Shows the page only to the right people; sends everyone else where they belong. */
export function Guard({ need, children }: { need: Need; children: React.ReactNode }) {
  const { ready, session, me } = useAuth();
  const location = useLocation();
  if (!ready || (session && !me)) return <Loading full />;
  if (!me) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  if (need === "admin" && me.role !== "ADMIN") return <Navigate to={homeFor(me)} replace />;
  if ((need === "TEACHER" || need === "PARENT") && me.role !== need && me.role !== "ADMIN") return <Navigate to={homeFor(me)} replace />;
  if (need === "subscriber") {
    if (me.role !== "PARENT" && me.role !== "ADMIN") return <Navigate to={homeFor(me)} replace />;
    if (me.role === "PARENT" && !isSubscribed(me)) return <Navigate to="/subscribe" replace />;
  }
  return <>{children}</>;
}

/** For sign-in pages: people who are already signed in go to their hub. */
export function SignedOutOnly({ children }: { children: React.ReactNode }) {
  const { ready, session, me } = useAuth();
  if (!ready || (session && !me)) return <Loading full />;
  if (me) return <Navigate to={homeFor(me)} replace />;
  return <>{children}</>;
}
