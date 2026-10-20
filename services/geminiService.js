// services/geminiService.js

import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// =====================================================================
// 🔥 [POSITION] ความหมายตำแหน่งไพ่ แยกตามจำนวนไพ่ที่จั่ว (3, 4, 5, 6 ใบ)
// =====================================================================
const SPREAD_POSITIONS = {
  3: {
    spreadName: 'ไพ่ 3 ใบ (อดีต - ปัจจุบัน - อนาคต)',
    positions: [
      'อดีต (สิ่งที่ผ่านมาแล้ว / สาเหตุ)',
      'ปัจจุบัน (สถานการณ์ที่เป็นอยู่ในตอนนี้)',
      'อนาคต (แนวโน้มที่จะเกิดขึ้นต่อไป)',
    ],
  },
  4: {
    spreadName: 'ไพ่ 4 ใบ (ตัดสินใจเลือกทางเลือก)',
    positions: [
      'ปัจจุบัน (สถานการณ์ที่เป็นอยู่)',
      'ผลลัพธ์ที่จะเกิด หากเลือกทางเลือกที่ 1',
      'ผลลัพธ์ที่จะเกิด หากเลือกทางเลือกที่ 2',
      'บทสรุป หรือคำแนะนำที่ควรทำ',
    ],
  },
  5: {
    spreadName: 'ไพ่ 5 ใบ (วิเคราะห์เจาะลึก)',
    positions: [
      'ตัวตนและพลังงานปัจจุบัน (The Core) - สภาพจิตใจ สถานการณ์หลัก หรือจุดยืนของผู้ถามในปัจจุบัน',
      'อดีตที่ส่งผลถึงตอนนี้ (The Past) - เหตุการณ์หรือประสบการณ์ที่ผ่านมาไม่นาน ซึ่งเป็นรากฐานของเรื่องในตอนนี้',
      'อนาคตอันใกล้ (The Near Future) - สิ่งที่จะเกิดขึ้น แนวโน้ม หรือการเปลี่ยนแปลงที่จะเข้ามาเร็ว ๆ นี้',
      'สิ่งที่อยู่เหนือการควบคุม / อิทธิพลภายนอก (External Factors) - สถานการณ์รอบตัว คนรอบข้าง หรือโชคชะตาที่ควบคุมไม่ได้แต่ต้องตั้งรับ',
      'บทสรุป / คำแนะนำ (Outcome & Advice) - ผลลัพธ์ในภาพรวม และแนวทางที่ควรปฏิบัติเพื่อผ่านพ้นช่วงนี้ไปได้ด้วยดี',
    ],
  },
  6: {
    spreadName: 'ไพ่ 6 ใบ (ภาพรวมรอบด้าน)',
    positions: [
      'อดีตที่เป็นรากฐานของเรื่องนี้',
      'สถานการณ์ปัจจุบัน',
      'อนาคตอันใกล้',
      'ทัศนคติ/ความคิดในใจของตัวผู้ถามเอง',
      'อิทธิพลจากสิ่งแวดล้อมภายนอก (คนรอบข้าง, โชคชะตา)',
      'บทสรุปในท้ายที่สุด',
    ],
  },
};

// =====================================================================
// 🔥 [FIREBASE] ชื่อฟิลด์ความหมายไพ่ในคอลเลกชัน 'card' แยกตามหัวข้อ
// =====================================================================
const TOPIC_FIELDS = {
  ความรัก: { normal: 'meaningLove',  reversed: 'meaningLoveReversed' },
  การงาน:  { normal: 'meaningWork',  reversed: 'meaningWorkReversed' },
  การเงิน: { normal: 'meaningMoney', reversed: 'meaningMoneyReversed' },
};

/**
 * 🔥 [FIREBASE] ดึงความหมายไพ่ตามหัวข้อ + ไพ่ตั้ง/กลับหัว
 * 1) ใช้ข้อมูลที่หน้า Fortune ดึงจาก Firebase มาแล้ว (อยู่ใน selectedCards)
 * 2) ถ้าไม่มีฟิลด์ความหมายนั้น และไพ่มี id จะไปดึงเอกสารจาก Firestore ('card/{id}') เพิ่ม
 */
const getCardMeaningFromFirebase = async (card, category, isReversed) => {
  const field = TOPIC_FIELDS[category];
  if (!field) return '';

  const pickMeaning = (data) =>
    isReversed
      ? data[field.reversed] || data.meaningReversed || ''
      : data[field.normal] || '';

  let meaning = pickMeaning(card);

  if (!meaning && card.id) {
    try {
      const snap = await getDoc(doc(db, 'card', card.id));
      if (snap.exists()) {
        meaning = pickMeaning(snap.data());
        console.log(`🔥 [Firebase] ดึงความหมายไพ่ "${card.name}" เพิ่มจาก Firestore สำเร็จ`);
      }
    } catch (err) {
      console.error('🔥 [Firebase] ดึงข้อมูลไพ่ไม่สำเร็จ:', err);
    }
  }

  return meaning;
};

/**
 * ฟังก์ชันส่งข้อมูลไพ่ทั้งหมดไปให้ Gemini AI วิเคราะห์และสรุปคำทำนายโดยรวมแบบ Real-time
 */
