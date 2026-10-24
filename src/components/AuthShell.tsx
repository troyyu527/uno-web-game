import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { backendKind } from "@/lib/backend";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/60 p-7 shadow-2xl backdrop-blur"
      >
        <Link to="/" className="mb-6 block text-sm text-slate-400 hover:text-slate-200">
          ← Back to menu
        </Link>
        <h1 className="mb-1 text-2xl font-extrabold text-slate-50">{title}</h1>
        <p className="mb-6 text-xs text-slate-500">
          {backendKind === "cloudflare" ? "Connected to the cloud server" : "Stored locally in your browser"}
        </p>
        {children}
      </motion.div>
    </div>
  );
}

export const field =
  "w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30";

export const primaryBtn =
  "w-full rounded-full bg-gradient-to-br from-uno-red to-rose-600 px-6 py-2.5 font-bold text-white transition hover:brightness-110 disabled:opacity-60";
