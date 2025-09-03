import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Button, Pressable} from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Login or create your account!</ThemedText>
        <ThemedText>
          If you already have an account: enter your <ThemedText type="defaultSemiBold">username</ThemedText> and <ThemedText type="defaultSemiBold">password</ThemedText>. 
          If you do not have an account, press{' '}
          <ThemedText type="defaultSemiBold">
            'Create Account'
          </ThemedText>{' '}
          to register now.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Pick your sport!</ThemedText>
        <ThemedText>
          {`Find your favorite sports and players using the search bar.`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Place yours bets!</ThemedText>
        <ThemedText>
          {`When you're feeling confident,`}
          <ThemedText type="defaultSemiBold"> place your chosen bet </ThemedText>amounts on your favorite players, keep an eye on your{' '}
          <ThemedText type="defaultSemiBold">bets</ThemedText>, and{' '}
          <ThemedText type="defaultSemiBold">Good luck!</ThemedText>
        </ThemedText>
      </ThemedView>

      <Pressable onPress={() => router.push("/explore")}>
        <ThemedView style={styles.button}>
          <ThemedText type="defaultSemiBold" style={{ color: "#ffffff" }}>
            Proceed to login
          </ThemedText>
        </ThemedView>
      </Pressable>

      <ThemedText>
        {`No account? Register Now!`}
      </ThemedText>
      <Pressable onPress={() => router.push("/explore")}>
        <ThemedText type="defaultSemiBold" style={{ color: "#6b6b6b", textDecorationLine: "underline" }}>
          Register here
        </ThemedText>
      </Pressable>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
