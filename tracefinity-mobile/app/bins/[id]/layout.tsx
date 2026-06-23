import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../lib/store';
import { getBinById } from '../../../lib/db';
import { generateToolSTL, generateBinSTL, saveSTLFile } from '../../../lib/stl';
import { MaterialIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'react-native-uuid';

export default function BinLayoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bin, setBin] = useState<any>(null);
  const [binName, setBinName] = useState('');
  const [width, setWidth] = useState('3');
  const [height, setHeight] = useState('3');
  const [wallThickness, setWallThickness] = useState('2');

  const tools = useAppStore((state) => state.tools);
  const addBin = useAppStore((state) => state.addBin);
  const updateBin = useAppStore((state) => state.updateBin);

  useEffect(() => {
    const load = async () => {
      if (id && id !== 'new') {
        try {
          const b = await getBinById(id);
          if (b) {
            setBin(b);
            setBinName(b.name);
            setWidth(String(b.width));
            setHeight(String(b.height));
            setWallThickness(String(b.wallThickness));
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to load bin');
          router.back();
        }
      } else {
        setBin({
          id: uuidv4() as string,
          name: 'New Bin',
          tools: [],
          width: 3,
          height: 3,
          wallThickness: 2,
          baseHeight: 10,
          createdAt: new Date().toISOString(),
        });
        setBinName('New Bin');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSaveAndExport = async () => {
    if (!binName.trim()) {
      Alert.alert('Error', 'Please enter a bin name');
      return;
    }

    try {
      setSaving(true);

      const w = Math.max(1, Math.min(10, parseInt(width) || 3));
      const h = Math.max(1, Math.min(10, parseInt(height) || 3));
      const wt = Math.max(0.5, Math.min(5, parseFloat(wallThickness) || 2));

      const updatedBin = {
        ...bin,
        name: binName,
        width: w,
        height: h,
        wallThickness: wt,
      };

      if (id === 'new') {
        await addBin(updatedBin);
      } else if (id) {
        await updateBin(id, updatedBin);
      }

      // Generate STL
      const toolMap = new Map(tools.map((t) => [t.id, t]));
      const stlData = await generateBinSTL(updatedBin, toolMap);
      const filePath = await saveSTLFile(stlData, updatedBin.name);

      Alert.alert(
        'Saved & Exported',
        `Bin saved and STL exported to:\n${filePath}`,
        [
          {
            text: 'Back to Bins',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving bin:', error);
      Alert.alert('Error', 'Failed to save bin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bin Settings</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bin Name</Text>
            <TextInput
              style={styles.input}
              value={binName}
              onChangeText={setBinName}
              placeholder="e.g., Screwdrivers"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>Width (units)</Text>
              <TextInput
                style={styles.input}
                value={width}
                onChangeText={setWidth}
                keyboardType="number-pad"
                placeholder="3"
              />
              <Text style={styles.inputHint}>1-10 units (42mm each)</Text>
            </View>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>Height (units)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="number-pad"
                placeholder="3"
              />
              <Text style={styles.inputHint}>1-10 units</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Wall Thickness (mm)</Text>
            <TextInput
              style={styles.input}
              value={wallThickness}
              onChangeText={setWallThickness}
              keyboardType="decimal-pad"
              placeholder="2"
            />
            <Text style={styles.inputHint}>0.5-5mm recommended</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools in Bin</Text>
          <Text style={styles.sectionDesc}>
            {bin.tools.length} tool{bin.tools.length !== 1 ? 's' : ''} added
          </Text>

          {tools.length === 0 ? (
            <View style={styles.emptyToolsBox}>
              <MaterialIcons name="build-circle" size={40} color="#ccc" />
              <Text style={styles.emptyToolsText}>No tools in library</Text>
              <Text style={styles.emptyToolsSubtext}>
                Add tools before creating a bin
              </Text>
            </View>
          ) : (
            <View style={styles.toolsList}>
              {tools.slice(0, 3).map((tool) => (
                <View key={tool.id} style={styles.toolItem}>
                  <Text style={styles.toolItemName}>{tool.name}</Text>
                  <Text style={styles.toolItemInfo}>{tool.vertices.length} vertices</Text>
                </View>
              ))}
              {tools.length > 3 && (
                <Text style={styles.moreTools}>+{tools.length - 3} more tools available</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <Text style={styles.sectionDesc}>
            Your bin will be exported as an STL file ready for 3D printing
          </Text>
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Fine-tune dimensions here, then export to STL for your 3D printer
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.footerButton, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.footerButton, styles.saveButton]}
          onPress={handleSaveAndExport}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="cloud-download" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save & Export</Text>
            </>
          )}
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
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  emptyToolsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  emptyToolsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginTop: 8,
  },
  emptyToolsSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  toolsList: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toolItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toolItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toolItemInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  moreTools: {
    padding: 12,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    gap: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
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
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
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
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
