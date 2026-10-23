import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";
import { AuthShell } from "@/components/AuthShell";

export default function Profile() {
  const navigate = useNavigate();
  const { user, ready, signOut } = useAuth();

  useEffect(() => {
    if (ready && !user) navigate("/login");
  }, [ready, user, navigate]);

  if (!user) return null;

  return (
    <AuthShell title="Your account">
      <dl className="mb-6 space-y-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Username</dt>
          <dd className="text-lg font-semibold text-slate-100">{user.username}</dd>
        </div>
        {user.email && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="text-slate-200">{user.email}</dd>
          </div>
        )}
      </dl>
      <button
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
        className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-2.5 font-semibold text-slate-200 transition hover:bg-white/10"
      >
        Log out
      </button>
    </AuthShell>
  );
}
