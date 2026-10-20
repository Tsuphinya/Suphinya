import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Modal, FlatList, ActivityIndicator, } from "react-native";
import { useRouter } from "expo-router";
import { GradientBg, GlassCard } from "../components/GradientBg";
import { COLORS, FONTS } from "../constants/Colors";
import { useUser } from "../context/UserContext";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import Svg, { Circle, Path, Rect } from "react-native-svg";
// ── ส่วนเชื่อมต่อ Firebase ──
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// ── Camera badge icon ──
function CameraIcon() {
    return (<Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Rect x=".5" y="2.5" width="11" height="8" rx="1.5" stroke="#fff" strokeWidth="1"/>
      <Circle cx="6" cy="6.5" r="2" stroke="#fff" strokeWidth="1"/>
      <Path d="M4 2.5l.8-1.5h2.4L8 2.5" stroke="#fff" strokeWidth="1"/>
    </Svg>);
}
const MONTHS = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤษภาคม",
    "ธันวาคม",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
// ── Dropdown Modal ──
function DropdownModal({ visible, items, selected, onSelect, onClose, title, }) {
    return (<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dm.overlay} activeOpacity={1} onPress={onClose}/>
      <View style={dm.sheet}>
        <View style={dm.handle}/>
        <Text style={dm.title}>{title}</Text>
        <FlatList data={items} keyExtractor={(item, index) => `${item}-${index}`} style={{ maxHeight: 300 }} renderItem={({ item }) => (<TouchableOpacity style={[dm.item, selected === item && dm.itemActive]} onPress={() => {
                onSelect(item);
                onClose();
            }}>
              <Text style={[dm.itemText, selected === item && dm.itemTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>)}/>
      </View>
    </Modal>);
}
const dm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: {
        backgroundColor: "#2d0060",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: "rgba(168,85,247,0.3)",
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignSelf: "center",
        marginBottom: 16,
    },
    title: {
        fontFamily: FONTS.bold,
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 12,
    },
    item: {
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    itemActive: { backgroundColor: "rgba(168,85,247,0.35)" },
    itemText: {
        fontFamily: FONTS.regular,
        color: "rgba(255,255,255,0.6)",
        fontSize: 15,
        textAlign: "center",
    },
    itemTextActive: { fontFamily: FONTS.bold, color: "#fff" },
});
// ── Main Screen ──
export default function RegisterScreen() {
    const router = useRouter();
    const { setUser } = useUser();
    const [avatar, setAvatar] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [showDayPicker, setShowDayPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    // State สำหรับสถานะการส่งข้อมูล
    const [loading, setLoading] = useState(false);
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("ต้องการสิทธิ์", "กรุณาอนุญาตให้แอปเข้าถึงรูปภาพในการตั้งค่า");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
                setAvatar(result.assets[0].uri);
            }
        }
        catch (e) {
            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกรูปได้ กรุณาลองใหม่");
        }
    };
    // ── สมัครสมาชิกด้วย Firebase Authentication จริง ──
    const handleRegister = async () => {
        if (!name.trim())
            return Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อผู้ใช้งาน");
        const emailValue = email.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
            return Alert.alert("แจ้งเตือน", "รูปแบบอีเมลไม่ถูกต้อง");
        if (password.length < 6)
            return Alert.alert("แจ้งเตือน", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        if (password !== confirmPassword)
            return Alert.alert("แจ้งเตือน", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
        if (!day || !month || !year)
            return Alert.alert("แจ้งเตือน", "กรุณาเลือกวันเดือนปีเกิด");
        setLoading(true);
        try {
            // 🔐 สร้างบัญชีผ่าน Firebase Authentication จริง
            const userCredential = await createUserWithEmailAndPassword(auth, emailValue, password);
            const firebaseUser = userCredential.user;
            // 📦 เก็บเฉพาะข้อมูล Profile ใน Firestore
            // ❌ ไม่เก็บ password
            const userData = {
                fullName: name.trim(),
                email: emailValue,
                avatar: avatar,
                birthday: `${day} ${month} ${year}`,
                createdAt: serverTimestamp(),
            };
            // ใช้ Firebase UID เป็น Document ID
            await setDoc(doc(db, "users", firebaseUser.uid), userData);
            // 👤 อัปเดตข้อมูลในแอป (Context)
            setUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid, // 🌟 แก้ไข: เพิ่ม uid ที่หายไป — UserContext.jsx ใช้ user.uid (ไม่ใช่ user.id)
                                        // ในการบันทึกประวัติดูดวง ขาดฟิลด์นี้ทำให้ userId เป็น undefined ตลอด
                name: name.trim(),
                email: emailValue,
                avatar,
                birthday: `${day} ${month} ${year}`,
            });
            setLoading(false);
            Alert.alert("🎉 สำเร็จ!", "สมัครสมาชิกเรียบร้อยแล้ว", [
                { text: "เริ่มเลย!", onPress: () => router.replace("/(tabs)") },
            ]);
        }
        catch (error) {
            setLoading(false);
            console.error("Firebase Register Error:", error);
            let message = "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่";
            switch (error.code) {
                case "auth/email-already-in-use":
                    message = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
                    break;
                case "auth/invalid-email":
                    message = "รูปแบบอีเมลไม่ถูกต้อง";
                    break;
                case "auth/weak-password":
                    message = "รหัสผ่านไม่ปลอดภัยเพียงพอ";
                    break;
                case "auth/network-request-failed":
                    message = "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้";
                    break;
            }
            Alert.alert("สมัครสมาชิกไม่สำเร็จ", message);
        }
    };
    return (<GradientBg>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>สมัครสมาชิก</Text>

          <GlassCard style={styles.card}>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
              {avatar ? (<Image source={{ uri: avatar }} style={styles.avatarImg}/>) : (<View style={styles.avatarEmpty}>
                  <Feather name="user" size={32} color="rgba(255,255,255,0.3)"/>
                </View>)}
              <View style={styles.camBadge}>
                <CameraIcon />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>แตะเพื่อเลือกรูปโปรไฟล์</Text>

            {/* Name */}
            <View style={styles.inputRow}>
              <Feather name="user" size={18} color="rgba(255,255,255,0.45)"/>
              <TextInput style={styles.input} placeholder="ชื่อผู้ใช้งาน" placeholderTextColor={COLORS.textFaint} value={name} onChangeText={setName}/>
            </View>

            {/* Email */}
            <View style={[styles.inputRow, { marginTop: 10 }]}>
              <Feather name="mail" size={18} color="rgba(255,255,255,0.45)"/>
              <TextInput style={styles.input} placeholder="อีเมล" placeholderTextColor={COLORS.textFaint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
            </View>

            {/* Password */}
            <View style={[styles.inputRow, { marginTop: 10 }]}>
              <Feather name="lock" size={18} color="rgba(255,255,255,0.45)"/>
              <TextInput style={styles.input} placeholder="รหัสผ่าน" placeholderTextColor={COLORS.textFaint} value={password} onChangeText={setPassword} secureTextEntry={!showPass}/>
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? "eye" : "eye-off"} size={18} color={showPass
            ? "rgba(232,121,249,0.8)"
            : "rgba(255,255,255,0.35)"}/>
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={[styles.inputRow, { marginTop: 10 }]}>
              <Feather name="shield" size={18} color="rgba(255,255,255,0.45)"/>
              <TextInput style={styles.input} placeholder="ยืนยันรหัสผ่าน" placeholderTextColor={COLORS.textFaint} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm}/>
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color={showConfirm
            ? "rgba(232,121,249,0.8)"
            : "rgba(255,255,255,0.35)"}/>
              </TouchableOpacity>
            </View>
            {password && confirmPassword && password !== confirmPassword ? (<Text style={styles.errorText}>⚠️ รหัสผ่านไม่ตรงกัน</Text>) : null}

            {/* Birthday */}
            <View style={styles.bdayHeader}>
              <Feather name="calendar" size={16} color="rgba(255,255,255,0.45)"/>
              <Text style={styles.label}>วันเดือนปีเกิด</Text>
            </View>

            <View style={styles.bdayRow}>
              <TouchableOpacity style={styles.bdayBtn} onPress={() => setShowDayPicker(true)}>
                <Text style={[styles.bdayText, !day && styles.bdayPlaceholder]}>
                  {day || "วัน"}
                </Text>
                <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.4)"/>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bdayBtn, { flex: 1.7 }]} onPress={() => setShowMonthPicker(true)}>
                <Text style={[styles.bdayText, !month && styles.bdayPlaceholder]}>
                  {month || "เดือน"}
                </Text>
                <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.4)"/>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bdayBtn} onPress={() => setShowYearPicker(true)}>
                <Text style={[styles.bdayText, !year && styles.bdayPlaceholder]}>
                  {year || "ปี"}
                </Text>
                <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.4)"/>
              </TouchableOpacity>
            </View>

            {/* ปุ่มสมัครสมาชิก */}
            <View style={styles.btnWrap}>
              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
                {loading ? (<ActivityIndicator color="#fff"/>) : (<Text style={styles.btnText}>สมัครสมาชิก</Text>)}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
              <Text style={styles.linkText}>มีบัญชีแล้ว? เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <DropdownModal visible={showDayPicker} items={DAYS} selected={day} onSelect={setDay} onClose={() => setShowDayPicker(false)} title="เลือกวัน"/>
      <DropdownModal visible={showMonthPicker} items={MONTHS} selected={month} onSelect={setMonth} onClose={() => setShowMonthPicker(false)} title="เลือกเดือน"/>
      <DropdownModal visible={showYearPicker} items={YEARS} selected={year} onSelect={setYear} onClose={() => setShowYearPicker(false)} title="เลือกปี"/>
    </GradientBg>);
}
const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 48,
        justifyContent: "center",
        minHeight: "100%",
    },
    pageTitle: {
        fontFamily: FONTS.bold,
        color: "#fff",
        fontSize: 24,
        textAlign: "center",
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    card: { paddingHorizontal: 22, paddingVertical: 26, borderRadius: 32 },
    avatarWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignSelf: "center",
        position: "relative",
        marginBottom: 6,
    },
    avatarImg: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 2,
        borderColor: COLORS.accent,
    },
    avatarEmpty: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: "rgba(255,255,255,0.09)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.22)",
        justifyContent: "center",
        alignItems: "center",
    },
    camBadge: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.gradientEnd,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.3)",
    },
    avatarHint: {
        fontFamily: FONTS.regular,
        color: COLORS.textFaint,
        fontSize: 12,
        textAlign: "center",
        marginBottom: 18,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.09)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        paddingHorizontal: 16,
        height: 52,
        gap: 10,
    },
    input: { flex: 1, fontFamily: FONTS.regular, color: "#fff", fontSize: 15 },
    errorText: {
        fontFamily: FONTS.regular,
        color: "#fca5a5",
        fontSize: 12,
        marginTop: 6,
    },
    bdayHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        marginBottom: 8,
    },
    label: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 14 },
    bdayRow: { flexDirection: "row", gap: 8 },
    bdayBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.09)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        paddingHorizontal: 12,
        height: 50,
    },
    bdayText: { fontFamily: FONTS.regular, color: "#fff", fontSize: 13 },
    bdayPlaceholder: { color: COLORS.textFaint },
    btnWrap: { alignItems: "center", marginTop: 26 },
    btn: {
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 50,
        paddingVertical: 14,
        paddingHorizontal: 52,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        minWidth: 180,
        alignItems: "center",
    },
    btnText: {
        fontFamily: FONTS.semiBold,
        color: "#fff",
        fontSize: 16,
        letterSpacing: 0.5,
    },
    linkWrap: { marginTop: 16, alignItems: "center" },
    linkText: {
        fontFamily: FONTS.regular,
        color: COLORS.textSoft,
        fontSize: 14,
        textDecorationLine: "underline",
    },
});
