import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBg } from '../../components/GradientBg';
import { COLORS, FONTS } from '../../constants/Colors';
import { useUser } from '../../context/UserContext';
import { getZodiacFromBirthday } from '../../utils/zodiac';
import { fetchDailyZodiacFortune } from '../../services/geminiService';

// -----------------------------------------------------------------------
// 🌟 พื้นหลังนิ่ง ไม่เคลื่อนไหว
// -----------------------------------------------------------------------
function StarField() {
  const stars = [
    { top: '8%', left: '12%', size: 3, opacity: 0.6 },
    { top: '15%', left: '82%', size: 2, opacity: 0.5 },
    { top: '28%', left: '25%', size: 2, opacity: 0.7 },
    { top: '35%', left: '70%', size: 3, opacity: 0.6 },
    { top: '50%', left: '10%', size: 2, opacity: 0.5 },
    { top: '62%', left: '88%', size: 3, opacity: 0.7 },
    { top: '75%', left: '30%', size: 2, opacity: 0.5 },
    { top: '85%', left: '65%', size: 2, opacity: 0.6 },
  ];

  return (
    <View style={sf.wrap} pointerEvents="none">
      <View style={[sf.orb, sf.orbTop]} />
      <View style={[sf.orb, sf.orbBottom]} />

      {stars.map((s, i) => (
        <View
          key={i}
          style={[
            sf.star,
            {
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const sf = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  star: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  orb: {
    position: 'absolute',
    borderRadius: 999,
  },

  orbTop: {
    width: 180,
    height: 180,
    top: -40,
    right: -50,
    backgroundColor: 'rgba(168,85,247,0.15)',
  },

  orbBottom: {
    width: 200,
    height: 200,
    bottom: 60,
    left: -60,
    backgroundColor: 'rgba(252,211,77,0.08)',
  },
});

// -----------------------------------------------------------------------
// 🌟 รูปโปรไฟล์
// -----------------------------------------------------------------------
function AvatarGlow({ size = 44, children }) {
  return (
    <View style={[ag.wrap, { width: size, height: size }]}>
      <View
        style={[
          ag.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      {children}
    </View>
  );
}

const ag = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(168,85,247,0.35)',
  },
});

// -----------------------------------------------------------------------
// 🌟 แถบไอคอนดวงดาว
// -----------------------------------------------------------------------
function IconTwinkleRow() {
  const iconDefs = [
    {
      name: 'star-four-points-outline',
      size: 15,
    },
    {
      name: 'moon-waning-crescent',
      size: 16,
    },
    {
      name: 'crystal-ball',
      size: 16,
    },
    {
      name: 'star-four-points-outline',
      size: 14,
    },
  ];

  return (
    <View style={dc.iconRow}>
      {iconDefs.map((icon, i) => (
        <MaterialCommunityIcons
          key={i}
          name={icon.name}
          size={icon.size}
          color="#FDE047"
        />
      ))}
    </View>
  );
}

// -----------------------------------------------------------------------
// 🌟 การ์ดดวงประจำวัน
// -----------------------------------------------------------------------
function DailyCardReveal({ zodiac, fortuneText, loading }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);

  const handlePress = () => {
    if (revealed) return;

    Animated.timing(flipAnim, {
      toValue: 180,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setTimeout(() => setRevealed(true), 200);
  };

  // ---------------------------------------------------------------------
  // ตัดคำภาษาไทยด้วย Intl.Segmenter
  // ช่วยกำหนดจุดที่สามารถขึ้นบรรทัดใหม่ได้โดยไม่ใส่ช่องว่างที่มองเห็น
  // ---------------------------------------------------------------------
const formatThaiText = (text) => {
  if (!text) return '';

  const clean = text
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    if (
      typeof Intl !== 'undefined' &&
      Intl.Segmenter
    ) {
      const segmenter = new Intl.Segmenter('th', {
        granularity: 'word',
      });

      const words = Array.from(
        segmenter.segment(clean)
      );

      return words
        .map(({ segment, isWordLike }) => {
          if (isWordLike) {
            // ป้องกันการตัดกลาง "คำ"
            return `\u2060${segment}\u2060`;
          }

          return segment;
        })
        .join('\u200B');
    }

    return clean;
  } catch (error) {
    return clean;
  }
};

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handlePress}
      disabled={revealed}
    >
      <View style={dc.wrap}>
        {!revealed ? (
          <Animated.View
            style={{
              transform: [
                { perspective: 1000 },
                { rotateY: frontInterpolate },
              ],
            }}
          >
            <LinearGradient
              colors={[
                'rgba(168,85,247,0.35)',
                'rgba(76,29,149,0.50)',
              ]}
              style={dc.gradient}
            >
              <MaterialCommunityIcons
                name="crystal-ball"
                size={38}
                color="#FDE047"
                style={{ marginBottom: 10 }}
              />

              <Text style={dc.backHint}>
                {zodiac
                  ? `แตะเพื่อดูดวงวันนี้ของ${zodiac.name}`
                  : 'แตะเพื่อดูดวงประจำวันนี้'}
              </Text>
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              transform: [
                { perspective: 1000 },
                { rotateY: backInterpolate },
              ],
            }}
          >
            <LinearGradient
              colors={['#240b3b', '#180528']}
              style={dc.gradient}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FDE047"
                  size="small"
                />
              ) : (
                <>
                  <IconTwinkleRow />

                  <Text style={dc.frontTitle}>
                    ดวงประจำวัน
                    {zodiac ? ` · ${zodiac.name}` : ''}
                  </Text>

                  <Text style={dc.frontText}>
                    {formatThaiText(fortuneText)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const dc = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  gradient: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(253, 224, 71, 0.4)',
    paddingVertical: 22,

    // เพิ่มพื้นที่ด้านซ้ายและขวาให้ข้อความ
    paddingHorizontal: 16,

    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  frontTitle: {
    fontFamily: FONTS.bold,
    color: '#FDE047',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },

frontText: {
  fontFamily: FONTS.regular,
  color: '#FFFFFF',
  fontSize: 16,
  lineHeight: 28,

  // จัดข้อความชิดซ้ายและขวา
  textAlign: 'justify',

  // ให้ข้อความใช้พื้นที่เต็มการ์ด
  width: '100%',

  paddingHorizontal: 6,
},

  backHint: {
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});

// -----------------------------------------------------------------------
// 🌟 ปุ่มเลือกหัวข้อ
// -----------------------------------------------------------------------
function TopicButton({
  emoji,
  label,
  bgColor,
  borderColor,
  onPress,
}) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.18)',
          bgColor,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[tb.btn, { borderColor }]}
      >
        <Text style={tb.emoji}>{emoji}</Text>
        <Text style={tb.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const tb = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 28,
    gap: 10,
  },

  emoji: {
    fontSize: 20,
  },

  label: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },
});

