import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Image, TouchableOpacity, Dimensions
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBg, GlassCard } from '../components/GradientBg'; 
import { COLORS, FONTS } from '../constants/Colors';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SLIDER_WIDTH = SCREEN_WIDTH - 80; 

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  console.log("ข้อมูลที่ส่งมาจากหน้าประวัติรวม:", params); // 🌟 ใส่จุดนี้เพื่อเปิดดู Log เช็กชื่อตัวแปร

  // รับค่าพารามิเตอร์หลักที่ถูกส่งมาจากหน้าประวัติรวม
  const { historyId, category, date } = params;

  const [historyRecord, setHistoryRecord] = useState(null);
  const [detailedCards, setDetailedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const topicField = {
    ความรัก: { normal: 'meaningLove', reversed: 'meaningLoveReversed' },
    การงาน:  { normal: 'meaningWork', reversed: 'meaningWorkReversed' },
    การเงิน: { normal: 'meaningMoney', reversed: 'meaningMoneyReversed' },
  };

// 1. ดึงข้อมูลบันทึกประวัติ (History Document) รอบนี้จาก Firebase
  useEffect(() => {
    // 🌟 แก้ไขจุดนี้: รองรับคีย์ id เผื่อว่าหน้าประวัติรวมส่งคีย์ธรรมดามา
    const actualId = historyId || params.id; 
    
    if (!actualId) {
      console.log("พารามิเตอร์ ID เป็น undefined - กรุณาตรวจสอบการ push จากหน้าประวัติรวม");
      // ถ้าไม่มี ID ส่งมาเลย ให้ปิดตัวโหลดเพื่อไม่ให้หน้าจอหมุนค้าง
      setLoading(false); 
      return;
    }

    const fetchHistoryDetail = async () => {
      try {
        const docRef = doc(db, 'fortuneHistory', actualId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const historyData = docSnap.data();
          setHistoryRecord(historyData);

          // 2. มีข้อมูล Array ของไพ่ในประวัติแล้ว -> ทำการดึงข้อมูลรูปภาพและเนื้อหาหลักจากคอลเลกชัน card
          if (historyData.cards && historyData.cards.length > 0) {
            const cardPromises = historyData.cards.map(async (savedCard) => {
              const cardDocRef = doc(db, 'card', savedCard.cardId);
              const cardDocSnap = await getDoc(cardDocRef);
              
              if (cardDocSnap.exists()) {
                return {
                  ...savedCard,
                  ...cardDocSnap.data() // รวมข้อมูล imageUrl และคำทำนายหลักเข้ามา
                };
              }
              return savedCard;
            });

            const resolvedCards = await Promise.all(cardPromises);
            setDetailedCards(resolvedCards);
          } else {
            console.log("ไม่พบฟิลด์ cards (Array) ในเอกสารนี้");
          }
        } else {
          console.log("ไม่พบเอกสารประวัตินี้บน Firebase");
        }
      } catch (error) {
        console.error('Error fetching comprehensive history detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryDetail();
  }, [historyId, params.id]); // ใส่ params.id เพิ่มใน dependency array

  // ลอจิกการคำนวณและประมวลผลคำทำนายรายใบจำเพาะ
  const getSpecificCardMeaning = (cardItem) => {
    if (!cardItem || !category) return 'ไม่มีข้อมูลคำทำนาย';
    const field = topicField[category];
    return cardItem.isUpright
      ? cardItem[field.normal] || 'ไม่มีข้อมูลความหมาย'
      : cardItem[field.reversed] || cardItem.meaningReversed || 'ไม่มีข้อมูลความหมายกลับหัว';
  };

  // 🌟 คำทำนายโดยรวมจาก Gemini AI นับเป็นอีก 1 สไลด์ ต่อท้ายไพ่ใบสุดท้าย
  const hasAiSummary = !!historyRecord?.overallSummary;
  const totalSlides = detailedCards.length + (hasAiSummary ? 1 : 0);
  const isOnAiSlide = hasAiSummary && activeCardIndex === detailedCards.length;

  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / CARD_SLIDER_WIDTH);
    if (index >= 0 && index < totalSlides) {
      setActiveCardIndex(index);
    }
  };

  const currentActiveCard = detailedCards[activeCardIndex] || null;

  return (
    <GradientBg>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ปุ่มย้อนกลับ */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color={COLORS.accent} />
          <Text style={styles.backBtnText}>ย้อนกลับ</Text>
        </TouchableOpacity>

        <Text style={styles.title}>📜 รายละเอียดคำทำนาย</Text>
        <Text style={styles.sub}>ดูดวงเมื่อวันที่ {date}</Text>

        <View style={styles.cardArea}>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} size="large" />
          ) : detailedCards.length > 0 ? (
            <GlassCard style={styles.tarotCardContainer}>
              
              {/* แถบชุดสไลด์แนวนอน: ไพ่แต่ละใบ ต่อด้วยสไลด์คำทำนายโดยรวมจาก Gemini AI เป็นใบสุดท้าย */}
              <ScrollView 
                horizontal 
                pagingEnabled 
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swipeScrollContent}
                style={styles.swipeWindow}
              >
                {detailedCards.map((card, idx) => (
                  <View key={idx} style={styles.swipeCardItem}>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>ไพ่ใบที่ {card.cardPosition || idx + 1}</Text>
                      </View>
                      <View style={[styles.badge, styles.badgeCategory]}>
                        <Text style={styles.badgeText}>{category}</Text>
                      </View>
                      {!card.isUpright && (
                        <View style={[styles.badge, styles.badgeReversed]}>
                          <Text style={styles.badgeText}>กลับหัว</Text>
                        </View>
                      )}
                    </View>

                    {card.imageUrl ? (
                      <Image
                        source={{ uri: card.imageUrl }}
                        style={[
                          styles.cardImage,
                          !card.isUpright && { transform: [{ rotate: '180deg' }] }
                        ]}
                        resizeMode="contain"
                      />
                    ) : null}

                    <Text style={styles.cardName}>{card.cardName}</Text>
                    {!card.isUpright && <Text style={styles.reversedLabel}>🔄 ในสถานะกลับหัว</Text>}
                  </View>
                ))}

                {/* 🌟 สไลด์สุดท้าย: บทสรุปคำทำนายโดยรวมจาก Gemini AI — ปัดต่อจากไพ่ใบสุดท้ายมาเจอตรงนี้เลย
                    ใช้ ScrollView แนวตั้งซ้อนข้างในเพราะข้อความยาวกว่าพื้นที่การ์ดปกติ */}
                {hasAiSummary && (
                  <View style={styles.swipeCardItem}>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.aiSlideScroll}
                      contentContainerStyle={styles.aiSlideScrollContent}
                    >
                      <View style={styles.aiSummaryHeader}>
                        <Text style={styles.aiSummaryIcon}>🔮</Text>
                        <Text style={styles.aiSummaryTitle}>บทสรุปคำทำนายโดยรวม (Gemini AI)</Text>
                      </View>
                      <Text style={styles.aiSummaryText}>{historyRecord.overallSummary}</Text>
                    </ScrollView>
                  </View>
                )}
              </ScrollView>

              {/* Carousel Indicator Dots — รวมจุดของสไลด์ Gemini AI ไว้ด้วย */}
              <View style={styles.indicatorContainer}>
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.indicatorDot, 
                      activeCardIndex === idx && styles.indicatorDotActive
                    ]} 
                  />
                ))}
              </View>

              {/* ส่วนเนื้อหาคำทำนายรายใบ — ซ่อนตอนอยู่บนสไลด์ Gemini AI เพราะไม่มีไพ่ใบไหนให้อ้างอิง */}
              {!isOnAiSlide && currentActiveCard && (
                <View style={styles.predictionAreaOutside}>
                  <View style={styles.divider} />
                  <Text style={styles.topicLabel}>คำทำนายเรื่อง{category} (ใบที่ {activeCardIndex + 1})</Text>
                  <Text style={styles.cardResult}>{getSpecificCardMeaning(currentActiveCard)}</Text>

                  {/* แสดงความหมายกลับหัวรวมหากไพ่ใบนั้นเข้าสถานะกลับตัว */}
                  {!currentActiveCard?.isUpright && currentActiveCard?.meaningReversed && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.topicLabel}>ความหมายกลับหัวโดยรวม</Text>
                      <Text style={styles.cardResult}>{currentActiveCard.meaningReversed}</Text>
                    </>
                  )}
                </View>
              )}

            </GlassCard>
          ) : (
            <Text style={{ color: '#fff', fontFamily: FONTS.regular }}>ไม่พบข้อมูลประวัติไพ่</Text>
          )}
        </View>
      </ScrollView>
    </GradientBg>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 50, paddingHorizontal: 24, paddingBottom: 60 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 1, marginBottom: 10, marginLeft: -9 },
  backBtnText: { fontFamily: FONTS.regular, color: COLORS.accent, fontSize: 15 },
  title: { fontFamily: FONTS.bold, color: '#fff', fontSize: 24, textAlign: 'center' },
  sub: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  cardArea: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  
  // ดีไซน์กล่องผลลัพธ์และสเปรดสไลด์ให้ลงมาสมดุลพอดีหน้าจอ ป้องกันป้ายคำโดนบังขอบบน
  tarotCardContainer: { width: '100%', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  swipeWindow: { width: CARD_SLIDER_WIDTH, height: 290 },
  swipeScrollContent: { alignItems: 'center' },
  swipeCardItem: { width: CARD_SLIDER_WIDTH, alignItems: 'center', justifyContent: 'center', paddingTop: 12 },
  
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  
  badgeCategory: { backgroundColor: 'rgba(168,85,247,0.3)', borderColor: COLORS.accent },
  badgeReversed: { backgroundColor: 'rgba(248,113,113,0.25)', borderColor: '#f87171' },
  badgeText: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 11 },

  cardImage: { width: 140, height: 180, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardName: { fontFamily: FONTS.bold, color: '#fff', fontSize: 18, textAlign: 'center' },
  reversedLabel: { fontFamily: FONTS.regular, color: '#f87171', fontSize: 14, marginTop: 2 },
  
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 14 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  indicatorDotActive: { width: 16, backgroundColor: COLORS.accent },

  predictionAreaOutside: { width: '100%', alignItems: 'stretch' },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 },
  topicLabel: { fontFamily: FONTS.semiBold, color: COLORS.accent, fontSize: 13, letterSpacing: 1.5, textAlign: 'center', marginBottom: 10 },
  cardResult: { fontFamily: FONTS.regular, color: '#f1f5f9', fontSize: 17, lineHeight: 28, textAlign: 'left', paddingHorizontal: 6 },

  // 🌟 สไตล์สไลด์บทสรุป Gemini AI (อยู่ในแถบปัดไพ่แนวนอนเดียวกัน)
  aiSlideScroll: { width: '100%', height: '100%' },
  aiSlideScrollContent: { paddingHorizontal: 6, paddingBottom: 12, alignItems: 'stretch' },
  aiSummaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 6 },
  aiSummaryIcon: { fontSize: 16 },
  aiSummaryTitle: { fontFamily: FONTS.bold, color: '#c084fc', fontSize: 14, textAlign: 'center' },
  aiSummaryText: { fontFamily: FONTS.regular, color: '#f1f5f9', fontSize: 17, lineHeight: 28, textAlign: 'left', paddingHorizontal: 6 },
});
