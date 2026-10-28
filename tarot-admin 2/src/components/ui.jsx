import React, { useMemo, useRef } from "react";
import { Search, Upload, Check, ChevronRight, Sparkles, Moon } from "lucide-react";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "../theme.js";

export function MoonRow() {
  const phases = [1, 0.85, 0.6, 0.35, 0.15, 0, 0.15, 0.35];
  return (
    <div className="flex items-center gap-2 px-1">
      {phases.map((p, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 9,
            height: 9,
            background:
              p === 0
                ? "transparent"
                : `linear-gradient(90deg, ${COLORS.purple} ${p * 100}%, transparent ${p * 100}%)`,
            border: `1px solid ${COLORS.borderStrong}`,
          }}
        />
      ))}
    </div>
  );
}

export function FieldLabel({ children, icon: Icon }) {
  return (
    <label
      className="flex items-center gap-1.5 mb-2 text-xs uppercase tracking-widest"
      style={{ color: COLORS.purpleDeep, fontFamily: FONT_BODY, letterSpacing: "0.1em" }}
    >
      {Icon ? <Icon size={12} strokeWidth={2} /> : null}
      {children}
    </label>
  );
}

const inputStyle = {
  background: COLORS.panelSoft,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  fontFamily: FONT_BODY,
};

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors ${props.className || ""}`}
      style={{ ...inputStyle, ...(props.style || {}) }}
      onFocus={(e) => (e.target.style.borderColor = COLORS.purple)}
      onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none transition-colors ${props.className || ""}`}
      style={{ ...inputStyle, ...(props.style || {}) }}
      onFocus={(e) => (e.target.style.borderColor = COLORS.purple)}
      onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
    />
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none appearance-none cursor-pointer"
      style={inputStyle}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function PrimaryButton({ children, onClick, icon: Icon, disabled, type = "button", full }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${full ? "w-full" : ""}`}
      style={{
        background: `linear-gradient(135deg, ${COLORS.purpleBright}, ${COLORS.purple})`,
        color: "#FFFFFF",
        fontFamily: FONT_BODY,
        boxShadow: "0 10px 24px -10px rgba(124,92,191,0.55)",
      }}
    >
      {Icon ? <Icon size={15} strokeWidth={2.4} /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, icon: Icon, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors"
      style={{
        color: danger ? COLORS.danger : COLORS.textMuted,
        borderColor: danger ? "rgba(194,91,114,0.35)" : COLORS.border,
        fontFamily: FONT_BODY,
        background: "transparent",
      }}
    >
      {Icon ? <Icon size={14} strokeWidth={2.2} /> : null}
      {children}
    </button>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-xl z-50"
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.borderStrong}`,
        color: COLORS.text,
        fontFamily: FONT_BODY,
      }}
    >
      <Check size={15} style={{ color: COLORS.purple }} />
      {message}
    </div>
  );
}

export function CardFace({ imageUrl, name, number, size = "md" }) {
  const dims =
    size === "sm"
      ? { w: 40, h: 56 }
      : size === "lg"
      ? { w: 130, h: 182 }
      : size === "xl"
      ? { w: 190, h: 300 }
      : { w: 64, h: 90 };
  // xl ใช้ "contain" เพื่อไม่ให้รูปไพ่ถูกครอบตัดขอบบน/ล่าง (ต่างจากไซส์อื่นที่ยังใช้ "cover"
  // เพราะเป็นรูปธัมบ์เนลเล็กในลิสต์ ครอบตัดเล็กน้อยไม่กระทบการมองเห็นรายละเอียด)
  const objectFit = size === "xl" ? "contain" : "cover";
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={{
          width: dims.w,
          height: dims.h,
          objectFit,
          borderRadius: 8,
          border: `1px solid ${COLORS.borderStrong}`,
          background: objectFit === "contain" ? COLORS.panelSoft : undefined,
        }}
      />
    );
  }
  return (
    <div
      className="flex flex-col items-center justify-center shrink-0"
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 8,
        border: `1px solid ${COLORS.borderStrong}`,
        background:
          "repeating-linear-gradient(135deg, #F1EAFA 0px, #F1EAFA 6px, #E9DFF7 6px, #E9DFF7 12px)",
      }}
    >
      <Sparkles size={size === "lg" ? 26 : 16} style={{ color: COLORS.purple, opacity: 0.85 }} />
      <span
        style={{
          color: COLORS.purpleDeep,
          fontFamily: FONT_DISPLAY,
          fontSize: size === "lg" ? 20 : 11,
          marginTop: 4,
        }}
      >
        {number}
      </span>
    </div>
  );
}

