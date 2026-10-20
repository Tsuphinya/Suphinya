import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // สร้างดาวกระพริบ,Animation
  const stars = Array.from({ length: 16 }, () => ({
    opacity: useRef(new Animated.Value(0)).current,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.5 + 1,
  }));

  useEffect(() => {
    // Logo fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    // Stars twinkle
    stars.forEach((star, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(star.opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(star.opacity, { toValue: 0.1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    });

    // Navigate to login after 3s
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        router.replace('/login');
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* ดาวกระพริบ */}
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#fcd34d',
            opacity: star.opacity,
            zIndex: 2,
          }}
        />
      ))}

      {/* โลโก้เต็มหน้าจอ */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e0035',
  },
  logoWrap: {
    flex: 1,
  },
  logo: {
    width: width,
    height: height,
  },
});
