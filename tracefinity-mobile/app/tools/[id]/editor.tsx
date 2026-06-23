import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../lib/store';
import { getToolById } from '../../../lib/db';
import { MaterialIcons } from '@expo/vector-icons';
import { Canvas, Path, Circle } from 'react-native-skia';

export default function ToolEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<any>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const updateTool = useAppStore((state) => state.updateTool);

  useEffect(() => {
    const load = async () => {
      if (id) {
        try {
          const t = await getToolById(id);
          if (t) {
            setTool(t);
            setVertices(t.vertices);
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to load tool');
          router.back();
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [id]);

  const buildPath = () => {
    if (vertices.length < 2) return '';

    let path = `M ${vertices[0][0]} ${vertices[0][1]}`;
    for (let i = 1; i < vertices.length; i++) {
      path += ` L ${vertices[i][0]} ${vertices[i][1]}`;
    }
    path += ' Z';

    return path;
  };

  const handleSave = async () => {
    if (!tool) return;

    try {
      setLoading(true);
      await updateTool(tool.id, { vertices });
      setUnsavedChanges(false);
      Alert.alert('Saved', 'Tool updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save tool');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVertex = () => {
    const cx = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length;
    const cy = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
    const newVertices = [...vertices, [cx, cy] as [number, number]];
    setVertices(newVertices);
    setUnsavedChanges(true);
  };

  const handleDeleteVertex = (idx: number) => {
    if (vertices.length <= 3) {
      Alert.alert('Cannot delete', 'Tool must have at least 3 vertices');
      return;
    }
    const newVertices = vertices.filter((_, i) => i !== idx);
    setVertices(newVertices);
    setSelectedIdx(null);
    setUnsavedChanges(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!tool) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Tool not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.toolName}>{tool.name}</Text>
        {unsavedChanges && <Text style={styles.unsavedBadge}>● Unsaved</Text>}
      </View>

      <Canvas style={styles.canvas}>
        {/* Draw polygon */}
        <Path path={buildPath()} stroke="#007AFF" strokeWidth={2} fill="none" />

        {/* Draw vertices */}
        {vertices.map((v, idx) => (
          <Circle
            key={idx}
            cx={v[0]}
            cy={v[1]}
            r={selectedIdx === idx ? 8 : 5}
            color={selectedIdx === idx ? '#FF6B6B' : '#007AFF'}
          />
        ))}
      </Canvas>

      <View style={styles.controls}>
        <Pressable
          style={styles.button}
          onPress={handleAddVertex}
        >
          <MaterialIcons name="add-circle" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>Add Vertex</Text>
        </Pressable>

        {selectedIdx !== null && (
          <Pressable
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDeleteVertex(selectedIdx)}
          >
            <MaterialIcons name="delete" size={20} color="#ff6b6b" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={!unsavedChanges}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-between',
  },
  toolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  unsavedBadge: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#ffecec',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
