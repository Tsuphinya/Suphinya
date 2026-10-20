import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Image, ScrollView, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBg, GlassCard } from '../../components/GradientBg';
import { COLORS, FONTS } from '../../constants/Colors';
import { useUser } from '../../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Feather from '@expo/vector-icons/Feather';
import { getZodiacFromBirthday } from '../../utils/zodiac';

// -----------------------------------------------------------------------
// Cloudinary settings
// -----------------------------------------------------------------------
const CLOUDINARY_CLOUD_NAME = 'jyimi8ys';
const CLOUDINARY_UPLOAD_PRESET = 'profile';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// -----------------------------------------------------------------------
// Fortune categories
// -----------------------------------------------------------------------
const CATEGORIES = [
  { key: 'ความรัก', emoji: '❤️' },
  { key: 'การงาน', emoji: '💼' },
  { key: 'การเงิน', emoji: '💰' },
];

const MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// Parse the birthday stored in Firebase into day / month / year (Gregorian)
// Supports: Timestamp, Date, {seconds}, 2002-05-15, 15/05/2002, 15 พฤษภาคม 2002, 15 พ.ค. 2002
// Buddhist-era years (> 2400) are converted to Gregorian automatically
const parseBirthday = (birthday) => {
  const empty = { day: '', month: '', year: '' };
  if (!birthday) return empty;

  const fixYear = (y) => {
    const n = Number(y);
    return String(n > 2400 ? n - 543 : n);
  };
  const fromDate = (d) =>
    isNaN(d.getTime())
      ? empty
      : { day: String(d.getDate()), month: String(d.getMonth() + 1), year: String(d.getFullYear()) };

  if (typeof birthday?.toDate === 'function') return fromDate(birthday.toDate());
  if (birthday instanceof Date) return fromDate(birthday);
  if (typeof birthday === 'object' && birthday.seconds) return fromDate(new Date(birthday.seconds * 1000));
  if (typeof birthday !== 'string') return empty;

  const value = birthday.trim();
  let m;

  // 2002-05-15 or 2002/05/15
  m = value.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return { day: String(Number(m[3])), month: String(Number(m[2])), year: fixYear(m[1]) };

  // 15/05/2002 or 15-05-2002
  m = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return { day: String(Number(m[1])), month: String(Number(m[2])), year: fixYear(m[3]) };

  // 15 พฤษภาคม 2002 or 15 พ.ค. 2002
  m = value.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (m) {
    const name = m[2].trim();
    let idx = MONTHS.indexOf(name);
    if (idx === -1) idx = MONTHS_SHORT.indexOf(name);
    if (idx !== -1) return { day: String(Number(m[1])), month: String(idx + 1), year: fixYear(m[3]) };
  }

  return empty;
};

// Options for the day / month / year selectors
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }));
const YEAR_OPTIONS = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => {
  const y = String(new Date().getFullYear() - i);
  return { label: y, value: y };
});

const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u);

// -----------------------------------------------------------------------
// Modal-based select field (more reliable than the native iOS wheel Picker)
// -----------------------------------------------------------------------
const ITEM_H = 48;

