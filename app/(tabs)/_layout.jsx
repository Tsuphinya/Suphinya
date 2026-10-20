import { Tabs } from 'expo-router';
import { StyleSheet, Alert } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function HomeIcon({ color }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11L12 4l8 7v8a1.5 1.5 0 01-1.5 1.5h-3.5v-5h-6v5H5.5A1.5 1.5 0 014 19V11z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill={color === '#e879f9' ? 'rgba(232,121,249,0.12)' : 'none'}
      />
    </Svg>
  );
}

function FortuneIcon({ color }) {
  const glareColor = color === '#e879f9'
    ? 'rgba(232,121,249,0.3)'
    : 'rgba(255,255,255,0.15)';
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="11" r="7.5" stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 20h8M12 18.5V20"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Circle cx="9.5" cy="9" r="1.5" fill={glareColor} />
    </Svg>
  );
}

function HistoryIcon({ color }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="3.5" stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 8.5h8M8 12.5h6M8 16.5h4"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4.5" stroke={color} strokeWidth={1.6} />
      <Path
        d="M3.5 21c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#e879f9',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarShowLabel: false,
      }}

      // 🌟 ดักการกด Tab จากตัว Bottom Tab Navigator โดยตรง
      screenListeners={({ navigation }) => ({
        tabPress: (e) => {
          const state = navigation.getState();
          const currentRoute = state.routes[state.index];

          // ถ้าไม่ได้อยู่หน้า Fortune ให้เปลี่ยนหน้าได้ตามปกติ
          if (currentRoute?.name !== 'fortune') {
            return;
          }

          // อ่านสถานะว่ามีผลดูดวงที่ยังไม่ได้บันทึกหรือไม่
          const currentParams = currentRoute.params || {};
          const hasUnsavedHistory = currentParams.unsavedHistory === 'true';

          // ไม่มีข้อมูลค้างอยู่ → เปลี่ยนหน้าได้ตามปกติ
          if (!hasUnsavedHistory) {
            return;
          }

          // 🚫 หยุดการเปลี่ยน Tab ไว้ก่อน
          e.preventDefault();

          const targetRoute = state.routes.find(
            route => route.key === e.target
          );

          Alert.alert(
            'ยังไม่ได้บันทึกประวัติ',
            'คุณต้องการออกจากหน้านี้โดยไม่บันทึกประวัติใช่หรือไม่?',
            [
              {
                text: 'อยู่หน้านี้',
                style: 'cancel',
              },
              {
                text: 'ออกโดยไม่บันทึก',
                style: 'destructive',
                onPress: () => {
                  // 🌟 แก้ไข: navigation.setParams() เฉยๆ จะเซ็ต params ให้ route ของ
                  // Tabs navigator เองที่มองจาก parent navigator (เช่น Stack ด้านบน)
                  // ไม่ใช่ route "fortune" ที่ซ้อนอยู่ข้างใน ทำให้ fortune.jsx ไม่เคยเห็นค่า
                  // resetFortune ที่เปลี่ยนไปเลย ต้องระบุ source เป็น key ของ route fortune
                  // ตรงๆ เพื่อให้ params ไปลงถูก route
                  // (สร้าง action object เองแทนการ import CommonActions จาก
                  // @react-navigation/native เพราะ expo-router SDK 56 ไม่อนุญาตให้ import
                  // จาก react-navigation ตรงๆ ในโค้ดแอป — action นี้มีรูปแบบเดียวกับที่
                  // CommonActions.setParams() จะสร้างให้ทุกประการ)
                  navigation.dispatch({
                    type: 'SET_PARAMS',
                    payload: {
                      params: {
                        unsavedHistory: 'false',
                        resetFortune: String(Date.now()),
                      },
                    },
                    source: currentRoute.key,
                  });

                  // ไปยังหน้าที่ผู้ใช้กดไว้
                  if (targetRoute?.name) {
                    navigation.navigate(
                      targetRoute.name,
                      targetRoute.params
                    );
                  }
                },
              },
            ]
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />

      <Tabs.Screen
        name="fortune"
        options={{
          tabBarIcon: ({ color }) => <FortuneIcon color={color} />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0e0020',
    borderTopWidth: 3,
    borderTopColor: 'rgba(168,85,247,0.15)',
    height: 72,
    paddingBottom: 10,
    paddingTop: 10,
    borderRadius: 45,
    marginHorizontal: 18,
    marginBottom: 22,
    position: 'absolute',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
});
