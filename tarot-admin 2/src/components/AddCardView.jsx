import React, { useState } from "react";
import { Save, Plus, ArrowLeft } from "lucide-react";
import { COLORS, FONT_DISPLAY, PREDICTION_TOPICS, CARD_TYPES } from "../theme.js";
import {
  FieldLabel,
  TextInput,
  TextArea,
  Select,
  PrimaryButton,
  GhostButton,
  CardListPanel,
  EmptyState,
  CardFace,
  ImageDropzone,
} from "./ui.jsx";

const emptyPredictions = () =>
  PREDICTION_TOPICS.reduce((acc, topic) => {
    acc[topic.normalField] = "";
    acc[topic.reversedField] = "";
    return acc;
  }, {});

// 🌟 ตัวเลือกหมวดไพ่ย่อยของ Minor Arcana — ค่าเป็นภาษาอังกฤษให้ตรงกับ field "suit"
// ที่ระบบใช้จัดเรียงลำดับไพ่อยู่แล้ว (ดู SUIT_ORDER ใน ui.jsx)
const SUIT_OPTIONS = ["wands", "cups", "swords", "pentacles"];

const emptyNewCard = () => ({
  cardNumber: "",
  name: "",
  category: CARD_TYPES[0],
  suit: "",
  imageUrl: null,
  meaning: "",
});

