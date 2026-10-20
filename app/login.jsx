import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, ActivityIndicator, } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBg, GlassCard } from '../components/GradientBg';
import { COLORS, FONTS } from '../constants/Colors';
import { useUser } from '../context/UserContext';
import Svg, { Path, Circle } from 'react-native-svg';
import { auth, db } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
function EyeMysticIcon({ size = 18, color = 'rgba(255,255,255,0.5)' }) {
    return (<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Circle cx="12" cy="12" r="1.5" fill={color}/>
    </Svg>);
}
function LockIcon({ color = 'rgba(255,255,255,0.5)' }) {
    return (<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.5" fill="none"/>
      <Circle cx="12" cy="16" r="1.5" fill={color}/>
    </Svg>);
}
// spinningring
function SpinningRing() {
    const spin1 = useRef(new Animated.Value(0)).current;
    const spin2 = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(1)).current;
    React.useEffect(() => {
        Animated.loop(Animated.timing(spin1, { toValue: 1, duration: 9000, useNativeDriver: true })).start(); // รอบการหมุนตามเข็ม-หากค่า duration เพิ่มขึ้นจะหมุนช้าลง
        Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 6000, useNativeDriver: true })).start(); // รอบการหมุนทวนเข็ม
        Animated.loop(Animated.sequence([
            Animated.timing(pulse, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])).start();
    }, []);
    const rotate1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const rotate2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
    const outerDots = [0, 40, 80, 120, 160, 200, 240, 280, 320]; // 9 จุด วงนอก
    const innerDots = [0, 60, 120, 180, 240, 300]; // วงใน
    return (<View style={ring.wrap}>
      <Animated.View style={[ring.outerRing, { transform: [{ rotate: rotate1 }] }]}>
        {outerDots.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const r = 52;
            const isMain = i % 3 === 0;
            return <View key={i} style={[ring.dot, { left: 52 + r * Math.cos(rad) - (isMain ? 5 : 3), top: 52 + r * Math.sin(rad) - (isMain ? 5 : 3), width: isMain ? 10 : 5, height: isMain ? 10 : 5, backgroundColor: isMain ? '#fcd34d' : 'rgba(252,211,77,0.5)', borderRadius: 10 }]}/>;
        })}
      </Animated.View>
      <Animated.View style={[ring.middleRing, { transform: [{ rotate: rotate2 }] }]}>
        {innerDots.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const r = 36;
            return <View key={i} style={[ring.dot, { left: 36 + r * Math.cos(rad) - 3, top: 36 + r * Math.sin(rad) - 3, width: 7, height: 7, backgroundColor: 'rgba(232,121,249,0.8)', borderRadius: 10 }]}/>;
        })}
      </Animated.View>
      <Animated.View style={[ring.core, { transform: [{ scale: pulse }] }]}>
        <Text style={ring.coreEmoji}>🔮</Text>
      </Animated.View>
    </View>);
}
const ring = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', width: 116, height: 116, alignSelf: 'center', marginBottom: 32 },
    outerRing: { position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: 'rgba(252,211,77,0.3)' },
    middleRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(232,121,249,0.4)' },
    core: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    coreEmoji: { fontSize: 32 },
    dot: { position: 'absolute' },
});
export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };
    const handleForgotPassword = async () => {
        const emailValue = email.toLowerCase().trim();
        if (!validateEmail(emailValue)) {
            return Alert.alert('ลืมรหัสผ่าน', 'กรุณากรอกอีเมลที่ถูกต้องก่อน');
        }
        try {
            await sendPasswordResetEmail(auth, emailValue);
            Alert.alert('ส่งอีเมลแล้ว', 'ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว');
        }
        catch (error) {
            console.error('Password Reset Error:', error);
            let message = 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่';
            if (error.code === 'auth/user-not-found') {
                message = 'ไม่พบบัญชีที่ใช้อีเมลนี้';
            }
            else if (error.code === 'auth/invalid-email') {
                message = 'รูปแบบอีเมลไม่ถูกต้อง';
            }
            Alert.alert('เกิดข้อผิดพลาด', message);
        }
    };
    const handleLogin = async () => {
        if (!validateEmail(email)) {
            setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
            shake();
            return;
        }
        setEmailError('');
        if (!password) {
            return Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสผ่าน');
        }
        setLoading(true);
        try {
            const emailValue = email.toLowerCase().trim();
            // 🔐 Login ผ่าน Firebase Authentication จริง
            const userCredential = await signInWithEmailAndPassword(auth, emailValue, password);
            const firebaseUser = userCredential.user;

            // 📧 ตรวจสอบว่าอีเมลได้รับการยืนยันแล้วหรือยัง
            await reload(firebaseUser);

            if (!auth.currentUser?.emailVerified) {
                await signOut(auth);

                return Alert.alert(
                    '📧 ยังไม่ได้ยืนยันอีเมล',
                    `อีเมล ${emailValue} ยังไม่ได้รับการยืนยัน\n\nกรุณาตรวจสอบกล่องจดหมายและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ`,
                    [
                        {
                            text: 'ส่งอีเมลยืนยันอีกครั้ง',
                            onPress: async () => {
                                setLoading(true);

                                try {
                                    const credential = await signInWithEmailAndPassword(
                                        auth,
                                        emailValue,
                                        password
                                    );

                                    await reload(credential.user);

                                    if (credential.user.emailVerified) {
                                        await signOut(auth);
                                        return Alert.alert(
                                            'ยืนยันอีเมลแล้ว',
                                            'อีเมลของคุณได้รับการยืนยันแล้ว กรุณาเข้าสู่ระบบอีกครั้ง'
                                        );
                                    }

                                    await sendEmailVerification(credential.user);
                                    await signOut(auth);

                                    Alert.alert(
                                        '📧 ส่งอีเมลแล้ว',
                                        `ระบบได้ส่งลิงก์ยืนยันไปยัง\n${emailValue}\n\nกรุณาเปิดอีเมลและกดลิงก์ยืนยัน แล้วกลับมาเข้าสู่ระบบอีกครั้ง`
                                    );
                                } catch (verificationError) {
                                    console.error('Resend Verification Error:', verificationError);

                                    let verificationMessage =
                                        'ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่';

                                    if (verificationError.code === 'auth/too-many-requests') {
                                        verificationMessage =
                                            'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
                                    } else if (verificationError.code === 'auth/network-request-failed') {
                                        verificationMessage =
                                            'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้';
                                    }

                                    try {
                                        await signOut(auth);
                                    } catch {}

                                    Alert.alert('เกิดข้อผิดพลาด', verificationMessage);
                                } finally {
                                    setLoading(false);
                                }
                            },
                        },
                        {
                            text: 'ยกเลิก',
                            style: 'cancel',
                        },
                    ]
                );
            }

            // 📦 ดึงข้อมูล Profile จาก Firestore โดยใช้ Firebase UID
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.exists() ? userSnapshot.data() : {};
            // 👤 เก็บข้อมูลผู้ใช้ไว้ใน UserContext
            setUser({
                id: firebaseUser.uid,
                name: userData.fullName || userData.name || firebaseUser.displayName || emailValue.split('@')[0],
                email: firebaseUser.email || emailValue,
                avatar: userData.avatar || null,
                birthday: userData.birthday || '',
            });
            router.replace('/(tabs)');
        }
        catch (error) {
            console.error('Firebase Login Error:', error);
            let message = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่';
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    message = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                    break;
                case 'auth/invalid-email':
                    message = 'รูปแบบอีเมลไม่ถูกต้อง';
                    break;
                case 'auth/too-many-requests':
                    message = 'มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่';
                    break;
                case 'auth/network-request-failed':
                    message = 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้';
                    break;
            }
            Alert.alert('เข้าสู่ระบบไม่สำเร็จ', message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<GradientBg>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SpinningRing />
          <GlassCard style={styles.card}>
            <Text style={styles.title}>เข้าสู่ระบบ</Text>
            <Text style={styles.label}>อีเมล</Text>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <View style={[styles.inputRow, emailError ? styles.inputError : null]}>
                <EyeMysticIcon size={18} color="rgba(255,255,255,0.45)"/>
                <TextInput style={styles.input} placeholder="example@email.com" placeholderTextColor={COLORS.textFaint} value={email} onChangeText={t => { setEmail(t); setEmailError(''); }} keyboardType="email-address" autoCapitalize="none"/>
              </View>
            </Animated.View>
            {emailError ? <Text style={styles.errorText}>⚠️ {emailError}</Text> : null}

            <Text style={[styles.label, { marginTop: 14 }]}>รหัสผ่าน</Text>
            <View style={styles.inputRow}>
              <LockIcon color="rgba(255,255,255,0.45)"/>
              <TextInput style={styles.input} placeholder="กรอกรหัสผ่าน" placeholderTextColor={COLORS.textFaint} value={password} onChangeText={setPassword} secureTextEntry={!showPassword}/>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <EyeMysticIcon size={18} color={showPassword ? 'rgba(232,121,249,0.8)' : 'rgba(255,255,255,0.35)'}/>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgot}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <View style={styles.btnWrap}>
              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
                {loading ? (<ActivityIndicator color="#fff"/>) : (<Text style={styles.btnText}>เข้าสู่ระบบ</Text>)}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrap}>
              <Text style={styles.linkText}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBg>);
}
const styles = StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'center', minHeight: '100%' },
    card: { paddingHorizontal: 24, paddingVertical: 30, borderRadius: 32 },
    title: { fontFamily: FONTS.bold, color: '#fff', fontSize: 22, textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
    label: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 15, marginBottom: 7, marginLeft: 2 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, height: 54, gap: 10 },
    inputError: { borderColor: '#f87171', borderWidth: 1.5 },
    input: { flex: 1, fontFamily: FONTS.regular, color: '#fff', fontSize: 15 },
    errorText: { fontFamily: FONTS.regular, color: '#fca5a5', fontSize: 13, marginTop: 5, marginLeft: 2 },
    forgot: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 14, textAlign: 'right', marginTop: 10, marginBottom: 4 },
    btnWrap: { alignItems: 'center', marginTop: 24 },
    btn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', minWidth: 160, alignItems: 'center' },
    btnText: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 16, letterSpacing: 0.5 },
    linkWrap: { marginTop: 18, alignItems: 'center' },
    linkText: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 14, textDecorationLine: 'underline' },
});