function SelectField({ label, value, options, onChange, style }) {
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  return (
    <>
      <TouchableOpacity style={[styles.selectBox, style]} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[styles.selectText, !selected && { color: COLORS.textFaint }]} numberOfLines={1}>
          {selected ? selected.label : label}
        </Text>
        <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
              initialScrollIndex={Math.max(0, selectedIndex)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item.value === value && styles.modalItemActive]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, fortuneHistory } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(isValidUrl(user?.avatar) ? user.avatar : null);
  const [avatarError, setAvatarError] = useState(false);

  // Day / month / year (Gregorian)
  const initialBirthday = parseBirthday(user?.birthday);
  const [day, setDay] = useState(initialBirthday.day);
  const [month, setMonth] = useState(initialBirthday.month);
  const [year, setYear] = useState(initialBirthday.year);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setAvatarError(false), [avatar]);

  // Sync birthday from context when it changes
  useEffect(() => {
    const parsed = parseBirthday(user?.birthday);
    setDay(parsed.day);
    setMonth(parsed.month);
    setYear(parsed.year);
  }, [user?.birthday]);

  // Zodiac + reading stats
  const zodiac = getZodiacFromBirthday(user?.birthday);
  const history = fortuneHistory || [];
  const totalReadings = history.length;
  const countByCategory = history.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  // Upload to Cloudinary using Base64 via JSON
  const uploadToCloudinary = async (base64Uri) => {
    setUploading(true);
    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Uri,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
        }),
      });

      const data = await response.json();

      if (data.secure_url) {
        setAvatar(data.secure_url);
      } else {
        console.error('Cloudinary Response:', data);
        throw new Error(data.error?.message || 'อัปโหลดรูปไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    if (!editing || uploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64Data = `data:image/jpeg;base64,${asset.base64}`;
      await uploadToCloudinary(base64Data);
    }
  };

  // Load the latest profile from Firebase
  const loadLatestProfile = async () => {
    try {
      const uid = user?.uid || user?.id || auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return;
      const data = snap.data();

      console.log('PROFILE DATA ->', { birthday: data.birthday, avatar: data.avatar }); // temporary debug log

      const parsed = parseBirthday(data.birthday);
      const birthdayText = parsed.day
        ? `${parsed.day} ${MONTHS[Number(parsed.month) - 1]} ${parsed.year}`
        : '';
      const validAvatar = isValidUrl(data.avatar) ? data.avatar : null;

      setName(data.fullName || data.username || '');
      setEmail(data.email || user?.email || '');
      setAvatar(validAvatar);
      setDay(parsed.day);
      setMonth(parsed.month);
      setYear(parsed.year);

      // Update context so view mode also shows the avatar / birthday
      setUser({
        ...user,
        uid,
        id: uid,
        name: data.fullName || data.username || user?.name,
        email: data.email || user?.email,
        avatar: validAvatar,
        birthday: birthdayText || user?.birthday,
      });
    } catch (error) {
      console.error('Load latest profile error:', error);
    }
  };

  // Load from Firebase as soon as the screen opens
  useEffect(() => {
    loadLatestProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.id]);

  const openEditProfile = async () => {
    setEditing(true);
    await loadLatestProfile();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อผู้ใช้งาน');
    }

    const dayNumber = Number(day);
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    const currentYear = new Date().getFullYear();

    if (!day || !month || !year) {
      return Alert.alert('แจ้งเตือน', 'กรุณากรอกวัน เดือน และปีเกิดให้ครบ');
    }

    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
      return Alert.alert('แจ้งเตือน', 'กรุณากรอกวันที่ 1 - 31');
    }

    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return Alert.alert('แจ้งเตือน', 'กรุณากรอกเดือน 1 - 12');
    }

    if (!/^\d{4}$/.test(year) || yearNumber < 1900 || yearNumber > currentYear) {
      return Alert.alert('แจ้งเตือน', 'กรุณากรอกปี ค.ศ. ให้ถูกต้อง เช่น 2002');
    }

    // Validate real date, e.g. reject 31/02/2002
    const validDate = new Date(yearNumber, monthNumber - 1, dayNumber);
    if (
      validDate.getFullYear() !== yearNumber ||
      validDate.getMonth() !== monthNumber - 1 ||
      validDate.getDate() !== dayNumber
    ) {
      return Alert.alert('แจ้งเตือน', 'วันเดือนปีเกิดไม่ถูกต้อง');
    }

    setLoading(true);

    try {
      const uid = user?.uid || user?.id || auth.currentUser?.uid;
      if (!uid) {
        throw new Error('ไม่พบ UID ของผู้ใช้');
      }

      const username = name.trim();
      const usernameLower = username.toLowerCase();
      const birthday = `${dayNumber} ${MONTHS[monthNumber - 1]} ${yearNumber}`;

      await updateDoc(doc(db, 'users', uid), {
        username: username,
        usernameLower: usernameLower,
        fullName: username,
        birthday: birthday,
        avatar: avatar || '',
      });

      setUser({
        ...user,
        uid: uid,
        id: uid,
        name: username,
        username: username,
        email,
        avatar,
        birthday: birthday,
      });

      setEditing(false);
      Alert.alert('✅ บันทึกสำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Profile Save Error:', error);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        error?.message === 'ไม่พบ UID ของผู้ใช้'
          ? 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
          : 'ไม่สามารถบันทึกข้อมูลได้'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => { setUser(null); router.replace('/login'); } },
    ]);
  };

  return (
    <GradientBg>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>โปรไฟล์</Text>
          <TouchableOpacity
            style={styles.logoutIconBtn}
            onPress={handleLogout}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="log-out" size={18} color="#f87171" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={editing ? 0.8 : 1}>
          {isValidUrl(avatar) && !avatarError ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} onError={() => setAvatarError(true)} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{(name || user?.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
          )}

          {uploading && (
            <View style={styles.avatarUploadingOverlay}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          )}

          {editing && !uploading && (
            <View style={styles.camBadge}>
              <Feather name="camera" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {!editing && <Text style={styles.profileName}>{user?.name}</Text>}
        {!editing && <Text style={styles.profileEmail}>{user?.email}</Text>}
        {!editing && zodiac && (
          <View style={styles.zodiacBadge}>
            <Text style={styles.zodiacSymbol}>{zodiac.symbol}</Text>
            <Text style={styles.zodiacText}>{zodiac.name}</Text>
          </View>
        )}

        {editing ? (
          <GlassCard style={styles.formCard}>
            <Text style={styles.fieldLabel}>ชื่อผู้ใช้งาน</Text>
            <View style={styles.inputRow}>
              <Feather name="user" size={16} color="rgba(255,255,255,0.45)" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.textFaint}
                placeholder="ชื่อ-นามสกุล"
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>อีเมล</Text>
            <View style={styles.inputRow}>
              <Feather name="mail" size={16} color="rgba(255,255,255,0.45)" />
              <TextInput
                style={styles.input}
                value={email}
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textFaint}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>วัน เดือน ปีเกิด</Text>
            <View style={styles.birthdayPickerRow}>
              <SelectField style={{ flex: 0.8 }} label="วัน" value={day} options={DAY_OPTIONS} onChange={setDay} />
              <SelectField style={{ flex: 1.35 }} label="เดือน" value={month} options={MONTH_OPTIONS} onChange={setMonth} />
              <SelectField style={{ flex: 1.2 }} label="ปี ค.ศ." value={year} options={YEAR_OPTIONS} onChange={setYear} />
            </View>
            <Text style={styles.birthdayHint}>เลือกวัน เดือน และปีเกิด (ค.ศ.)</Text>

            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (loading || uploading) && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading || uploading}
              >
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>บันทึก</Text>}
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/history')}>
              <GlassCard style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>สถิติการดูดวงของคุณ</Text>
                  <View style={styles.statsSeeAll}>
                    <Text style={styles.statsSeeAllText}>ดูทั้งหมด</Text>
                    <Feather name="chevron-right" size={14} color={COLORS.accent} />
                  </View>
                </View>

                <Text style={styles.statsTotal}>
                  {totalReadings} <Text style={styles.statsTotalUnit}>ครั้ง</Text>
                </Text>

                <View style={styles.statsBreakdownRow}>
                  {CATEGORIES.map((cat) => (
                    <View key={cat.key} style={styles.statsChip}>
                      <Text style={styles.statsChipEmoji}>{cat.emoji}</Text>
                      <Text style={styles.statsChipCount}>{countByCategory[cat.key] || 0}</Text>
                      <Text style={styles.statsChipLabel}>{cat.key}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </TouchableOpacity>

            <GlassCard style={styles.infoCard}>
              {[
                { icon: 'user', label: 'ชื่อ', value: user?.name },
                { icon: 'mail', label: 'อีเมล', value: user?.email },
                { icon: 'calendar', label: 'วันเกิด', value: user?.birthday },
              ].filter((r) => r.value).map((row, i) => (
                <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                  <Feather name={row.icon} size={16} color={COLORS.accent} style={{ marginRight: 10 }} />
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
            </GlassCard>

            <TouchableOpacity style={styles.editBtn} onPress={openEditProfile}>
              <Feather name="edit-2" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.editBtnText}>แก้ไขข้อมูล</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </GradientBg>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 120, alignItems: 'center' },
  title: { fontFamily: FONTS.bold, color: '#fff', fontSize: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 24 },
  headerSpacer: { width: 34 },
  logoutIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f87171', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  avatarWrap: { width: 96, height: 96, borderRadius: 48, position: 'relative', marginBottom: 12 },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(168,85,247,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontFamily: FONTS.bold, color: '#fff', fontSize: 34 },
  avatarUploadingOverlay: { position: 'absolute', top: 0, left: 0, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  camBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gradientEnd, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileName: { fontFamily: FONTS.bold, color: '#fff', fontSize: 20, marginBottom: 4 },
  profileEmail: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 14, marginBottom: 12 },
  zodiacBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(168,85,247,0.15)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.35)',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 24,
  },
  zodiacSymbol: { fontSize: 15, color: COLORS.gold },
  zodiacText: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 13 },
  formCard: { width: '100%', padding: 20 },
  fieldLabel: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 13, marginBottom: 7 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontFamily: FONTS.regular, color: '#fff', fontSize: 14 },

  birthdayPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  birthdayHint: { fontFamily: FONTS.regular, color: COLORS.textFaint, fontSize: 11, marginTop: 6, marginLeft: 2 },

  // Modal select field
  selectBox: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  selectText: { fontFamily: FONTS.regular, color: '#fff', fontSize: 14, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 32 },
  modalSheet: { maxHeight: '60%', backgroundColor: '#2a0f4d', borderRadius: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  modalTitle: { fontFamily: FONTS.semiBold, color: COLORS.textSoft, fontSize: 13, textAlign: 'center', marginBottom: 6 },
  modalItem: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  modalItemActive: { backgroundColor: 'rgba(168,85,247,0.35)' },
  modalItemText: { fontFamily: FONTS.regular, color: '#fff', fontSize: 16 },

  editBtns: { flexDirection: 'row', gap: 12, marginTop: 22, justifyContent: 'center' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', minWidth: 100 },
  cancelText: { fontFamily: FONTS.semiBold, color: COLORS.textSoft, fontSize: 14 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 50, backgroundColor: 'rgba(168,85,247,0.65)', alignItems: 'center', minWidth: 100 },
  saveText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14 },
  actions: { width: '100%', gap: 14 },
  statsCard: { padding: 18 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statsTitle: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 15 },
  statsSeeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statsSeeAllText: { fontFamily: FONTS.regular, color: COLORS.accent, fontSize: 12 },
  statsTotal: { fontFamily: FONTS.bold, color: COLORS.gold, fontSize: 30, marginBottom: 16 },
  statsTotalUnit: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 15 },
  statsBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statsChip: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 10,
  },
  statsChipEmoji: { fontSize: 18, marginBottom: 4 },
  statsChipCount: { fontFamily: FONTS.bold, color: '#fff', fontSize: 16 },
  statsChipLabel: { fontFamily: FONTS.regular, color: COLORS.textFaint, fontSize: 11, marginTop: 2 },
  infoCard: { padding: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 14, marginTop: 14 },
  infoLabel: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 13, width: 60 },
  infoValue: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 14, flex: 1 },
  editBtn: { flexDirection: 'row', width: '55%', alignSelf: 'center', marginTop: 30, paddingVertical: 15, borderRadius: 50, backgroundColor: 'rgba(168,85,247,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 15 },
});
