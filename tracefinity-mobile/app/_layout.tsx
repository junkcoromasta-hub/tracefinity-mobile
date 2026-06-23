import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDb } from '../lib/db';
import { useAppStore } from '../lib/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const loadFromDB = useAppStore((state) => state.loadFromDB);

  useEffect(() => {
    const init = async () => {
      try {
        await initDb();
        await loadFromDB();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    init();
  }, [loadFromDB]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#f5f5f5',
            },
            headerTintColor: '#007AFF',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="camera"
            options={{
              title: 'New Tool',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="tools/[id]/editor"
            options={{
              title: 'Edit Tool',
            }}
          />
          <Stack.Screen
            name="tools/[id]/trace"
            options={{
              title: 'Trace Tool',
            }}
          />
          <Stack.Screen
            name="bins/[id]/layout"
            options={{
              title: 'Bin Layout',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
