import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Place detail' }} />
        <Stack.Screen name="report" options={{ title: 'Submit report' }} />
      </Stack>
    </>
  );
}
