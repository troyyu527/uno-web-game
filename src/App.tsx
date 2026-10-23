import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";
import { useServer } from "@/store/serverStore";
import Menu from "@/routes/Menu";
import Game from "@/routes/Game";
import Login from "@/routes/Login";
import Register from "@/routes/Register";
import Profile from "@/routes/Profile";
import Online from "@/routes/Online";
import Room from "@/routes/Room";

// HashRouter keeps deep links working on GitHub Pages without server rewrites.
export default function App() {
  useEffect(() => {
    void useAuth.getState().init();
    void useServer.getState().check();
    // Coming back from a dropped connection should re-enable online play
    // without making the player reload.
    const recheck = () => void useServer.getState().check();
    window.addEventListener("online", recheck);
    return () => window.removeEventListener("online", recheck);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/game" element={<Game />} />
        <Route path="/online" element={<Online />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        {/* Anything unrecognised lands on the menu rather than a blank page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
