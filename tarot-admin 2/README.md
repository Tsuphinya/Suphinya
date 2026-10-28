# Tarot Admin

หน้าเว็บหลังบ้านสำหรับผู้ดูแลระบบ จัดการข้อมูลไพ่ทาโรต์และคำทำนาย เชื่อมต่อกับ Firebase
(Authentication + Firestore) ของคุณโดยตรง

---

## เริ่มต้นตั้งแต่ศูนย์ (สำหรับคนที่ไม่เคยรันโปรเจกต์ React มาก่อน)

โปรเจกต์นี้เป็นเว็บแบบ **React** ที่ build ด้วยเครื่องมือชื่อ **Vite** ก่อนจะรันได้ เครื่องคุณต้องมี
โปรแกรมพื้นฐาน 2 อย่างติดตั้งไว้ก่อน

### ขั้นตอนที่ 1 — ติดตั้ง Node.js

Node.js คือโปรแกรมที่ทำให้เครื่องคุณรันโค้ด JavaScript นอกเบราว์เซอร์ได้ และมันจะพา **npm**
(ตัวจัดการแพ็กเกจที่ใช้ติดตั้งไลบรารีต่างๆ) ติดมาด้วยในตัว

1. ไปที่ [https://nodejs.org](https://nodejs.org)
2. ดาวน์โหลดเวอร์ชัน **LTS** (เวอร์ชันเสถียร แนะนำสำหรับคนทั่วไป)
3. ติดตั้งตามขั้นตอนปกติ (Next > Next > Install)
4. ตรวจสอบว่าติดตั้งสำเร็จ โดยเปิด Terminal (Mac/Linux) หรือ Command Prompt/PowerShell (Windows)
   แล้วพิมพ์:

   ```bash
   node -v
   npm -v
   ```

   ถ้าติดตั้งสำเร็จ จะเห็นเลขเวอร์ชันขึ้นมา เช่น `v22.x.x` และ `10.x.x`

### ขั้นตอนที่ 2 — ติดตั้งโปรแกรมแก้โค้ด (แนะนำ)

ใช้โปรแกรมไหนแก้โค้ดก็ได้ แต่ที่แนะนำและใช้งานฟรีคือ
[Visual Studio Code](https://code.visualstudio.com/) — ดาวน์โหลด ติดตั้ง แล้วเปิดโฟลเดอร์โปรเจกต์นี้ผ่านมันได้เลย

### ขั้นตอนที่ 3 — แตกไฟล์โปรเจกต์และเปิด Terminal

1. แตกไฟล์ `tarot-admin.zip` ที่ได้รับมา ไปไว้ในตำแหน่งที่ต้องการ (เช่น Desktop)
2. เปิด Terminal แล้ว `cd` เข้าไปในโฟลเดอร์ที่แตกไฟล์ เช่น:

   ```bash
   cd Desktop/tarot-admin
   ```

   หรือถ้าใช้ VS Code: เปิดโฟลเดอร์ `tarot-admin` ผ่านเมนู File > Open Folder แล้วเปิด
   Terminal ในตัวโปรแกรมได้เลย (menu Terminal > New Terminal)

### ขั้นตอนที่ 4 — ติดตั้งไลบรารีที่โปรเจกต์ต้องใช้

รันคำสั่งนี้ครั้งเดียว (จะสร้างโฟลเดอร์ `node_modules` ที่เก็บไลบรารีทั้งหมด เช่น React, Firebase):

```bash
npm install
```

รอสักครู่จนขึ้นข้อความว่าติดตั้งเสร็จ (ปกติใช้เวลาไม่กี่สิบวินาที)

### ขั้นตอนที่ 5 — ตั้งค่า Firebase

ทำตามหัวข้อ **"1. เตรียม Firebase"** ด้านล่าง เพื่อสร้างโปรเจกต์ Firebase และใส่ค่า config
ในไฟล์ `src/firebase.js`

### ขั้นตอนที่ 6 — รันเว็บบนเครื่องตัวเอง

```bash
npm run dev
```

Terminal จะขึ้น URL แบบนี้:

```
Local:   http://localhost:5173/
```

เปิดลิงก์นั้นในเบราว์เซอร์ ก็จะเห็นเว็บที่ทำงานจริง แก้โค้ดตรงไหนแล้วบันทึก
หน้าเว็บจะรีเฟรชให้อัตโนมัติ กด `Ctrl+C` ใน Terminal เพื่อหยุดเซิร์ฟเวอร์เมื่อเลิกใช้งาน

### ขั้นตอนที่ 7 — เมื่อพร้อมใช้งานจริง (deploy)

เมื่อพัฒนาเสร็จและอยากเผยแพร่ให้คนอื่นเข้าถึงได้ ให้ build ไฟล์สำหรับ production ก่อน:

```bash
npm run build
```

คำสั่งนี้จะสร้างโฟลเดอร์ `dist/` ที่รวมไฟล์ HTML/CSS/JS พร้อมใช้งานจริง จากนั้นนำไฟล์ในโฟลเดอร์นี้
ไปอัปโหลดขึ้นบริการโฮสติ้งที่รองรับเว็บสถิต (static site) เช่น **Firebase Hosting**, **Vercel**,
หรือ **Netlify** — ถ้าต้องการ ผมช่วยเขียนขั้นตอน deploy ขึ้น Firebase Hosting ให้ได้เลย
เพราะโปรเจกต์นี้ใช้ Firebase อยู่แล้ว

---

## 1. เตรียม Firebase

1. เปิด [Firebase Console](https://console.firebase.google.com) แล้วสร้างโปรเจกต์ (หรือใช้โปรเจกต์เดิม)
2. ไปที่ **Build → Authentication → Sign-in method** แล้วเปิดใช้งาน **Email/Password**
3. ไปที่ **Authentication → Users** แล้วเพิ่มบัญชีแอดมิน (อีเมล + รหัสผ่าน) ที่จะใช้ล็อกอินหน้านี้
4. ไปที่ **Build → Firestore Database** แล้วสร้างฐานข้อมูล (โหมด production หรือ test ก็ได้)
5. ไปที่ **Project settings → General → Your apps** แล้วเพิ่มแอปแบบ Web (</>) เพื่อเอาค่า config

## 2. ใส่ค่า Config

เปิดไฟล์ `src/firebase.js` แล้วแทนที่ค่าตัวอย่างด้วยค่าจริงจากโปรเจกต์คุณ:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

## 3. Firestore Security Rules

ระบบนี้อ่าน/เขียนที่ collection ชื่อ **`card`** (ตรงกับที่แอปมือถือ Fortune-TellingApp ใช้จริง)
และอนุญาตเฉพาะผู้ที่ล็อกอินแล้ว ไปที่ **Firestore Database → Rules** แล้ววางกฎนี้ (หรือปรับตามนโยบายของคุณ):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /card/{cardId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. รันโปรเจกต์

```bash
npm install
npm run dev
```

เปิด `http://localhost:5173` — ระบบจะแสดงหน้า login ก่อน เมื่อเข้าสู่ระบบสำเร็จจะเห็นแดชบอร์ด
และข้อมูลไพ่ทั้งหมดจะซิงก์แบบเรียลไทม์กับ Firestore ของคุณ (แก้ไข/บันทึกคำทำนาย จากที่นี่จะอัปเดตในฐานข้อมูลทันที
และแอปมือถือจะเห็นผลทันทีเช่นกัน เพราะอ่านจาก collection เดียวกัน)

## โครงสร้างข้อมูลใน Firestore

แต่ละเอกสารใน collection `card` (สร้างไว้แล้วจากฝั่งแอปมือถือ เว็บนี้ไม่ได้สร้างไพ่ใหม่ ทำหน้าที่แค่
เพิ่ม/แก้ไขข้อมูลของไพ่ที่มีอยู่แล้ว):

```json
{
  "name": "The Fool",
  "imageUrl": "https://...",
  "number": "0",
  "type": "Major Arcana",
  "description": "การเริ่มต้นใหม่ ความไร้เดียงสา...",
  "meaningLove": "...",
  "meaningLoveReversed": "...",
  "meaningWork": "...",
  "meaningWorkReversed": "...",
  "meaningMoney": "...",
  "meaningMoneyReversed": "..."
}
```

> **หมายเหตุสำคัญ:** field คำทำนาย (`meaningLove`, `meaningWork`, `meaningMoney` และคู่ reversed ของแต่ละอัน)
> เป็น field แบบ **flat อยู่ระดับบนสุดของเอกสาร** ไม่ได้ห่อไว้ใน object ย่อย เพราะแอปมือถืออ่านค่าตรงๆ
> จาก field เหล่านี้ (ดูใน `fortune.jsx` ของแอปมือถือ ฟังก์ชัน `getSpecificCardMeaning`)
>
> **เรื่องรูปภาพ:** ฟิลด์ `imageUrl` ต้องเป็น URL จริง (เช่นจาก Firebase Storage หรือ Cloudinary) ไม่ใช่ base64
> string ยาวๆ — ถ้า field นี้ยังเป็น base64 อยู่ (จากตอนที่เคยแก้ไขรูปผ่านหน้า "แก้ไขข้อมูลไพ่ทาโรต์")
> จะยังใช้งานได้ในเว็บนี้ แต่แนะนำให้เปลี่ยนไปใช้ URL จริงเพื่อความสอดคล้องกับข้อมูลที่แอปมือถือคาดหวัง


## โครงสร้างโปรเจกต์

```
src/
  firebase.js              การตั้งค่าและเริ่มต้น Firebase
  theme.js                 โทนสี ฟอนต์ และค่าคงที่ของธีม
  App.jsx                  โครงหลัก: ตรวจสอบสถานะล็อกอิน + เมนู + เชื่อมต่อ Firestore
  components/
    Login.jsx               หน้าล็อกอิน (Firebase Auth)
    ui.jsx                   ส่วนประกอบ UI ที่ใช้ร่วมกัน
    AddCardView.jsx          เพิ่มคำทำนาย (เลือกไพ่ที่มีอยู่แล้ว แล้วกรอกความหมายแต่ละหัวข้อ)
    EditCardView.jsx         แก้ไขข้อมูลพื้นฐานของไพ่ (ชื่อ, รูป, เบอร์, คำอธิบาย)
```
