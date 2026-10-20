import React, { createContext, useContext, useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";

const UserContext = createContext({
  user: null,
  setUser: () => {},
  fortuneHistory: [],
  addFortuneHistory: () => {},
  deleteFortuneHistory: () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [fortuneHistory, setFortuneHistory] = useState([]);

  // =========================================================
  // 🔑 ดึง Firebase UID ที่ถูกต้อง
  // =========================================================
  const getCurrentUserUid = () => {
    return (
      user?.uid ||
      user?.id ||
      auth.currentUser?.uid ||
      null
    );
  };

  // =========================================================
  // 📚 ดึงประวัติการดูดวงจาก Firebase
  // =========================================================
  useEffect(() => {
    const fetchUserHistory = async () => {
      const uid = getCurrentUserUid();

      if (!uid) {
        setFortuneHistory([]);
        return;
      }

      try {
        const q = query(
          collection(db, "fortuneHistory"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);

        const historyData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFortuneHistory(historyData);
      } catch (error) {
        console.error(
          "Error fetching fortune history from Firebase:",
          error
        );
      }
    };

    fetchUserHistory();
  }, [user]);

  // =========================================================
  // 🔮 บันทึกประวัติการดูดวง
  // =========================================================
  const addFortuneHistory = async (data, legacyCards) => {
    try {
      const uid = getCurrentUserUid();

      if (!uid) {
        console.error(
          "ไม่สามารถบันทึกประวัติได้: ไม่พบ Firebase UID ของผู้ใช้"
        );
        return false;
      }

      // รองรับทั้ง Object และรูปแบบเก่า
      const isObject =
        typeof data === "object" && data !== null;

      const category = isObject
        ? data.category
        : data;

      const cards = isObject
        ? data.cards || []
        : legacyCards || [];

      const cardCount = isObject
        ? data.cardCount || cards.length
        : cards.length;

      const overallSummary = isObject
        ? data.overallSummary || ""
        : "";

      // =====================================================
      // 💾 บันทึกลง Firestore
      // =====================================================
      const docRef = await addDoc(
        collection(db, "fortuneHistory"),
        {
          userId: uid,
          userName:
            user?.name ||
            user?.username ||
            user?.displayName ||
            "ผู้ใช้งานทั่วไป",
          userEmail:
            user?.email ||
            auth.currentUser?.email ||
            "",

          category: category || "",
          cardCount: cardCount,
          cards: cards,
          overallSummary: overallSummary,

          createdAt: serverTimestamp(),
        }
      );

      // =====================================================
      // ⚡ อัปเดต State ทันที
      // =====================================================
      const newEntry = {
        id: docRef.id,
        userId: uid,
        userName:
          user?.name ||
          user?.username ||
          user?.displayName ||
          "ผู้ใช้งานทั่วไป",
        userEmail:
          user?.email ||
          auth.currentUser?.email ||
          "",

        category: category || "",
        cardCount: cardCount,
        cards: cards,
        overallSummary: overallSummary,

        createdAt: new Date(),
      };

      setFortuneHistory((prev) => [
        newEntry,
        ...prev,
      ]);

      console.log(
        "บันทึกประวัติสำเร็จลง Firestore UID:",
        uid
      );

      return true;
    } catch (error) {
      console.error(
        "Error adding fortune history to Firestore:",
        error
      );

      return false;
    }
  };

  // =========================================================
  // 🗑️ ลบประวัติการดูดวง
  // =========================================================
  const deleteFortuneHistory = async (historyId) => {
    try {
      if (!historyId) return false;

      await deleteDoc(
        doc(db, "fortuneHistory", historyId)
      );

      setFortuneHistory((prev) =>
        prev.filter(
          (item) => item.id !== historyId
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Error deleting fortune history from Firebase:",
        error
      );

      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        fortuneHistory,
        addFortuneHistory,
        deleteFortuneHistory,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
