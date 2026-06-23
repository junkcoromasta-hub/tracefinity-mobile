import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { detectPlateCorners, calculateScaleFromCorners } from '../ml/contours';
import { CENTAURI_PLATE } from '../constants';

interface CalibrationProps {
  photoUri: string;
  onCalibrationComplete: (scale: number, corners: [number, number][]) => void;
  onCancel: () => void;
}

export function CalibrationUI({ photoUri, onCalibrationComplete, onCancel }: CalibrationProps) {
  const [mode, setMode] = useState<'method' | 'auto' | 'manual'>('method');
  const [detectedCorners, setDetectedCorners] = useState<[number, number][] | null>(null);
  const [selectedCorners, setSelectedCorners] = useState<[number, number][]>([]);
  const [scale, setScale] = useState<number | null>(null);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  // Auto-detect corners when entering auto mode
  useEffect(() => {
    if (mode === 'auto' && imageLayout.width > 0) {
      const corners = detectPlateCorners(imageLayout.width, imageLayout.height);
      if (corners) {
        setDetectedCorners(corners);
        const calculatedScale = calculateScaleFromCorners(corners, CENTAURI_PLATE.width);
        setScale(calculatedScale);
      }
    }
  }, [mode, imageLayout]);

  const handleAutoDetectConfirm = () => {
    if (detectedCorners && scale) {
      onCalibrationComplete(scale, detectedCorners);
    }
  };

  const handleImagePress = (e: any) => {
    if (mode !== 'manual') return;

    const { locationX, locationY } = e.nativeEvent;
    if (selectedCorners.length < 4) {
      setSelectedCorners([...selectedCorners, [locationX, locationY]]);
    }

    if (selectedCorners.length === 3) {
      // User is about to complete selection
      Alert.alert(
        'Corner Selection',
        'Tap once more to complete. Corners should be: Top-Left, Top-Right, Bottom-Right, Bottom-Left',
        [{ text: 'OK' }]
      );
    }
  };

  const handleManualConfirm = () => {
    if (selectedCorners.length === 4) {
      const corners = selectedCorners as [number, number][];
      const calculatedScale = calculateScaleFromCorners(corners, CENTAURI_PLATE.width);
      setScale(calculatedScale);
      onCalibrationComplete(calculatedScale, corners);
    } else {
      Alert.alert('Incomplete', `Select 4 corners. You have ${selectedCorners.length}/4`);
    }
  };

  const handleReset = () => {
    setSelectedCorners([]);
    setDetectedCorners(null);
    setScale(null);
    setMode('method');
  };

  // Method selection screen
  if (mode === 'method') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Calibrate with Centauri Build Plate</Text>
        <Text style={styles.subtitle}>Choose detection method:</Text>

        <Pressable
          style={styles.methodButton}
          onPress={() => setMode('auto')}
        >
          <MaterialIcons name="auto-fix-high" size={32} color="#2196F3" />
          <Text style={styles.methodTitle}>Auto-Detect</Text>
          <Text style={styles.methodDesc}>Automatically detect corners (faster)</Text>
        </Pressable>

        <Pressable
          style={styles.methodButton}
          onPress={() => setMode('manual')}
        >
          <MaterialIcons name="touch-app" size={32} color="#4CAF50" />
          <Text style={styles.methodTitle}>Manual Select</Text>
          <Text style={styles.methodDesc}>Tap 4 corners for precise calibration</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // Auto-detect screen
  if (mode === 'auto') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Auto-Detect Calibration</Text>

        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
          onLayout={(e) => {
            setImageLayout({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            });
          }}
        />

        {detectedCorners && (
          <View style={styles.cornerIndicators}>
            {detectedCorners.map((corner, i) => (
              <View
                key={i}
                style={[
                  styles.cornerDot,
                  {
                    left: corner[0] - 8,
                    top: corner[1] - 8,
                  },
                ]}
              >
                <Text style={styles.cornerLabel}>{i + 1}</Text>
              </View>
            ))}
          </View>
        )}

        {scale && (
          <View style={styles.scaleInfo}>
            <Text style={styles.scaleLabel}>Scale: {scale.toFixed(2)} pixels/mm</Text>
            <Text style={styles.plateInfo}>
              Centauri Plate: {CENTAURI_PLATE.width}×{CENTAURI_PLATE.height}mm
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={handleReset}>
            <MaterialIcons name="arrow-back" size={20} color="#2196F3" />
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>

          <Pressable
            style={[styles.confirmButton, !scale && styles.buttonDisabled]}
            onPress={handleAutoDetectConfirm}
            disabled={!scale}
          >
            <MaterialIcons name="check" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Manual select screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Corner Selection</Text>
      <Text style={styles.subtitle}>Tap 4 corners: TL → TR → BR → BL</Text>

      <Pressable
        onPress={handleImagePress}
        style={styles.previewImageContainer}
      >
        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
          onLayout={(e) => {
            setImageLayout({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            });
          }}
        />

        {/* Render selected corner markers */}
        {selectedCorners.map((corner, i) => (
          <View
            key={i}
            style={[
              styles.cornerDot,
              { left: corner[0] - 8, top: corner[1] - 8 },
            ]}
          >
            <Text style={styles.cornerLabel}>{i + 1}</Text>
          </View>
        ))}
      </Pressable>

      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          {selectedCorners.length}/4 corners selected
        </Text>
        {selectedCorners.length > 0 && (
          <Pressable onPress={() => setSelectedCorners(selectedCorners.slice(0, -1))}>
            <MaterialIcons name="undo" size={20} color="#FF9800" />
          </Pressable>
        )}
      </View>

      {scale && (
        <View style={styles.scaleInfo}>
          <Text style={styles.scaleLabel}>Scale: {scale.toFixed(2)} pixels/mm</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <MaterialIcons name="close" size={20} color="#F44336" />
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>

        <Pressable
          style={[styles.confirmButton, selectedCorners.length < 4 && styles.buttonDisabled]}
          onPress={handleManualConfirm}
          disabled={selectedCorners.length < 4}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  methodButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  methodDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  previewImageContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  cornerIndicators: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cornerDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  cornerLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scaleInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  scaleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  plateInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