export const fetchOverallFortune = async (category, selectedCards) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("Missing Gemini API Key in .env file");
      return "ไม่พบ API Key สำหรับเชื่อมต่อ AI กรุณาตรวจสอบการตั้งค่าในไฟล์ .env";
    }

    if (!selectedCards || selectedCards.length === 0) {
      return "ไม่พบข้อมูลไพ่สำหรับประมวลผล";
    }

    // 🔥 [POSITION] เลือกรูปแบบการวางไพ่ตามจำนวนไพ่ที่จั่ว
    const spread = SPREAD_POSITIONS[selectedCards.length];

    // 1. เรียบเรียงรายการไพ่ + ตำแหน่ง + ความหมายจาก Firebase
    const cardDetailsList = await Promise.all(
      selectedCards.map(async (card, index) => {
        const cardName = card.cardName || card.name || 'ไม่ระบุชื่อไพ่';
        const isReversed = card.cardIsReversed || card.isUpright === false;
        const orientationStr = isReversed ? 'กลับหัว (Reversed)' : 'ตั้งตรง (Upright)';

        // 🔥 [POSITION] ความหมายของตำแหน่งนี้
        const positionMeaning = spread?.positions[index] || `ตำแหน่งที่ ${index + 1}`;

        // 🔥 [FIREBASE] ความหมายไพ่ในหัวข้อนี้จาก Firebase
        const cardMeaning = await getCardMeaningFromFirebase(card, category, isReversed);

        return (
`ใบที่ ${index + 1}
  - ตำแหน่ง: ${positionMeaning}
  - ไพ่: "${cardName}" สถานะ ${orientationStr}
  - ความหมายไพ่ในเรื่อง${category || 'ทั่วไป'} (จากฐานข้อมูล): ${cardMeaning || 'ไม่มีข้อมูลในฐานข้อมูล ให้ใช้ความรู้ทาโรต์ทั่วไปประกอบ'}`
        );
      })
    );
    const cardDetailsText = cardDetailsList.join('\n\n');

    // 2. สร้าง Dynamic Prompt
    const prompt = `
คุณคือหมอดูไพ่ทาโรต์ผู้เชี่ยวชาญภาษาไทยที่มีน้ำเสียงเป็นกันเอง สุภาพ และน่าค้นหา
ผู้ใช้งานได้ทำการจั่วไพ่รวมทั้งหมด ${selectedCards.length} ใบ ในหัวข้อเรื่อง "${category || 'ทั่วไป'}"
รูปแบบการวางไพ่: ${spread?.spreadName || `ไพ่ ${selectedCards.length} ใบ`}

รายการไพ่ที่จั่วได้ พร้อมตำแหน่งและความหมายจากฐานข้อมูล:
${cardDetailsText}

หน้าที่ของคุณ:
วิเคราะห์และสรุป "คำทำนายโดยรวม" จากไพ่ทั้งหมดนี้ที่สัมพันธ์กัน โดยเน้นคำแนะนำเฉพาะในเรื่อง "${category || 'ทั่วไป'}"
ต้องอ้างอิง "ความหมายของตำแหน่งไพ่" ควบคู่กับ "ความหมายไพ่จากฐานข้อมูล" และสถานะตั้งตรง/กลับหัวของแต่ละใบ
เรียงเรื่องราวให้ต่อเนื่องตามลำดับตำแหน่ง (เช่น อดีต → ปัจจุบัน → อนาคต) ไม่ใช่ไล่อธิบายทีละใบแยกกัน

ข้อกำหนดในการตอบคำทำนาย:
1. ใช้ภาษาไทย สุภาพ อ่านง่าย เข้าใจง่าย และให้กำลังใจ
2. สรุปบทวิเคราะห์ภาพรวมความยาวประมาณ 4-6 บรรทัด โดยเชื่อมโยงตำแหน่งของไพ่แต่ละใบเข้าด้วยกัน
3. ให้แนวทางหรือคำแนะนำในการปฏิบัติตัว 2-3 ข้อแบบกระชับ
4. ไม่ต้องใส่คำเกริ่นทักทายยาว ๆ ให้เข้าสู่เนื้อหาบทสรุปคำทำนายโดยรวมได้ทันที
5. ห้ามใส่เครื่องหมาย Markdown เช่น ** หรือ # ให้ส่งข้อความธรรมดาเท่านั้น
`;

    // 3. Endpoint
    const modelName = "gemini-3.5-flash-lite";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    // ---------------------------------------------------------------
    // 🌟 Log ก่อนยิง API — พิสูจน์ว่ากำลังเรียก Gemini จริง ไม่ใช่ mock
    // ---------------------------------------------------------------
    console.log('🔮 [Gemini AI] ==================== เริ่มเรียก Gemini API ====================');
    console.log('🔮 [Gemini AI] โมเดลที่ใช้:', modelName);
    console.log('🔮 [Gemini AI] Endpoint:', apiUrl.replace(GEMINI_API_KEY, '***API_KEY_HIDDEN***'));
    console.log('🔮 [Gemini AI] หัวข้อคำทำนาย:', category);
    console.log('🔮 [Gemini AI] จำนวนไพ่ที่ส่งไปวิเคราะห์:', selectedCards.length);
    console.log('🔮 [Gemini AI] Prompt ที่ส่งไป:\n' + prompt);

    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const durationMs = Date.now() - startTime;
    const data = await response.json();

    // ---------------------------------------------------------------
    // 🌟 Log หลังได้รับ response — โชว์ raw response จาก Google ตรงๆ
    // ---------------------------------------------------------------
    console.log('✅ [Gemini AI] ได้รับ response กลับมาแล้ว | HTTP status:', response.status, '| ใช้เวลา:', durationMs, 'ms');
    console.log('✅ [Gemini AI] Raw response จาก Google:', JSON.stringify(data, null, 2));
    if (data.usageMetadata) {
      console.log('✅ [Gemini AI] Token usage:', data.usageMetadata);
    }
    if (data.modelVersion) {
      console.log('✅ [Gemini AI] Model version ที่ Google ยืนยันกลับมา:', data.modelVersion);
    }

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const resultText = data.candidates[0].content.parts[0].text.trim();
      console.log('✅ [Gemini AI] ข้อความคำทำนายที่แยกได้:', resultText);
      console.log('🔮 [Gemini AI] ==================== จบการเรียก Gemini API ====================');
      return resultText;
    } else {
      console.error("Gemini API Response Format Error:", data);
      return "ไม่สามารถประมวลผลคำทำนายโดยรวมได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
    }

  } catch (error) {
    console.error("Error connecting to Gemini API:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
  }
};

