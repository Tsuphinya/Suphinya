import React, { useState } from "react";
import { Save } from "lucide-react";
import { COLORS, FONT_DISPLAY, ALL_PREDICTION_TOPICS } from "../theme.js";
import { FieldLabel, TextArea, PrimaryButton, GhostButton, CardListPanel, EmptyState, CardFace } from "./ui.jsx";

const emptyPredictions = () =>
  ALL_PREDICTION_TOPICS.reduce((acc, topic) => {
    acc[topic.normalField] = "";
    acc[topic.reversedField] = "";
    return acc;
  }, {});

export default function ManageCardView({ cards, onSave, notify }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(emptyPredictions());
  const [saving, setSaving] = useState(false);

  const selectedCard = cards.find((c) => c.id === selectedId) ?? null;

  const selectCard = (id) => {
    setSelectedId(id);
    const card = cards.find((c) => c.id === id);
    const next = emptyPredictions();
    ALL_PREDICTION_TOPICS.forEach((topic) => {
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
      notify(`บันทึกคำทำนายของ "${selectedCard.name}" ครบทุกบริบทเรียบร้อยแล้ว`);
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

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      <CardListPanel cards={cards} query={query} setQuery={setQuery} selectedId={selectedId} onSelect={selectCard} />

      {!selectedCard ? (
        <EmptyState text="เลือกไพ่จากรายการด้านซ้ายเพื่อจัดการคำทำนายทุกบริบท" />
      ) : (
        <div
          className="flex-1 rounded-2xl p-8 flex flex-col gap-6"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-start gap-4 pb-6" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            {/* หน้านี้เป็นหน้าจัดการคำทำนาย ไม่ใช่หน้าแก้ไขรูป จึงใช้ CardFace แบบอ่านอย่างเดียว
                เหมือนหน้าเพิ่มข้อมูล — แก้ไขรูปยังต้องทำที่หน้า "แก้ไขข้อมูลไพ่ทาโรต์" เท่านั้น */}
            <CardFace imageUrl={selectedCard.imageUrl} name={selectedCard.name} number={selectedCard.number} size="xl" />
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, color: COLORS.purpleDeep, fontSize: 20 }}>
                {selectedCard.name}
              </div>
              <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                จัดการคำทำนายของไพ่ใบนี้ครบทุกบริบท (ทั่วไป, ความรัก, การงาน, การเงิน)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ALL_PREDICTION_TOPICS.map((topic) => (
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
            <GhostButton onClick={handleCancel}>
              ยกเลิก
            </GhostButton>
            <PrimaryButton icon={Save} onClick={handleSave} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกคำทำนายทั้งหมด"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
