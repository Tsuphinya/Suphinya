import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Easing, Alert, ActivityIndicator, Image, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import { GradientBg, GlassCard } from '../../components/GradientBg';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../constants/Colors';
import { useUser } from '../../context/UserContext';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// 🌟 นำเข้าฟังก์ชันดึง AI Real-time จาก geminiService
import { fetchOverallFortune } from '../../services/geminiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SLIDER_WIDTH = SCREEN_WIDTH - 80; 

export default function FortuneScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation(); 
  
  const [selectedTopic, setSelectedTopic] = useState(params.topic || '');
  const [cardCount, setCardCount] = useState(null);
  const [isPrepared, setIsPrepared] = useState(false); // สับไพ่
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showPrediction, setShowPrediction] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  
  // 🌟 State สำหรับการดึงบทสรุปจาก Gemini AI
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // 🌟 ตรวจสอบว่ารอบนี้บันทึกประวัติแล้วหรือยัง
  const [hasSavedHistory, setHasSavedHistory] = useState(false);

  // 🌟 State และ Animation สำหรับ "วงล้อไพ่" ตอนสับไพ่
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  // ค่าความคืบหน้าของ animation วงล้อ (0 -> 1 ต่อการสับไพ่ 1 ครั้ง)
  const wheelAnim = useRef(new Animated.Value(0)).current;
  const [wheelValue, setWheelValue] = useState(0);

  useEffect(() => {
    const listenerId = wheelAnim.addListener(({ value }) => setWheelValue(value));
    return () => wheelAnim.removeListener(listenerId);
  }, []);

  const [fortune, setFortune] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const flipAnim = useRef(new Animated.Value(0)).current;
  
  const { user, addFortuneHistory } = useUser();

  const topics = ['ความรัก', 'การงาน', 'การเงิน'];
  const topicEmojis = { ความรัก: '❤️', การงาน: '💼', การเงิน: '💰' };
  const cardCountOptions = [3, 4, 5, 6];

  const topicField = {
    ความรัก: { normal: 'meaningLove', reversed: 'meaningLoveReversed' },
    การงาน:  { normal: 'meaningWork', reversed: 'meaningWorkReversed' },
    การเงิน: { normal: 'meaningMoney', reversed: 'meaningMoneyReversed' },
  };

  useEffect(() => {
    if (params.topic) {
      setSelectedTopic(params.topic);
      reset(); 
    }
  }, [params.topic]);

  // 🌟 เมื่อออกจากหน้า Fortune โดยไม่บันทึก ให้ล้างข้อมูลรอบเดิม
  useEffect(() => {
    if (params.resetFortune) {
      reset();
      navigation.setParams({
        resetFortune: undefined,
        unsavedHistory: 'false',
      });
    }
  }, [params.resetFortune]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'card'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCards(data);
      } catch (error) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลไพ่ได้');
      } finally {
        setLoadingCards(false);
      }
    };
    fetchCards();
  }, []);

  const fisherYatesShuffle = (array) => {
    console.log(`🔀 [Fisher-Yates Algorithm] เริ่มสับไพ่ | จำนวนไพ่ทั้งหมด: ${array.length} ใบ`);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      console.log(`🔀 [Fisher-Yates Algorithm] สลับตำแหน่ง i=${i} ↔ j=${j}  ("${shuffled[i]?.name}" ↔ "${shuffled[j]?.name}")`);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    console.log('✅ [Fisher-Yates Algorithm] สับไพ่เสร็จสิ้น | ลำดับใหม่ 5 ใบแรก:', shuffled.slice(0, 5).map(c => c.name));
    return shuffled;
  };

  const handleShuffleDeck = () => {
    if (!selectedTopic) return Alert.alert('แจ้งเตือน', 'กรุณาเลือกหัวข้อเรื่องที่ต้องการดูดวงก่อน');
    if (!cardCount) return Alert.alert('แจ้งเตือน', 'กรุณาเลือกจำนวนไพ่ก่อนสับไพ่');
    if (cards.length === 0) return Alert.alert('แจ้งเตือน', 'ไม่พบข้อมูลสำรับไพ่ในระบบ');

    const result = fisherYatesShuffle(cards);

    setShuffledDeck(result);
    setSelectedCards([]); 
    setShowPrediction(false);
    setActiveCardIndex(0);
    setAiSummary(''); 
    setShuffleCount(0); 
    setIsPrepared(true);
  };

  const handleReShuffleFromFan = () => {
    if (isShuffling) return;
    if (selectedCards.length > 0) {
      return Alert.alert(
        'สับไพ่ซ้ำ',
        'การสับไพ่ซ้ำจะทำการยกเลิกไพ่ที่คุณเลือกไว้ก่อนหน้านี้ ต้องการสับไพ่ต่อหรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { 
            text: 'สับไพ่ต่อ', 
            onPress: () => performWheelShuffle() 
          }
        ]
      );
    }
    performWheelShuffle();
  };

  // 🌟 Animation "วงล้อไพ่": หมุนวนต่อเนื่องพร้อมหุบ-กางเป็นพัดสลับกัน
  const performWheelShuffle = () => {
    setIsShuffling(true);
    wheelAnim.setValue(0);

    Animated.timing(wheelAnim, {
      toValue: 1,
      duration: 1400,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      // สลับข้อมูลไพ่จริงเบื้องหลังด้วย Fisher-Yates หลัง animation จบ
      setShuffledDeck(prev => fisherYatesShuffle(prev));
      setSelectedCards([]);
      setShuffleCount(prev => prev + 1);
      setIsShuffling(false);
      wheelAnim.setValue(0);
    });
  };

  const handleSelectCardFromFan = (cardItem, index) => {
    const isAlreadySelected = selectedCards.some(c => c.deckIndex === index);
    
    if (isAlreadySelected) {
      setSelectedCards(prev => prev.filter(c => c.deckIndex !== index));
      return;
    }

    if (selectedCards.length >= cardCount) {
      return Alert.alert('โควตาเต็ม', `คุณเลือกไพ่ครบจำนวน ${cardCount} ใบตามที่กำหนดไว้แล้ว`);
    }

    const newCardSelection = {
      ...cardItem,
      deckIndex: index,
      cardIsReversed: Math.random() > 0.5 
    };

    const newSelectedList = [...selectedCards, newCardSelection];
    setSelectedCards(newSelectedList);

    if (newSelectedList.length === cardCount) {
      setFortune(cardItem); 
      setIsReversed(newCardSelection.cardIsReversed);

      
      Animated.sequence([
        Animated.timing(flipAnim, { toValue: 90, duration: 300, useNativeDriver: true }),
        Animated.timing(flipAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setFlipped(true));
    }
  };

  const reset = () => {
    setHasSavedHistory(false);
    setUnsavedHistoryStatus(false);
    setFlipped(false);
    setFortune(null);
    setIsReversed(false);
    setIsPrepared(false);
    setShuffledDeck([]);
    setSelectedCards([]);
    setShowPrediction(false);
    setActiveCardIndex(0);
    setAiSummary('');
    setShuffleCount(0);
    flipAnim.setValue(0);
  };

  // 🌟 ส่งสถานะว่ารอบนี้มีผลดูดวงที่ยังไม่ได้บันทึกให้ Tab Layout ทราบ
  const setUnsavedHistoryStatus = (value) => {
    navigation.setParams({
      unsavedHistory: value ? 'true' : 'false',
    });
  };

  const handleGetOverallPrediction = async () => {
    console.log('🔮 [Gemini AI] กำลังส่งคำขอไปยัง Gemini API...');
    console.log('🔮 [Gemini AI] หัวข้อที่เลือก:', selectedTopic);
    console.log('🔮 [Gemini AI] ไพ่ที่ใช้ทำนาย:', selectedCards.map(c => `${c.name}${c.cardIsReversed ? ' (กลับหัว)' : ''}`));
    setLoadingAi(true);
    const result = await fetchOverallFortune(selectedTopic, selectedCards);
    console.log('✅ [Gemini AI] ได้รับคำตอบจาก Gemini API แล้ว');
    console.log('✅ [Gemini AI] ความยาวคำตอบ:', result?.length, 'ตัวอักษร');
    console.log('✅ [Gemini AI] ตัวอย่างคำตอบ:', result?.slice(0, 120) + '...');
    setAiSummary(result);
    setLoadingAi(false);
  };

const handleExitAndSave = () => {
    if (selectedCards.length === 0) {
      Alert.alert("แจ้งเตือน", "ไม่พบข้อมูลไพ่ที่เลือก");
      return;
    }

    // ⛔ ตรวจสอบว่ามีคำทำนาย Gemini AI หรือยัง
    if (!aiSummary) {
      Alert.alert(
        "กรุณาอ่านคำทำนายก่อน",
        "กรุณากดปุ่ม 'อ่านคำทำนายโดยรวมทั้งหมด (Gemini AI)' ให้เรียบร้อยก่อนทำการบันทึกประวัติ"
      );
      return;
    }

    Alert.alert(
      "บันทึกประวัติการดูดวง",
      "คุณต้องการบันทึกประวัติการดูดวงรอบนี้หรือไม่?",
      [
        { 
          text: "ไม่บันทึก", 
          style: "cancel", 
          onPress: () => { reset(); router.replace('/(tabs)'); } 
        },
        {
          text: "บันทึก",
          onPress: async () => {
            const cardsDataToSave = selectedCards.map((card, idx) => ({
              cardPosition: idx + 1,
              cardId: card.id || '',
              cardName: card.name || '',
              isUpright: !card.cardIsReversed,
              meaning: getSpecificCardMeaning(card) || ''
            }));

            // 🌟 แก้ไขจุดนี้: ส่ง Object ก้อนเดียวที่มี overallSummary และ cardCount ไปด้วย
            const isSuccess = await addFortuneHistory({
              category: selectedTopic,
              cardCount: cardCount, 
              cards: cardsDataToSave,
              overallSummary: aiSummary // 👈 คำทำนายจาก Gemini AI
            });

            if (isSuccess) {
              setHasSavedHistory(true);
              setUnsavedHistoryStatus(false);
              Alert.alert("สำเร็จ", "บันทึกประวัติการดูดวงเรียบร้อยแล้ว", [
                { text: "ตกลง", onPress: () => { reset(); router.push('/(tabs)/history'); } }
              ]);
            } else {
              Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
            }
          }
        }
      ]
    );
  };

  const getSpecificCardMeaning = (cardItem) => {
    if (!cardItem || !selectedTopic) return '';
    const field = topicField[selectedTopic];
    return cardItem.cardIsReversed
      ? cardItem[field.reversed] || cardItem.meaningReversed || 'ไม่มีข้อมูลความหมายกลับหัว'
      : cardItem[field.normal] || 'ไม่มีข้อมูลความหมาย';
  };

  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / CARD_SLIDER_WIDTH);
    if (index >= 0 && index < selectedCards.length) {
      setActiveCardIndex(index);
    }
  };

  const currentActiveCard = selectedCards[activeCardIndex] || null;

  return (
    <GradientBg>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🔮 ดูดวง</Text>
        <Text style={styles.sub}>เลือกเรื่องที่ต้องการ</Text>

        {/* Topic Selector */}
        <View style={styles.topicRow}>
          {topics.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.topicChip, selectedTopic === t && styles.topicChipActive]}
              onPress={() => { setSelectedTopic(t); reset(); }}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>{topicEmojis[t]}</Text>
              <Text style={[styles.chipText, selectedTopic === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ส่วนกำหนดเตือนและเลือกจำนวนไพ่ */}
        <Text style={styles.sectionLabel}>กรุณาเลือกจำนวนไพ่ที่ต้องการ</Text>
        <View style={styles.countRow}>
          {cardCountOptions.map(count => (
            <TouchableOpacity
              key={count}
              style={[styles.countChip, cardCount === count && styles.countChipActive]}
              onPress={() => { setCardCount(count); setFlipped(false); setFortune(null); }}
            >
              <Text style={[styles.countText, cardCount === count && styles.countTextActive]}>
                {count} ใบ
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ปุ่มทำพิธีสับไพ่ */}
        {selectedTopic && cardCount && !isPrepared && (
          <View style={styles.shuffleContainer}>
            <Text style={styles.deckStatusText}>สำรับไพ่ทาโรต์ 78 ใบ พร้อมแล้ว</Text>
            <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffleDeck} activeOpacity={0.85}>
              <LinearGradient colors={['#a855f7', '#6b21a8']} style={styles.shuffleGradient}>
                <Text style={styles.shuffleBtnText}>🃏 เริ่มสับไพ่</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* โซนแสดงกองไพ่แผ่ครึ่งวงกลม */}
        {isPrepared && (
          <View style={styles.cardArea}>
            {loadingCards ? (
              <ActivityIndicator color={COLORS.accent} size="large" />
            ) : !flipped ? (
              <View style={styles.fanWrapper}>
                <Text style={styles.fanStatusText}>
                  {isShuffling
                    ? '🔮 กำลังสับไพ่...'
                    : `✨ ตั้งจิตอธิษฐานแล้วเลือกไพ่ของคุณ (${selectedCards.length} / ${cardCount} ใบ)`}
                </Text>

                {isShuffling ? (
                  /* 🌟 วงล้อไพ่: หมุนวนต่อเนื่องพร้อมหุบ-กางเป็นพัดสลับกัน */
                  <View style={styles.wheelContainer}>
                    {shuffledDeck.map((item, index) => {
                      const totalCards = shuffledDeck.length;

                      // หมุนเป็นวงกลมรอบเดียวจบ (0 -> 360 องศาพอดี ไม่มีการหุบ-กางระหว่างทาง)
                      const rotationDeg = wheelValue * 360;
                      const angleStep = 360 / totalCards;
                      const currentAngle = rotationDeg + angleStep * index;
                      const angleRad = (currentAngle * Math.PI) / 180;

                      const radius = 110;
                      const translateX = radius * Math.sin(angleRad);
                      const translateY = -radius * Math.cos(angleRad);

                      return (
                        <View
                          key={index}
                          style={[
                            styles.wheelCard,
                            {
                              transform: [
                                { translateX },
                                { translateY },
                                { rotate: `${currentAngle}deg` },
                              ],
                              zIndex: index,
                            },
                          ]}
                        >
                          <Image
                            source={require('../../assets/backcard.png')}
                            style={styles.wheelCardImage}
                            resizeMode="stretch"
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  // spread ไพ่เป็นครึ่งวงกลม
                  <View style={styles.fanContainer}>
                    {shuffledDeck.map((item, index) => {
                      const totalCards = shuffledDeck.length;
                      const startAngle = -85; // แบ่งมุมกว้าง 170° ให้ไพ่ทุกใบเท่าๆ กัน ใบแรกได้ -85° ใบกลางได้ประมาณ 0° ใบสุดท้ายได้ +85°
                      const endAngle = 85;    
                      const angleStep = (endAngle - startAngle) / (totalCards - 1);
                      const currentAngle = startAngle + (angleStep * index);
                      
                      const isPicked = selectedCards.some(c => c.deckIndex === index); // ถ้าไพ่ใบนี้ผู้ใช้เลือกแล้ว ให้ขยับขึ้น 35px เพื่อให้เห็นว่าใบไหนถูกเลือก
                      const radius = 220; // radius = 220 คือขนาดของวงกลม
                      
                      const angleRad = (currentAngle * Math.PI) / 180;
                      const translateX = radius * Math.sin(angleRad);
                      const translateY = radius * (1 - Math.cos(angleRad)) + (isPicked ? -35 : 0);

                      return (
                        <View
                          key={index}
                          style={[
                            styles.fanCard,
                            {
                              transform: [
                                { translateX: translateX }, // ผลักไพ่ไปซ้าย/ขวา
                                { translateY: translateY }, // ผลักไพ่ลง (หรือยกขึ้นถ้าถูกเลือก)
                                { rotate: `${currentAngle}deg` } // เอียงไพ่ให้ชี้ออกจากศูนย์กลาง
                              ],
                              zIndex: index, 
                            }
                          ]}
                        >
                          <TouchableOpacity // ปุ่มกดเลือกไพ่
                            activeOpacity={0.9}
                            style={{ width: '100%', height: '100%' }}
                            onPress={() => handleSelectCardFromFan(item, index)}
                          >
                            <Image 
                              source={require('../../assets/backcard.png')} 
                              style={[styles.fanCardImage, isPicked && styles.fanCardImageSelected]}
                              resizeMode="stretch"
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ปุ่มสับไพ่ Fisher-Yates ด้านล่างพัดไพ่ */}
                <View style={[styles.reShuffleArea, isShuffling && styles.reShuffleAreaShuffling]}>
                  <TouchableOpacity 
                    style={[styles.reShuffleBtn, isShuffling && { opacity: 0.6 }]} 
                    onPress={handleReShuffleFromFan}
                    disabled={isShuffling}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
  colors={['#A855F7', '#6B21A8']}
  style={styles.reShuffleGradient}
>
                      <Text style={styles.reShuffleBtnText}>
                        {isShuffling ? 'กำลังสับไพ่...' : 'สับไพ่'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {shuffleCount > 0 && (
                    <Text style={styles.shuffleCountBadge}>
                      สับไพ่แล้ว {shuffleCount} ครั้ง ✨
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              /* หน้าจอแสดงไพ่ที่เลือกสำเร็จแบบ Swipe เลื่อนดูได้ */
              <GlassCard style={styles.tarotCardContainer}>
                
                <ScrollView 
                  horizontal 
                  pagingEnabled 
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.swipeScrollContent}
                  style={styles.swipeWindow}
                >
                  {selectedCards.map((card, idx) => (
                    <View key={idx} style={styles.swipeCardItem}>
                      <View style={styles.badgeRow}>
                        <View style={styles.badge}><Text style={styles.badgeText}>ไพ่ใบที่ {idx + 1}</Text></View>
                        <View style={[styles.badge, styles.badgeCategory]}><Text style={styles.badgeText}>{selectedTopic}</Text></View>
                        {card.cardIsReversed && (
                          <View style={[styles.badge, styles.badgeReversed]}><Text style={styles.badgeText}>กลับหัว</Text></View>
                        )}
                      </View>

                      {card.imageUrl ? (
                        <Image
                          source={{ uri: card.imageUrl }}
                          style={[styles.cardImage, card.cardIsReversed && { transform: [{ rotate: '180deg' }] }]}
                          resizeMode="contain"
                        />
                      ) : null}

                      <Text style={styles.cardName}>{card.name}</Text>
                      {card.cardIsReversed && <Text style={styles.reversedLabel}>🔄 ไพ่กลับหัว</Text>}
                    </View>
                  ))}
                </ScrollView>

                {/* Carousel Indicator Dots */}
                <View style={styles.indicatorContainer}>
                  {selectedCards.map((_, idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.indicatorDot, 
                        activeCardIndex === idx && styles.indicatorDotActive
                      ]} 
                    />
                  ))}
                </View>

                {/* ปุ่มเปิดแสดงคำทำนายสไตล์ Professional Neon-Glass */}
                {!showPrediction ? (
                  <TouchableOpacity 
                    style={styles.revealBtn} 
                    onPress={() => {
                      setShowPrediction(true);
                      setUnsavedHistoryStatus(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#c084fc', '#a855f7']} style={styles.revealGradient}>
                      <Text style={styles.revealBtnText}> เปิดอ่านคำทำนายทั้งหมด 📖 </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  /* ส่วนเนื้อหาคำทำนายที่จะเปลี่ยนข้อความตามไพ่ใบที่กำลังส่องอย่าง Dynamic */
                  <View style={styles.predictionAreaOutside}>
                    <View style={styles.divider} />
                    <Text style={styles.topicLabel}>
                      🔮 คำทำนายใบที่ {activeCardIndex + 1} ({currentActiveCard?.name})
                    </Text>
                    <Text style={styles.cardResult}>
                      {getSpecificCardMeaning(currentActiveCard)}
                    </Text>

                    {/* 🌟🌟 ส่วน Gemini AI Real-time อ่านคำทำนายโดยรวมทั้งหมด 🌟🌟 */}
                    <View style={styles.aiDivider} />
                    
                    {!aiSummary ? (
                      <TouchableOpacity 
                        style={styles.aiBtn} 
                        onPress={handleGetOverallPrediction}
                        disabled={loadingAi}
                        activeOpacity={0.8}
                      >
                        <LinearGradient 
                          colors={['#8b5cf6', '#6d28d9']} 
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.aiGradient}
                        >
                          {loadingAi ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.aiBtnText}>✨ อ่านคำทำนายโดยรวมทั้งหมด (Gemini AI)</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.aiBox}>
                        <Text style={styles.aiTitle}>🔮 บทสรุปคำทำนายโดยรวม (Gemini AI)</Text>
                        <Text style={styles.aiResultText}>{aiSummary}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ปุ่มควบคุมล่างสุดจัดวางแบบสมดุลหรูหรา */}
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.resetBtn} 
                    onPress={() => {
                      if (aiSummary) {
                        Alert.alert(
                          'จั่วไพ่ใบใหม่',
                          'คุณต้องการจั่วไพ่ใบใหม่โดยที่ไม่บันทึกประวัติใช่หรือไม่?',
                          [
                            {
                              text: 'ยกเลิก',
                              style: 'cancel',
                            },
                            {
                              text: 'จั่วไพ่ใหม่',
                              style: 'destructive',
                              onPress: reset,
                            },
                          ]
                        );
                      } else {
                        reset();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resetText}>🃏 จั่วไพ่ใหม่</Text>
                  </TouchableOpacity>
                  
                  {/* 🌟 ปรับ Opacity เพื่อบ่งบอกสภาวะหากยังไม่ได้อ่านคำทำนายจาก Gemini AI */}
                  <TouchableOpacity 
                    style={[styles.doneBtn, !aiSummary && styles.doneBtnDisabled]} 
                    onPress={handleExitAndSave} 
                    activeOpacity={0.8}
                  >
                    <LinearGradient 
                      colors={['#3b82f6', '#1d4ed8']} 
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.doneGradient}
                    >
                      <Text style={styles.doneText}>✨ บันทึกประวัติ</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}
          </View>
        )}

        <Text style={styles.disclaimer}>* ผลดูดวงเพื่อความบันเทิงและแรงบันดาลใจ</Text>
      </ScrollView>
    </GradientBg>
  );
}

// 🌟 คงสไตล์ดั้งเดิมไว้ 100%
const styles = StyleSheet.create({
  scroll: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 120 },
  title: { fontFamily: FONTS.bold, color: '#fff', fontSize: 26, textAlign: 'center' },
  sub: { fontFamily: FONTS.bold, color: '#ffd900ff', fontSize: 18, textAlign: 'left',alignSelf: 'flex-start', marginTop: 18, marginLeft: 4, marginBottom: 26 },
  topicRow: { flexDirection: 'row', gap: 10, marginTop: -14, marginBottom: 20 },
  topicChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  topicChipActive: { backgroundColor: 'rgba(168,85,247,0.45)', borderColor: COLORS.accent },
  chipText: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 13 },
  chipTextActive: { fontFamily: FONTS.bold, color: '#fff' },
  
  sectionLabel: { fontFamily: FONTS.bold, color: COLORS.gold, fontSize: 18, marginBottom: 12, paddingLeft: 2, letterSpacing: 0.3 },
  countRow: { flexDirection: 'row', gap: 8, marginBottom: 26 },
  countChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  countChipActive: { backgroundColor: 'rgba(252,211,77,0.25)', borderColor: COLORS.gold },
  countText: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 13 },
  countTextActive: { fontFamily: FONTS.bold, color: COLORS.gold },

  shuffleContainer: { alignItems: 'center', marginVertical: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deckStatusText: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 14, marginBottom: 16 },
  shuffleBtn: { width: '80%', height: 50, borderRadius: 25, overflow: 'hidden' },
  shuffleGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  shuffleBtnText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 16, letterSpacing: 1 },

  cardArea: { alignItems: 'center', minHeight: 400, justifyContent: 'center', marginTop: 10, width: '100%' },
  
  fanWrapper: { width: '100%', alignItems: 'center', height: 440, marginTop: 1 },
  fanStatusText: { fontFamily: FONTS.semiBold, color: COLORS.gold, fontSize: 14, marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  fanContainer: { width: SCREEN_WIDTH - 64, height: 340, alignItems: 'center', justifyContent: 'flex-start', position: 'relative', marginTop: -70, transform: [{ scale: 0.77 }] },
  fanCard: { position: 'absolute', width: 70, height: 120, bottom: 90 }, 
  fanCardImage: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  fanCardImageSelected: { borderColor: COLORS.gold, borderWidth: 2, shadowColor: COLORS.gold, shadowOffset: {width: 0, height: -6}, shadowOpacity: 0.9, shadowRadius: 10 },

  // 🌟 สไตล์วงล้อไพ่ตอนสับไพ่
  wheelContainer: { width: 280, height: 280, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  wheelCard: { position: 'absolute', width: 32, height: 56, top: '50%', left: '50%', marginLeft: -16, marginTop: -28 },
  wheelCardImage: { width: '100%', height: '100%', borderRadius: 4 },

  reShuffleArea: { alignItems: 'center', marginTop: 70, zIndex: 999 },
  reShuffleAreaShuffling: { marginTop: 30 },
  reShuffleBtn: {
  width: 150,
  minWidth: 0,
  height: 54,
  borderRadius: 25,
  borderWidth: 2.5,
  borderColor: '#1b0a2e',

  // เงาดำอยู่ด้านล่างเหมือนปุ่มจั่วไพ่ใหม่
  shadowColor: '#1b0a2e',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,

  justifyContent: 'center',
  alignItems: 'center',
},
 reShuffleGradient: {
  flex: 1,
  width: '100%',
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 8,
  overflow: 'hidden',
},
  reShuffleBtnText: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 18, letterSpacing: 0.5 },
  shuffleCountBadge: { fontFamily: FONTS.regular, color: '#ffd700', fontSize: 13, marginTop: 8 },

  tarotCardContainer: { width: SCREEN_WIDTH - 40, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,140,255,0.3)' },
  
  swipeWindow: { width: CARD_SLIDER_WIDTH, height: 290 },
  swipeScrollContent: { alignItems: 'center' },
  swipeCardItem: { width: CARD_SLIDER_WIDTH, alignItems: 'center', justifyContent: 'center' },
  
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 14 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  indicatorDotActive: { width: 16, backgroundColor: COLORS.accent }, 

  revealBtn: { width: '65%', height: 48, borderRadius: 30, overflow: 'hidden', marginTop: 4, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  revealGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  revealBtnText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 15, letterSpacing: 0.5 },
  
  predictionAreaOutside: { width: '100%', alignItems: 'center', marginTop: 10, paddingVertical: 8, },

  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 12, justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  badgeCategory: { backgroundColor: 'rgba(168,85,247,0.3)', borderColor: COLORS.accent },
  badgeReversed: { backgroundColor: 'rgba(248,113,113,0.25)', borderColor: '#f87171' },
  badgeText: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 11 },
  cardImage: { width: 140, height: 180, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardName: { fontFamily: FONTS.bold, color: '#fff', fontSize: 18, textAlign: 'center' },
  reversedLabel: { fontFamily: FONTS.regular, color: '#f87171', fontSize: 14, marginTop: 2 },
  
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  topicLabel: { fontFamily: FONTS.semiBold, color: COLORS.accent, fontSize: 13, letterSpacing: 1.5, textAlign: 'center', marginBottom: 6, lineHeight: 30, letterSpacing: 0.5},
  // 🌟 แก้สีให้ตรงกับ aiResultText (#f1f5f9) และเปลี่ยนเป็น justify ให้ขอบข้อความเสมอกันทั้งซ้าย-ขวา
cardResult: {
  width: '100%',
  alignSelf: 'stretch',
  fontFamily: FONTS.regular,
  color: '#f1f5f9',
  fontSize: 18,
  lineHeight: 26,
  textAlign: 'justify',
  lineBreakStrategyIOS: 'standard',
  paddingHorizontal: 10,
},
  
  aiDivider: { width: '100%', height: 1, backgroundColor: 'rgba(168,85,247,0.3)', marginVertical: 16 },
  // 🌟 Neo-brutal UI — ปุ่มหลัก Gemini AI
  aiBtn: {
    width: '100%',
    height: 54,
    borderRadius: 22,
    overflow: 'visible',
    marginTop: 4,
    marginBottom: 7,

    // ขอบเข้มแบบ Neo-brutal
    borderWidth: 2.5,
    borderColor: '#1b0a2e',

    // เงาแข็ง ไม่ฟุ้ง
    shadowColor: '#1b0a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },

  aiGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 19,
  },

  aiBtnText: {
    fontFamily: FONTS.bold,
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  aiBox: { width: '100%', backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.4)', marginTop: 4, paddingTop: 18},
  aiTitle: { fontFamily: FONTS.bold, color: '#c084fc', fontSize: 15, textAlign: 'center', marginBottom: 8, lineHeight: 26, paddingTop: 4 },
  // 🌟 เพิ่ม textAlign: 'justify' ให้ข้อความชิดขอบทั้งสองด้านเท่ากัน แทนที่จะปล่อยชิดซ้าย (default)
  aiResultText: { fontFamily: FONTS.regular, color: '#f1f5f9', fontSize: 18, lineHeight: 26, textAlign: 'justify' },

  // 🌟 Neo-brutal UI — ปุ่มด้านล่าง
  // 🌟 ปุ่มด้านล่าง — ขนาดเท่ากันและจัดสมดุลกับหน้าจอ
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },

  // 🃏 ปุ่มจั่วไพ่ใหม่ — พื้นหลังขาวแบบ Neo-brutal
  resetBtn: {
    width: 150,
    minWidth: 0,
    height: 54,
    borderRadius: 25,

    backgroundColor: '#FFFFFF',

    borderWidth: 2.5,
    borderColor: '#1b0a2e',

    // เงาแข็งด้านล่าง
    shadowColor: '#1b0a2e',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,

    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  resetText: {
    fontFamily: FONTS.semiBold,
    color: '#111111',
    fontSize: 14,
    textAlign: 'center',
  },

  // ✨ ปุ่มบันทึกประวัติ — ขนาดเท่ากับปุ่มจั่วไพ่
  doneBtn: {
    width: 150,
    minWidth: 0,
    height: 54,
    borderRadius: 25,
    overflow: 'visible',
    marginLeft: 34,

    borderWidth: 2.5,
    borderColor: '#15104a',

    shadowColor: '#15104a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  doneBtnDisabled: {
    opacity: 0.55,
  },

  doneGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 8,
  },

  doneText: {
    fontFamily: FONTS.bold,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: { fontFamily: FONTS.light, color: COLORS.textFaint, fontSize: 12, textAlign: 'center', marginTop: 22 },
});
