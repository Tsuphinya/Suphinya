import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable } from 'react-native'; 
import { useRouter } from 'expo-router'; 
import Feather from '@expo/vector-icons/Feather'; 
import { GradientBg, GlassCard } from '../../components/GradientBg';
import { COLORS, FONTS } from '../../constants/Colors';
import { useUser } from '../../context/UserContext';

export default function HistoryScreen() {
  const { fortuneHistory, deleteFortuneHistory } = useUser(); 
  const router = useRouter(); 
  
  const topicEmojis = { ความรัก: '❤️', การงาน: '💼', การเงิน: '💰' };

  // ฟังก์ชันจัดการเมื่อกดปุ่มลบ
  const handleDelete = (historyId, category, date) => {
    Alert.alert(
      "ยืนยันการลบประวัติ",
      `คุณต้องการลบประวัติการดูดวงเรื่อง "${category}" ของวันที่ ${date} หรือไม่? (ข้อมูลจะถูกลบถาวร)`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบประวัติ",
          style: "destructive",
          onPress: async () => {
            const success = await deleteFortuneHistory(historyId);
            if (!success) {
              Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลจากระบบได้ กรุณลองใหม่อีกครั้ง");
            }
          }
        }
      ]
    );
  };

  return (
    <GradientBg>
      <View style={styles.container}>
        <Text style={styles.title}>📜 ประวัติการดูดวง</Text>
        <Text style={styles.count}>{fortuneHistory.length} ครั้ง</Text>
        {fortuneHistory.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🔮</Text>
            <Text style={styles.emptyText}>ยังไม่มีประวัติการดูดวง</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
            {fortuneHistory.map((item, i) => {
              let displayDate = item.date || '';
              let displayTime = '';
              if (item.createdAt?.seconds) {
                const createdDate = new Date(item.createdAt.seconds * 1000);
                displayDate = createdDate.toLocaleDateString('th-TH');
                displayTime = createdDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              } else if (item.createdAt instanceof Date) {
                displayDate = item.createdAt.toLocaleDateString('th-TH');
                displayTime = item.createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              }

              const cardCountText = item.cards && item.cards.length > 0
                ? `ดูไพ่ทั้งหมด ${item.cards.length} ใบ`
                : 'ไม่พบข้อมูลไพ่';

              return (
                <View key={item.id || i} style={{ position: 'relative' }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      router.push({
                        pathname: '/history-detail',
                        params: {
                          historyId: item.id, 
                          category: item.category,
                          date: displayDate,
                          userName: item.userName || 'ผู้ใช้งานทั่วไป', 
                          userEmail: item.userEmail || '',             
                        }
                      });
                    }}
                  >
                    <GlassCard style={styles.item}>
                      <View style={styles.itemHeader}>
                        <Text style={{ fontSize: 26, marginRight: 12 }}>{topicEmojis[item.category]}</Text>
                        <View style={{ flex: 1, paddingRight: 85 }}>
                          <Text style={styles.itemTopic}>{item.category}</Text>
                          <Text style={styles.itemDate}>
                            {displayDate}{displayTime ? ` · ${displayTime} น.` : ''}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.itemCard}>{cardCountText}</Text>

                      <Text style={styles.clickInfo}>✨ แตะเพื่อดูคำทำนายเต็มรูปแบบ</Text>
                    </GlassCard>
                  </TouchableOpacity>

                  {/* 🌟 ปรับปรุงปุ่มลบให้ ยุบตัว และ ขยับสีเข้มขอบเมื่อกด เพื่อให้แสดงฟีดแบ็กจริงตาเปล่าเห็นชัด */}
                  <Pressable 
                    onPress={() => handleDelete(item.id, item.category, displayDate)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      { 
                        backgroundColor: pressed ? '#e5e7eb' : '#f3f4f6',
                        borderColor: pressed ? '#d1d5db' : '#f3f4f6',
                        // 🌟 ดันสเกลให้ปุ่มหดตัวยุบลงไป 5% ทันทีที่จิ้ม เพื่อสร้างเอฟเฟกต์เด้งเหมือนในคลิป
                        transform: [{ scale: pressed ? 0.94 : 1 }] 
                      }
                    ]}
                  >
                    <Feather name="trash-2" size={14} color="#4b5563" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </GradientBg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70, paddingHorizontal: 20 },
  title: { fontFamily: FONTS.bold, color: '#fff', fontSize: 24, textAlign: 'center' },
  count: { fontFamily: FONTS.regular, color: COLORS.textSoft, fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', transform: [{ translateY: -70 }],},
  emptyText: { fontFamily: FONTS.semiBold, color: COLORS.textSoft, fontSize: 17 },
  emptyHint: { fontFamily: FONTS.regular, color: COLORS.textFaint, fontSize: 13, marginTop: 8 },
  item: { marginBottom: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemTopic: { fontFamily: FONTS.bold, color: COLORS.accent, fontSize: 14 },
  itemDate: { fontFamily: FONTS.regular, color: COLORS.textFaint, fontSize: 12, marginTop: 2 },
  itemCard: { fontFamily: FONTS.semiBold, color: '#fff', fontSize: 15, marginBottom: 6 },
  clickInfo: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 12, marginTop: 4 },
  
  deleteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',       
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,         
    paddingHorizontal: 10,      
    borderRadius: 8,
    borderWidth: 1,            
    zIndex: 99, // 🌟 ขยับ Layer ขึ้นมาสูงสุดเพื่อให้พ้นรัศมีการทับสิทธิ์ของปุ่มการ์ดหลัก
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2, 
  },
  deleteText: {
    fontFamily: FONTS.semiBold,
    color: '#4b5563',           
    fontSize: 12,
  }
});