/**
 * 🌟 ฟังก์ชันขอดวงชะตาภาพรวมประจำวัน สำหรับราศีของผู้ใช้ (ใช้ในหน้า Home)
 * เปลี่ยนเนื้อหาทุกวันตามวันในสัปดาห์ + วันที่จริง ผ่าน Gemini AI
 */
export const fetchDailyZodiacFortune = async (zodiacName) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("Missing Gemini API Key in .env file");
      return "ไม่พบ API Key สำหรับเชื่อมต่อ AI กรุณาตรวจสอบการตั้งค่าในไฟล์ .env";
    }

    if (!zodiacName) {
      return "ยังไม่ทราบราศีของคุณ กรุณาเพิ่มวันเกิดในหน้าโปรไฟล์ เพื่อดูดวงประจำวันเฉพาะคุณ";
    }

    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const now = new Date();
    const dayName = dayNames[now.getDay()];
    const dateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `
บทบาท: คุณคือนักพยากรณ์ดวงชะตามืออาชีพ
งาน: พยากรณ์ดวงชะตาภาพรวมประจำวันสำหรับผู้ที่เกิด "${zodiacName}" ประจำ${dayName}ที่ ${dateStr}

ข้อกำหนดและกฎเหล็กในการเขียน (ต้องปฏิบัติตามอย่างเคร่งครัด):
1. ใช้ภาษาไทยล้วน 100% ห้ามมีคำภาษาอังกฤษ คำทับศัพท์ หรือคำแสลงปนโดยเด็ดขาด (เช่น ห้ามใช้คำว่า and, vibe, project ให้ใช้คำไทยแทน เช่น และ, บรรยากาศ, แผนงานหรือโครงการ)
2. สะกดคำภาษาไทยให้ถูกต้องตามหลักไวยากรณ์และพจนานุกรมไทยทุกคำ ภาษาต้องสละสลวย นุ่มนวล ชวนอ่าน
3. ห้ามใช้คำลงท้ายแสดงเพศทุกชนิด เช่น "ครับ", "ค่ะ", "นะคะ", "นะครับ" โดยเด็ดขาด
4. ห้ามใส่เครื่องหมาย Markdown ใดๆ ทั้งสิ้น เช่น ** หรือ * หรือ # ให้ส่งข้อความธรรมดาเท่านั้น
5. ไม่ต้องทักทายหรือเกริ่นนำ ให้เริ่มต้นด้วยเนื้อหาคำทำนายทันที ความยาวประมาณ 3-4 ประโยคกระชับ ได้ใจความ พร้อมสอดแทรกคำแนะนำเสริมพลังบวกสั้นๆ
`;

    const modelName = "gemini-3.5-flash-lite";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    console.log('🔮 [Gemini AI] ขอดวงประจำวัน | ราศี:', zodiacName, '| วัน:', dayName, dateStr);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let resultText = data.candidates[0].content.parts[0].text.trim();

      // ชั้นกรองความปลอดภัย: ลบเครื่องหมาย Markdown และคำลงท้ายทิ้งทันที
      resultText = resultText
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/(ครับ|ค่ะ|นะคะ|นะครับ)/g, '')
        .trim();

      console.log('✅ [Gemini AI] ได้ดวงประจำวันแล้ว:', resultText.slice(0, 80) + '...');
      return resultText;
    } else {
      console.error("Gemini API Response Format Error:", data);
      return "ไม่สามารถประมวลผลดวงประจำวันได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
    }

  } catch (error) {
    console.error("Error connecting to Gemini API:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
  }
};