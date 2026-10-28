import React, { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { COLORS, FONT_DISPLAY, PREDICTION_TOPICS } from "../theme.js";
import { FieldLabel, TextInput, TextArea, PrimaryButton, GhostButton, ImageDropzone, CardListPanel, EmptyState } from "./ui.jsx";

export default function EditCardView({ cards, onUpdate, onDelete, notify }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);
  const [draft, setDraft] = useState(cards[0] ?? null);
  const [saving, setSaving] = useState(false);

  // Keep the draft in sync if the underlying Firestore data changes
  // (e.g. edited elsewhere) while this card is selected.
  useEffect(() => {
    if (!selectedId) return;
    const latest = cards.find((c) => c.id === selectedId);
    if (latest) setDraft(latest);
  }, [cards, selectedId]);

  const selectCard = (id) => {
    setSelectedId(id);
    setDraft(cards.find((c) => c.id === id) ?? null);
  };

  const update = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { id, ...fields } = draft;
      await onUpdate(id, fields);
      notify(`บันทึกการแก้ไข "${draft.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      notify(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft) return;
    try {
      await onDelete(draft.id);
      notify(`ลบไพ่ "${draft.name}" แล้ว`);
      setSelectedId(null);
      setDraft(null);
    } catch (err) {
      notify(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      <CardListPanel cards={cards} query={query} setQuery={setQuery} selectedId={selectedId} onSelect={selectCard} />

      {!draft ? (
        <EmptyState text="เลือกไพ่จากรายการด้านซ้ายเพื่อแก้ไขข้อมูล" />
      ) : (
        <div
          className="flex-1 rounded-2xl p-8 flex flex-col gap-6"
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        >
          {/* หัวการ์ด: รูป + ชื่อ/เบอร์ไพ่ จัดเลย์เอาต์แบบเดียวกับหน้าเพิ่มข้อมูล
              (items-start ให้ชื่อไพ่ชิดขอบบนของรูป, รูปขนาด xl เท่ากับหน้าเพิ่มข้อมูล)
              ต่างจากหน้าเพิ่มข้อมูลตรงที่รูปตรงนี้ยังคลิกเพื่อเปลี่ยนได้ เพราะการแก้ไขรูปทำที่หน้านี้ */}
          <div className="flex items-start gap-4 pb-6" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <ImageDropzone
              image={draft.imageUrl}
              onChange={update("imageUrl")}
              width={190}
              aspectRatio="19 / 30"
              bordered={false}
            />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>เบอร์ไพ่</FieldLabel>
                <TextInput value={draft.cardNumber} onChange={(e) => update("cardNumber")(e.target.value)} />
              </div>
              <div>
                <FieldLabel>ชื่อไพ่</FieldLabel>
                <TextInput
                  value={draft.name}
                  onChange={(e) => update("name")(e.target.value)}
                  style={{ fontFamily: FONT_DISPLAY }}
                />
              </div>
            </div>
          </div>

          {/* 4 หมวดคำทำนายแบบเดียวกับหน้าเพิ่มข้อมูล ดึงค่าเดิมของไพ่ใบนี้มาแสดง แก้ไขได้เลย */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PREDICTION_TOPICS.map((topic) => (
              <React.Fragment key={topic.key}>
                <div>
                  <FieldLabel>{topic.label} · ตั้งตรง</FieldLabel>
                  <TextArea
                    rows={4}
                    placeholder={`ความหมายด้าน${topic.label}เมื่อไพ่ตั้งตรง...`}
                    value={draft[topic.normalField] || ""}
                    onChange={(e) => update(topic.normalField)(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>{topic.label} · กลับหัว</FieldLabel>
                  <TextArea
                    rows={4}
                    placeholder={`ความหมายด้าน${topic.label}เมื่อไพ่กลับหัว...`}
                    value={draft[topic.reversedField] || ""}
                    onChange={(e) => update(topic.reversedField)(e.target.value)}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <GhostButton icon={Trash2} onClick={handleDelete} danger>
              ลบไพ่ใบนี้
            </GhostButton>
            <PrimaryButton icon={Save} onClick={handleSave} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
