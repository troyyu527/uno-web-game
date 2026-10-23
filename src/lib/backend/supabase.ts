import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Backend, type SaveSlot, type User, BackendError, BackendNotice } from "./types";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Non-null only when both env vars are set; otherwise the local adapter is used. */
export const supabase: SupabaseClient | null = URL && ANON ? createClient(URL, ANON) : null;
export const hasSupabase = supabase !== null;

const client = (): SupabaseClient => {
  if (!supabase) throw new BackendError("Supabase is not configured.");
  return supabase;
};

const toUser = (u: { id: string; email?: string; user_metadata?: { username?: string } }): User => ({
  id: u.id,
  email: u.email ?? "",
  username: u.user_metadata?.username ?? (u.email ?? "Player").split("@")[0],
});

export const supabaseBackend: Backend = {
  kind: "supabase",

  async init() {
    const { data } = await client().auth.getSession();
    return data.session ? toUser(data.session.user) : null;
  },

  async signUp(username, email, password) {
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw new BackendError(error.message);
    if (!data.user) throw new BackendError("Sign-up failed.");
    if (!data.session) {
      // Sign-up worked; the project just requires email confirmation first.
      throw new BackendNotice("Account created — check your email to confirm, then log in.");
    }
    return toUser(data.user);
  },

  async signIn(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email, password });
    if (error) throw new BackendError(error.message);
    return toUser(data.user);
  },

  async signOut() {
    await client().auth.signOut();
  },

  async listSaves(user) {
    const { data, error } = await client()
      .from("game_saves")
      .select("slot_index, name, saved_at, snapshot")
      .eq("user_id", user.id)
      .order("slot_index");
    if (error) throw new BackendError(error.message);
    return (data ?? []).map((r) => ({
      index: r.slot_index as number,
      name: r.name as string,
      savedAt: r.saved_at as number,
      snapshot: r.snapshot as SaveSlot["snapshot"],
    }));
  },

  async putSave(user, slot) {
    const { error } = await client()
      .from("game_saves")
      .upsert(
        {
          user_id: user.id,
          slot_index: slot.index,
          name: slot.name,
          saved_at: slot.savedAt,
          snapshot: slot.snapshot,
        },
        { onConflict: "user_id,slot_index" },
      );
    if (error) throw new BackendError(error.message);
  },

  async deleteSave(user, index) {
    const { error } = await client()
      .from("game_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("slot_index", index);
    if (error) throw new BackendError(error.message);
  },
};
