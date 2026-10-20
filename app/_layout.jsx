import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../context/UserContext';
import {
  useFonts,
  NotoSerifThai_300Light,
  NotoSerifThai_400Regular,
  NotoSerifThai_600SemiBold,
  NotoSerifThai_700Bold,
} from '@expo-google-fonts/noto-serif-thai';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSerifThai_300Light,
    NotoSerifThai_400Regular,
    NotoSerifThai_600SemiBold,
    NotoSerifThai_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a0033' }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <UserProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </UserProvider>
  );
}