export default function AddCardView({ cards, onSave, onCreate, notify }) {
  // ── โหมดของหน้า: "existing" = เพิ่มคำทำนายให้ไพ่ที่มีอยู่ (ของเดิม), "create" = สร้างไพ่ใบใหม่ ──
  const [mode, setMode] = useState("existing");

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(emptyPredictions());
  const [saving, setSaving] = useState(false);

  const [newCard, setNewCard] = useState(emptyNewCard());
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const selectedCard = cards.find((c) => c.id === selectedId) ?? null;

  const selectCard = (id) => {
    setSelectedId(id);
    const card = cards.find((c) => c.id === id);
    const next = emptyPredictions();
    PREDICTION_TOPICS.forEach((topic) => {
      next[topic.normalField] = card?.[topic.normalField] || "";
      next[topic.reversedField] = card?.[topic.reversedField] || "";
    });
    setDraft(next);
  };

  const updateField = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    if (!selectedCard) return;
    setSaving(true);
    try {
      await onSave(selectedCard.id, draft);
      notify(`บันทึกคำทำนายของ "${selectedCard.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      notify(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedId(null);
    setDraft(emptyPredictions());
  };

  // ── สร้างไพ่ใบใหม่ ──
  const updateNewCard = (key) => (val) => {
    setFormError("");
    setNewCard((d) => ({ ...d, [key]: val }));
  };

  const resetNewCardForm = () => {
    setNewCard(emptyNewCard());
    setFormError("");
  };

  const validateNewCard = () => {
    if (!newCard.cardNumber.trim()) return "กรุณากรอกเบอร์ไพ่";
    if (!newCard.name.trim()) return "กรุณากรอกชื่อไพ่";
    if (!newCard.imageUrl) return "กรุณาอัปโหลดรูปหน้าไพ่";
    if (!newCard.category) return "กรุณาเลือกประเภทไพ่";
    if (!newCard.meaning.trim()) return "กรุณากรอกคำอธิบายของไพ่";
    return "";
  };

  const handleCreateCard = async () => {
    const error = validateNewCard();
    if (error) {
      setFormError(error);
      return;
    }
    setCreating(true);
    try {
      await onCreate({
        cardNumber: newCard.cardNumber.trim(),
        name: newCard.name.trim(),
        category: newCard.category,
        suit: newCard.suit || (newCard.category === "Major Arcana" ? "major" : ""),
        imageUrl: newCard.imageUrl,
        meaning: newCard.meaning.trim(),
        meaningReversed: "",
        meaningLove: "",
        meaningLoveReversed: "",
        meaningWork: "",
        meaningWorkReversed: "",
        meaningMoney: "",
        meaningMoneyReversed: "",
      });
      notify(`เพิ่มไพ่ "${newCard.name.trim()}" เข้าสู่ระบบเรียบร้อยแล้ว`);
      resetNewCardForm();
      setMode("existing");
    } catch (err) {
      setFormError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── แถบหัวข้อ + ปุ่มสลับโหมด ── */}
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: COLORS.textMuted }}>
          {mode === "create"
            ? "กรอกข้อมูลไพ่ทาโรต์ใบใหม่ให้ครบทุกฟิลด์ที่จำเป็น"
            : "เลือกไพ่จากรายการด้านซ้ายเพื่อเพิ่มคำทำนาย หรือสร้างไพ่ใบใหม่เข้าสำรับ"}
        </div>
        {mode === "existing" ? (
          <PrimaryButton icon={Plus} onClick={() => setMode("create")}>
            สร้างไพ่ใบใหม่
          </PrimaryButton>
        ) : (
          <GhostButton icon={ArrowLeft} onClick={() => { setMode("existing"); setFormError(""); }}>
            กลับไปเลือกไพ่ที่มีอยู่
          </GhostButton>
        )}
      </div>

      {mode === "create" ? (
        // ══════════════ ฟอร์มสร้างไพ่ใบใหม่ ══════════════
        <div
          className="flex-1 rounded-2xl p-8 flex flex-col gap-6"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          <div className="pb-6" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontFamily: FONT_DISPLAY, color: COLORS.purpleDeep, fontSize: 20 }}>
              สร้างไพ่ใบใหม่
            </div>
            <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              เพิ่มไพ่ทาโรต์ใบใหม่เข้าสำรับ พร้อมข้อมูลพื้นฐานให้ครบถ้วน
            </div>
          </div>

          {formError && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(194,91,114,0.08)", color: COLORS.danger }}
            >
              ⚠️ {formError}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ImageDropzone
                image={newCard.imageUrl}
                onChange={updateNewCard("imageUrl")}
                width={190}
                aspectRatio="19 / 30"
              />
              <span className="text-xs" style={{ color: COLORS.textFaint }}>
                หน้าไพ่ *
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>เบอร์ไพ่ *</FieldLabel>
                  <TextInput
                    value={newCard.cardNumber}
                    onChange={(e) => updateNewCard("cardNumber")(e.target.value)}
                    placeholder="เช่น 0, 1, 2..."
                  />
                </div>
                <div>
                  <FieldLabel>ชื่อไพ่ *</FieldLabel>
                  <TextInput
                    value={newCard.name}
                    onChange={(e) => updateNewCard("name")(e.target.value)}
                    placeholder="เช่น THE FOOL"
                    style={{ fontFamily: FONT_DISPLAY }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>ประเภทไพ่ *</FieldLabel>
                  <Select
                    value={newCard.category}
                    onChange={(e) => updateNewCard("category")(e.target.value)}
                    options={CARD_TYPES}
                  />
                </div>
                {newCard.category === "Minor Arcana" && (
                  <div>
                    <FieldLabel>หมวดไพ่ย่อย</FieldLabel>
                    <Select
                      value={newCard.suit}
                      onChange={(e) => updateNewCard("suit")(e.target.value)}
                      options={["", ...SUIT_OPTIONS]}
                    />
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>คำอธิบายของไพ่ *</FieldLabel>
                <TextArea
                  rows={5}
                  placeholder="ความหมายทั่วไปของไพ่ใบนี้..."
                  value={newCard.meaning}
                  onChange={(e) => updateNewCard("meaning")(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-2">
            <GhostButton onClick={resetNewCardForm}>ล้างฟอร์ม</GhostButton>
            <PrimaryButton icon={Save} onClick={handleCreateCard} disabled={creating}>
              {creating ? "กำลังบันทึก..." : "บันทึกไพ่ใบใหม่"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        // ══════════════ ของเดิม: เลือกไพ่ที่มีอยู่ + เพิ่มคำทำนาย ══════════════
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <CardListPanel cards={cards} query={query} setQuery={setQuery} selectedId={selectedId} onSelect={selectCard} />

          {!selectedCard ? (
            <EmptyState text="เลือกไพ่จากรายการด้านซ้ายเพื่อเพิ่มคำทำนาย" />
          ) : (
            <div
              className="flex-1 rounded-2xl p-8 flex flex-col gap-6"
              style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-start gap-4 pb-6" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ cursor: "default" }} title="แก้ไขรูปภาพได้ที่หน้าแก้ไขข้อมูลไพ่ทาโรต์">
                  <CardFace
                    imageUrl={selectedCard.imageUrl}
                    name={selectedCard.name}
                    number={selectedCard.number}
                    size="xl"
                  />
                </div>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, color: COLORS.purpleDeep, fontSize: 20 }}>
                    {selectedCard.name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    เพิ่มคำทำนายสำหรับไพ่ใบนี้ (ทั้งสถานะตั้งตรงและกลับหัว)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PREDICTION_TOPICS.map((topic) => (
                  <React.Fragment key={topic.key}>
                    <div>
                      <FieldLabel>{topic.label} · ตั้งตรง</FieldLabel>
                      <TextArea
                        rows={4}
                        placeholder={`ความหมายด้าน${topic.label}เมื่อไพ่ตั้งตรง...`}
                        value={draft[topic.normalField]}
                        onChange={(e) => updateField(topic.normalField)(e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>{topic.label} · กลับหัว</FieldLabel>
                      <TextArea
                        rows={4}
                        placeholder={`ความหมายด้าน${topic.label}เมื่อไพ่กลับหัว...`}
                        value={draft[topic.reversedField]}
                        onChange={(e) => updateField(topic.reversedField)(e.target.value)}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex justify-end items-center gap-3 pt-2">
                <GhostButton onClick={handleCancel}>ยกเลิก</GhostButton>
                <PrimaryButton icon={Save} onClick={handleSave} disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
