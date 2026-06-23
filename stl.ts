import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { traceToolsFromPhoto } from '../../lib/ml/trace';
import { useAppStore } from '../../lib/store';
import { generateMockContours, simplifyPolygon } from '../../lib/ml/contours';
import { MaterialIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'react-native-uuid';

export default function TraceScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const [tracing, setTracing] = useState(true);
  const [selectedContours, setSelectedContours] = useState<Set<number>>(new Set());
  const [contours, setContours] = useState<Array<[number, number][]>([]);
  const [error, setError] = useState<string | null>(null);
  const addTool = useAppStore((state) => state.addTool);

  useEffect(() => {
    const startTracing = async () => {
      if (!photoUri) {
        setError('No photo provided');
        setTracing(false);
        return;
      }

      try {
        // Call Gemini API to get mask
        console.log('Starting trace with Gemini...');
        const mask = await traceToolsFromPhoto(photoUri);

        // For MVP, use mock contours
        // In production, you'd decode the PNG mask and extract contours
        const mockContours = generateMockContours();
        setContours(mockContours);

        // Auto-select first contour
        setSelectedContours(new Set([0]));
      } catch (err) {
        console.error('Tracing error:', err);
        setError(err instanceof Error ? err.message : 'Tracing failed');
      } finally {
        setTracing(false);
      }
    };

    startTracing();
  }, [photoUri]);

  const toggleContour = (idx: number) => {
    const newSelected = new Set(selectedContours);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedContours(newSelected);
  };

  const handleSaveTools = async () => {
    if (selectedContours.size === 0) {
      Alert.alert('No tools selected', 'Select at least one contour');
      return;
    }

    try {
      setTracing(true);
      const selectedArray = Array.from(selectedContours).sort((a, b) => a - b);

      for (let i = 0; i < selectedArray.length; i++) {
        const idx = selectedArray[i];
        const vertices = simplifyPolygon(contours[idx], 2);

        const tool = {
          id: uuidv4() as string,
          name: `Tool ${i + 1}`,
          vertices: vertices as [number, number][],
          rotation: 0,
          scale: 1,
          createdAt: new Date().toISOString(),
        };

        await addTool(tool);
      }

      Alert.alert(
        'Success',
        `${selectedContours.size} tool(s) saved to library`,
        [
          {
            text: 'View Library',
            onPress: () => {
              router.dismissAll();
              router.navigate('/(tabs)/');
            },
          },
          {
            text: 'Add More',
            onPress: () => {
              router.dismissAll();
              router.navigate('/camera');
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save tools');
      console.error(err);
    } finally {
      setTracing(false);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Tracing Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            Make sure you have set EXPO_PUBLIC_GEMINI_KEY in .env.local
          </Text>
          <Pressable
            style={styles.errorButton}
            onPress={() => {
              router.back();
            }}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (tracing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing photo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Select tools to save</Text>
        <Text style={styles.subtitle}>Tap tools to select/deselect them</Text>

        <View style={styles.contoursGrid}>
          {contours.map((contour, idx) => (
            <Pressable
              key={idx}
              style={[
                styles.contourCard,
                selectedContours.has(idx) && styles.contourCardSelected,
              ]}
              onPress={() => toggleContour(idx)}
            >
              <View style={styles.contourPreview}>
                {/* Simple shape preview */}
                <View
                  style={[
                    styles.shapeIndicator,
                    { backgroundColor: selectedContours.has(idx) ? '#007AFF' : '#ddd' },
                  ]}
                />
              </View>
              <Text style={styles.contourLabel}>Tool {idx + 1}</Text>
              <Text style={styles.contourInfo}>{contour.length} vertices</Text>
              {selectedContours.has(idx) && (
                <MaterialIcons
                  name="check-circle"
                  size={24}
                  color="#007AFF"
                  style={styles.checkIcon}
                />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.footerButton, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[
            styles.footerButton,
            styles.saveButton,
            selectedContours.size === 0 && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveTools}
          disabled={selectedContours.size === 0}
        >
          <Text style={styles.saveButtonText}>
            Save {selectedContours.size > 0 ? `(${selectedContours.size})` : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorButton: {
    marginTop: 24,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  contoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contourCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contourCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  contourPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  contourLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  contourInfo: {
    fontSize: 12,
    color: '#999',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
