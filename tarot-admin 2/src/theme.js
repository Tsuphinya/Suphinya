export const COLORS = {
  bg: "#F7F4FC",
  bgGrad: "linear-gradient(160deg, #FBF9FE 0%, #F4EEFB 45%, #ECE3F9 100%)",
  panel: "#FFFFFF",
  panelSoft: "#F5F1FB",
  panelElevated: "#ECE3F9",
  border: "rgba(124,92,191,0.14)",
  borderStrong: "rgba(124,92,191,0.32)",
  purple: "#7C5CBF",
  purpleBright: "#9B7FD4",
  purpleDeep: "#5B3F94",
  gold: "#C9A15E",
  goldBright: "#DFC085",
  text: "#2C2440",
  textMuted: "#6E6288",
  textFaint: "#A79BC4",
  danger: "#C25B72",
  success: "#4F9A7D",
};

export const FONT_DISPLAY = "'Chonburi', serif";
export const FONT_BODY = "'Noto Sans Thai', 'Inter', sans-serif";

export const CARD_TYPES = ["Major Arcana", "Minor Arcana"];

// 🌟 หัวข้อคำทำนาย — ตรงกับ field name ที่แอปมือถือ (Fortune-TellingApp) อ่านจริง
// แต่ละหัวข้อมี 2 สถานะ: ตั้งตรง (normalField) และกลับหัว (reversedField)
export const PREDICTION_TOPICS = [
  { key: "love", label: "ความรัก", normalField: "meaningLove", reversedField: "meaningLoveReversed" },
  { key: "work", label: "การงาน", normalField: "meaningWork", reversedField: "meaningWorkReversed" },
  { key: "money", label: "การเงิน", normalField: "meaningMoney", reversedField: "meaningMoneyReversed" },
];

// 🌟 บริบท "ความหมายทั่วไป" — ตรงกับ field meaning / meaningReversed ใน Firestore
// แยกไว้ต่างหากจาก PREDICTION_TOPICS เพื่อไม่ให้กระทบหน้าเพิ่ม/แก้ไขไพ่เดิมที่ยังใช้แค่ 3 บริบท
export const GENERAL_TOPIC = { key: "general", label: "ความหมายทั่วไป", normalField: "meaning", reversedField: "meaningReversed" };

// 🌟 ใช้ในหน้า "จัดการข้อมูลไพ่ทาโรต์" ที่ต้องจัดการครบทั้ง 4 บริบทในที่เดียว (testcase 3)
export const ALL_PREDICTION_TOPICS = [GENERAL_TOPIC, ...PREDICTION_TOPICS];

export const NAV_ITEMS = [
  { key: "add", label: "เพิ่มข้อมูลไพ่ทาโรต์" },
  { key: "edit", label: "แก้ไขข้อมูลไพ่ทาโรต์" },
  { key: "manage", label: "จัดการข้อมูลไพ่ทาโรต์" },
];

export const emptyForm = () => ({
  number: "",
  name: "",
  type: CARD_TYPES[0],
  imageUrl: null,
  description: "",
});
