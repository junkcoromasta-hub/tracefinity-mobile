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
import { MaterialIcons } from '@expo/vector-icons';

export default function ProjectsScreen() {
  const projects = useAppStore((state) => state.projects);
  const loadFromDB = useAppStore((state) => state.loadFromDB);
  const addProject = useAppStore((state) => state.addProject);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await loadFromDB();
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadFromDB]);

  const handleNewProject = () => {
    Alert.prompt(
      'New Project',
      'Enter project name',
      async (name) => {
        if (name) {
          try {
            await addProject({
              id: '',
              name,
              createdAt: new Date().toISOString(),
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to create project');
          }
        }
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Project?', `Delete "${name}" and all its tools/bins?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete project');
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
      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="folder-open" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>Organize your tools and bins into projects</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item: project }) => (
            <Pressable
              style={styles.projectCard}
            >
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{project.name}</Text>
                {project.description && (
                  <Text style={styles.projectDesc}>{project.description}</Text>
                )}
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(project.id, project.name)}
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
        onPress={handleNewProject}
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
  projectCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  projectDesc: {
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
