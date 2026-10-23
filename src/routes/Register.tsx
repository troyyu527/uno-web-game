import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";
import { AuthShell, field, primaryBtn } from "@/components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const { signUp, loading, error, notice, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await signUp(username, email, password)) navigate("/");
  };

  return (
    <AuthShell title="Create account">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className={field}
          type="text"
          placeholder="Username (your player name)"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            clearError();
          }}
          autoComplete="username"
          required
        />
        <input
          className={field}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          autoComplete="email"
          required
        />
        <input
          className={field}
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          autoComplete="new-password"
          minLength={6}
          required
        />
        {error && <p className="text-sm text-uno-red">{error}</p>}
        {notice && (
          <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{notice}</p>
        )}
        <button className={primaryBtn} disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