// -----------------------------------------------------------------------
// 🌟 Home Screen
// -----------------------------------------------------------------------
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();

  const name = user?.name || 'ผู้ใช้งาน';

  const zodiac = getZodiacFromBirthday(user?.birthday);

  const [dailyFortune, setDailyFortune] = useState('');
  const [loadingFortune, setLoadingFortune] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDailyFortune = async () => {
      setLoadingFortune(true);

      if (!zodiac) {
        if (!cancelled) {
          setDailyFortune(
            'ยังไม่ทราบราศีของคุณ กรุณาเพิ่มวันเกิดในหน้าโปรไฟล์ เพื่อดูดวงประจำวันเฉพาะคุณ'
          );

          setLoadingFortune(false);
        }

        return;
      }

      const todayKey = new Date()
        .toISOString()
        .slice(0, 10);

      const cacheKey =
        `dailyFortune:${zodiac.name}:${todayKey}`;

      try {
        const cached =
          await AsyncStorage.getItem(cacheKey);

        if (cached) {
          if (!cancelled) {
            setDailyFortune(cached);
          }
        } else {
          const result =
            await fetchDailyZodiacFortune(
              zodiac.name
            );

          if (!cancelled) {
            setDailyFortune(result);
          }

          await AsyncStorage.setItem(
            cacheKey,
            result
          );
        }
      } catch (error) {
        if (!cancelled) {
          setDailyFortune(
            'ไม่สามารถโหลดดวงประจำวันได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFortune(false);
        }
      }
    };

    loadDailyFortune();

    return () => {
      cancelled = true;
    };
  }, [zodiac?.name]);

  return (
    <GradientBg>
      <StarField />

      <ScrollView
        contentContainerStyle={
          styles.scrollContainer
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ------------------------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------------------------- */}

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              สวัสดี,{' '}
              <Text style={styles.nameHighlight}>
                {name}
              </Text>
            </Text>

            <Text style={styles.sub}>
              ขอให้วันนี้เป็นวันที่ดี
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push('/(tabs)/profile')
            }
            style={styles.avatarRow}
          >
            <Text style={styles.avatarName}>
              {name}
            </Text>

            <AvatarGlow size={44}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImg}
                />
              ) : (
                <LinearGradient
                  colors={[
                    '#a855f7',
                    '#7e22ce',
                  ]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitial}>
                    {name
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </AvatarGlow>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* Content */}
        {/* ------------------------------------------------------------- */}

        <View style={styles.contentBlock}>
          <DailyCardReveal
            zodiac={zodiac}
            fortuneText={dailyFortune}
            loading={loadingFortune}
          />

          {/* ----------------------------------------------------------- */}
          {/* Topic Panel */}
          {/* ----------------------------------------------------------- */}

          <LinearGradient
            colors={[
              'rgba(255,255,255,0.15)',
              'rgba(88, 28, 135, 0.40)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.panel}
          >
            <View style={styles.panelHighlight} />

            <Text style={styles.panelTitle}>
              เลือกเรื่องที่คุณต้องการดูดวง
            </Text>

            <View style={styles.topicList}>
              {/* ความรัก */}
              <TopicButton
                emoji="💗"
                label="ความรัก"
                bgColor="rgba(232,121,249,0.30)"
                borderColor="rgba(232,121,249,0.55)"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/fortune',
                    params: {
                      topic: 'ความรัก',
                    },
                  })
                }
              />

              {/* การงาน */}
              <TopicButton
                emoji="⚡"
                label="การงาน"
                bgColor="rgba(96,165,250,0.30)"
                borderColor="rgba(96,165,250,0.55)"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/fortune',
                    params: {
                      topic: 'การงาน',
                    },
                  })
                }
              />

              {/* การเงิน */}
              <TopicButton
                emoji="🪙"
                label="การเงิน"
                bgColor="rgba(52,211,153,0.30)"
                borderColor="rgba(52,211,153,0.55)"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/fortune',
                    params: {
                      topic: 'การเงิน',
                    },
                  })
                }
              />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </GradientBg>
  );
}

// -----------------------------------------------------------------------
// 🌟 Styles
// -----------------------------------------------------------------------
const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  greeting: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 25,
    marginTop: 35,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },

  nameHighlight: {
    fontFamily: FONTS.bold,
    color: '#FDE047',
  },

  sub: {
    fontFamily: FONTS.regular,
    color: '#E2E8F0',
    fontSize: 16,
    marginTop: 4,
  },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 35,
  },

  avatarName: {
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
    fontSize: 18,
  },

  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarInitial: {
    fontFamily: FONTS.bold,
    color: '#fff',
    fontSize: 20,
  },

  contentBlock: {
    gap: 20,
    marginTop: 24,
  },

  panel: {
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: 20,
    overflow: 'hidden',
  },

  panelHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  panelTitle: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },

  topicList: {
    gap: 10,
  },
});