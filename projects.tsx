import {
  View,
  FlatList,
  Pressable,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../../lib/store';
import { useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function BinsScreen() {
  const bins = useAppStore((state) => state.bins);
  const deleteBin = useAppStore((state) => state.deleteBin);
  const loadFromDB = useAppStore((state) => state.loadFromDB);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await loadFromDB();
        } catch (error) {
          console.error('Error loading bins:', error);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [loadFromDB])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Bin?', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBin(id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete bin');
          }
        },
      },
    ]);
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
      {bins.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="inventory-2" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No bins yet</Text>
          <Text style={styles.emptySubtext}>Create a new bin to organize your tools</Text>
        </View>
      ) : (
        <FlatList
          data={bins}
          keyExtractor={(b) => b.id}
          renderItem={({ item: bin }) => (
            <Pressable
              style={styles.binCard}
              onPress={() => router.push(`/bins/${bin.id}/layout`)}
            >
              <View style={styles.binInfo}>
                <Text style={styles.binName}>{bin.name}</Text>
                <Text style={styles.binMeta}>
                  {bin.width}×{bin.height} units • {bin.tools.length} tools
                </Text>
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(bin.id, bin.name)}
              >
                <MaterialIcons name="delete" size={20} color="#ff6b6b" />
              </Pressable>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => {
          // Create new bin
          const newBin = {
            id: '',
            name: 'New Bin',
            tools: [],
            width: 3,
            height: 3,
            wallThickness: 2,
            baseHeight: 10,
            createdAt: new Date().toISOString(),
          };
          router.push({
            pathname: '/bins/[id]/layout',
            params: { id: 'new' },
          });
        }}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
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
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  binCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  binInfo: {
    flex: 1,
  },
  binName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  binMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});
