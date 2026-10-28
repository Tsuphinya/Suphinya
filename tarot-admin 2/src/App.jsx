import React, { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  orderBy,
  query as fsQuery,
  serverTimestamp,
} from "firebase/firestore";
import { Sparkles, Wand2, LogOut } from "lucide-react";

import { auth, db, CARDS_COLLECTION } from "./firebase.js";
import { COLORS, FONT_DISPLAY, NAV_ITEMS } from "./theme.js";
import { Toast } from "./components/ui.jsx";
import Login from "./components/Login.jsx";
import AddCardView from "./components/AddCardView.jsx";
import EditCardView from "./components/EditCardView.jsx";
import ManageCardView from "./components/ManageCardView.jsx";
import logo from "./assets/logoapp.png";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [cards, setCards] = useState([]);
  const [cardsError, setCardsError] = useState("");
  const [tab, setTab] = useState("add");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const notify = (msg) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  // Subscribe to the cards collection in real time.
  useEffect(() => {
    if (!user) {
      setCards([]);
      return;
    }

    const q = fsQuery(collection(db, CARDS_COLLECTION), orderBy("name"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCardsError("");
        setCards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => setCardsError(err.message)
    );

    return unsub;
  }, [user]);

  const handleUpdate = (id, fields) =>
    updateDoc(doc(db, CARDS_COLLECTION, id), fields);

  const handleDelete = (id) =>
    deleteDoc(doc(db, CARDS_COLLECTION, id));

  // Create a new tarot card using the numeric cardNumber as its Firestore Document ID.
  const handleCreateCard = async (fields) => {
    const rawCardNumber = fields?.cardNumber;
    const cardNumber = String(rawCardNumber ?? "").trim();

    if (!/^\d+$/.test(cardNumber)) {
      throw new Error("หมายเลขไพ่ต้องเป็นตัวเลขเท่านั้น");
    }

    const cardRef = doc(db, CARDS_COLLECTION, cardNumber);
    const existingCard = await getDoc(cardRef);

    if (existingCard.exists()) {
      throw new Error(`หมายเลขไพ่ ${cardNumber} มีอยู่แล้ว กรุณาใช้หมายเลขอื่น`);
    }

    await setDoc(cardRef, {
      ...fields,
      cardNumber: Number(cardNumber),
      createdAt: serverTimestamp(),
    });
  };

  // Save tarot predictions as flat fields, matching the mobile app's schema.
  const handleSavePredictions = (id, predictionFields) =>
    updateDoc(doc(db, CARDS_COLLECTION, id), predictionFields);

  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: COLORS.bgGrad }}
      >
        <Sparkles
          size={22}
          style={{ color: COLORS.purple }}
          className="animate-pulse"
        />
      </div>
    );
  }

  if (!user) return <Login />;

  const activeNav = NAV_ITEMS.find((n) => n.key === tab);

  return (
    <div className="min-h-screen w-full flex" style={{ background: COLORS.bgGrad }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col justify-between shrink-0"
        style={{
          width: 260,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "28px 20px",
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <img
              src={logo}
              alt="Fortune Telling Admin โลโก้"
              style={{ width: 42, height: 42, objectFit: "contain" }}
            />
            <div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: COLORS.text,
                  fontSize: 17,
                  lineHeight: 1,
                }}
              >
                Fortune Telling
              </div>
              <div
                className="text-[10px] tracking-[0.25em] uppercase mt-0.5"
                style={{ color: COLORS.purple }}
              >
                Admin
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 mt-8">
            {NAV_ITEMS.map((item) => {
              const active = item.key === tab;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className="text-left rounded-lg px-3.5 py-3 transition-colors"
                  style={{
                    background: active ? COLORS.panelElevated : "transparent",
                    borderLeft: `2px solid ${active ? COLORS.purple : "transparent"}`,
                  }}
                >
                  <div
                    className="text-sm"
                    style={{
                      color: active ? COLORS.text : COLORS.textMuted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl px-3.5 py-3 flex items-center justify-between"
            style={{
              background: COLORS.panelSoft,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div>
              <div
                className="text-[10px] uppercase tracking-widest"
                style={{ color: COLORS.textFaint }}
              >
                ไพ่ทั้งหมด
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: COLORS.purpleDeep,
                  fontSize: 20,
                }}
              >
                {cards.length}
              </div>
            </div>
            <Wand2 size={18} style={{ color: COLORS.purpleBright }} />
          </div>

          <div className="flex items-center justify-between px-1">
            <span
              className="text-xs truncate"
              style={{ color: COLORS.textFaint, maxWidth: 160 }}
              title={user.email}
            >
              {user.email}
            </span>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1 text-xs"
              style={{ color: COLORS.textMuted }}
              title="ออกจากระบบ"
            >
              <LogOut size={13} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-6 py-8 md:px-12 md:py-10 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 style={{ fontFamily: FONT_DISPLAY, color: COLORS.text, fontSize: 28 }}>
              {activeNav?.label}
            </h1>
          </div>

          {cardsError && (
            <div
              className="mb-6 rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(194,91,114,0.08)",
                color: COLORS.danger,
              }}
            >
              ไม่สามารถเชื่อมต่อ Firestore ได้: {cardsError}
            </div>
          )}

          {tab === "add" && (
            <AddCardView
              cards={cards}
              onSave={handleSavePredictions}
              onCreate={handleCreateCard}
              notify={notify}
            />
          )}

          {tab === "edit" && (
            <EditCardView
              cards={cards}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              notify={notify}
            />
          )}

          {tab === "manage" && (
            <ManageCardView
              cards={cards}
              onSave={handleSavePredictions}
              notify={notify}
            />
          )}
        </div>
      </main>

      <Toast message={toast} />
    </div>
  );
}
