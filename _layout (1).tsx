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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ToolsScreen() {
  const tools = useAppStore((state) => state.tools);
  const deleteTool = useAppStore((state) => state.deleteTool);
  const loadFromDB = useAppStore((state) => state.loadFromDB);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await loadFromDB();
      } catch (error) {
        console.error('Error loading tools:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadFromDB]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Tool?', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTool(id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete tool');
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
      {tools.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="build" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No tools yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first tool</Text>
        </View>
      ) : (
        <FlatList
          data={tools}
          keyExtractor={(t) => t.id}
          renderItem={({ item: tool }) => (
            <Pressable
              style={styles.toolCard}
              onPress={() => router.push(`/tools/${tool.id}/editor`)}
            >
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolMeta}>{tool.vertices.length} vertices</Text>
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(tool.id, tool.name)}
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
        onPress={() => router.push('/camera')}
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
  toolCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toolMeta: {
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
