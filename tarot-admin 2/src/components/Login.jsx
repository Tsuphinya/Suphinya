import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Mail, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { auth } from "../firebase.js";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "../theme.js";
import { PrimaryButton } from "./ui.jsx";

const ERROR_MESSAGES = {
  "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
  "auth/user-not-found": "ไม่พบบัญชีผู้ใช้นี้ในระบบ",
  "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
  "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "auth/too-many-requests": "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
};

function StarField() {
  const stars = [
    { top: "14%", left: "8%", size: 12, o: 0.5 },
    { top: "22%", left: "88%", size: 10, o: 0.4 },
    { top: "68%", left: "5%", size: 9, o: 0.35 },
    { top: "78%", left: "92%", size: 11, o: 0.45 },
    { top: "40%", left: "94%", size: 8, o: 0.3 },
    { top: "85%", left: "50%", size: 9, o: 0.3 },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <Sparkles
          key={i}
          size={s.size}
          style={{ position: "absolute", top: s.top, left: s.left, color: COLORS.gold, opacity: s.o }}
        />
      ))}
    </>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      // Logged so you can see the exact Firebase error code while debugging.
      console.error("Firebase sign-in error:", err.code, err.message);
      setError(ERROR_MESSAGES[err.code] || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center px-6 py-12"
      style={{ background: COLORS.bgGrad, fontFamily: FONT_BODY }}
    >
      <div style={{ position: "absolute", top: -140, left: -120, width: 380, height: 380, borderRadius: "50%", background: COLORS.purpleBright, opacity: 0.28, filter: "blur(90px)" }} />
      <div style={{ position: "absolute", bottom: -160, right: -110, width: 420, height: 420, borderRadius: "50%", background: COLORS.gold, opacity: 0.16, filter: "blur(100px)" }} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 620,
          height: 620,
          borderRadius: "50%",
          border: `1px solid ${COLORS.borderStrong}`,
          opacity: 0.35,
        }}
      />
      <StarField />

      <div className="relative z-10 w-full max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl px-12 py-14 flex flex-col items-center"
          style={{
            background: "rgba(255,255,255,0.62)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 35px 70px -25px rgba(91,63,148,0.35)",
          }}
        >
          <img src="/logo.png" alt="โลโก้" style={{ width: 84, height: 84, objectFit: "contain", marginBottom: 18 }} />
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, letterSpacing: "0.06em", color: COLORS.purpleDeep, marginBottom: 40 }}>
            LOGIN
          </h1>

          <div className="w-full flex flex-col gap-8">
            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1.5px solid ${COLORS.borderStrong}` }}>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base"
                style={{ color: COLORS.text, fontFamily: FONT_BODY }}
              />
              <Mail size={20} style={{ color: COLORS.purple }} />
            </div>

            <div>
              <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1.5px solid ${COLORS.borderStrong}` }}>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  style={{ color: COLORS.text, fontFamily: FONT_BODY }}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} style={{ color: COLORS.purple }}>
                  {showPw ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a className="text-sm cursor-pointer" style={{ color: COLORS.textMuted }}>
                  ลืมรหัสผ่าน?
                </a>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none" style={{ color: COLORS.textMuted }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4.5 h-4.5 rounded"
                style={{ accentColor: COLORS.purple, width: 18, height: 18 }}
              />
              จดจำฉันไว้
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(194,91,114,0.1)", color: COLORS.danger }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={loading} full>
              <span style={{ fontSize: 16, padding: "2px 0" }}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </span>
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