export function ImageDropzone({ image, onChange }) {
  const fileRef = useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-colors"
      style={{
        border: `1.5px dashed ${COLORS.borderStrong}`,
        background: COLORS.panelSoft,
        aspectRatio: "2 / 3",
        width: "100%",
        maxWidth: 180,
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {image ? (
        <img src={image} alt="หน้าไพ่" className="w-full h-full object-cover rounded-xl" />
      ) : (
        <>
          <Upload size={20} style={{ color: COLORS.purple }} />
          <span className="text-xs text-center px-4" style={{ color: COLORS.textMuted, fontFamily: FONT_BODY }}>
            อัปโหลดหน้าไพ่
            <br />
            ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
          </span>
        </>
      )}
    </div>
  );
}

function CardListItem({ card, active, onClick, displayNumber }) {
  // displayNumber = ลำดับต่อเนื่องทั้งสำรับ (0-77) คำนวณจากตำแหน่งหลัง sort แล้ว
  // ถ้าไม่ได้ส่งมา (เผื่อเรียกใช้จากที่อื่น) ให้ fallback ไปใช้ cardNumber ดิบแทน
  const numberToShow = displayNumber !== undefined ? displayNumber : card.cardNumber;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
      style={{
        background: active ? COLORS.panelElevated : "transparent",
        border: `1px solid ${active ? COLORS.borderStrong : "transparent"}`,
      }}
    >
      <CardFace imageUrl={card.imageUrl} name={card.name} number={card.number} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate" style={{ color: COLORS.text, fontFamily: FONT_BODY, fontWeight: 500 }}>
          {card.name}
        </div>
        <div className="text-xs mt-0.5" style={{ color: COLORS.textFaint, fontFamily: FONT_BODY }}>
          {numberToShow !== undefined ? `ใบที่ ${numberToShow}` : "ไพ่ทาโรต์"}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: active ? COLORS.purple : COLORS.textFaint }} />
    </button>
  );
}

// ลำดับหมวดหมู่ของสำรับทาโรต์มาตรฐาน 78 ใบ:
// Major Arcana (0-21) ก่อน แล้วตามด้วย Minor Arcana ทีละชุด (wands, cups, swords, pentacles)
// ค่า suit ใน Firestore เป็นตัวพิมพ์เล็กภาษาอังกฤษ เช่น "major", "pentacles" ฯลฯ
const SUIT_ORDER = {
  major: 0,
  wands: 1,
  cups: 2,
  swords: 3,
  pentacles: 4,
};

export function CardListPanel({ cards, query, setQuery, selectedId, onSelect }) {
  const filtered = useMemo(() => {
    return cards
      .filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(query.toLowerCase())) ||
          (c.cardNumber && c.cardNumber.toString().includes(query)) ||
          (c.id && c.id.toString().includes(query))
      )
      .sort((a, b) => {
        // 1. เรียงตามหมวดหมู่ก่อน (major มาก่อน แล้วตามด้วยแต่ละชุดของ Minor Arcana)
        // ป้องกันปัญหา cardNumber ซ้ำกันข้ามหมวด (เช่น ACE ของทุกชุดมี cardNumber = "1")
        const suitA = SUIT_ORDER[a.suit] ?? 99;
        const suitB = SUIT_ORDER[b.suit] ?? 99;
        if (suitA !== suitB) return suitA - suitB;

        // 2. ในหมวดหมู่เดียวกัน ค่อยเรียงตาม cardNumber (แปลงเป็นตัวเลขก่อนเทียบ
        // เพราะ Firestore เก็บ cardNumber เป็น string ทำให้ "10" < "2" ถ้าเทียบแบบ string ตรงๆ)
        const numA = Number(a.cardNumber ?? a.id ?? 999);
        const numB = Number(b.cardNumber ?? b.id ?? 999);
        const validNumA = isNaN(numA) ? 999 : numA;
        const validNumB = isNaN(numB) ? 999 : numB;
        return validNumA - validNumB;
      });
  }, [cards, query]);

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, minWidth: 280 }}
    >
      <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textFaint }} />
          <TextInput
            placeholder="ค้นหาไพ่..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2 overflow-y-auto" style={{ maxHeight: 480 }}>
        {filtered.length === 0 && (
          <div className="text-xs text-center py-8 px-4" style={{ color: COLORS.textFaint, fontFamily: FONT_BODY }}>
            ไม่พบไพ่ที่ค้นหา
          </div>
        )}
        {filtered.map((c, i) => (
          <CardListItem
            key={c.id}
            card={c}
            active={c.id === selectedId}
            onClick={() => onSelect(c.id)}
            displayNumber={i}
          />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl py-24"
      style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
    >
      <Moon size={28} style={{ color: COLORS.purpleBright }} />
      <p className="text-sm" style={{ color: COLORS.textFaint, fontFamily: FONT_BODY }}>
        {text}
      </p>
    </div>
  );
}
