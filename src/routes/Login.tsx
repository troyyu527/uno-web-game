import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";
import { AuthShell, field, primaryBtn } from "@/components/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await signIn(email, password)) navigate("/");
  };

  return (
    <AuthShell title="Log in">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-sm text-uno-red">{error}</p>}
        <button className={primaryBtn} disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        No account?{" "}
        <Link to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
