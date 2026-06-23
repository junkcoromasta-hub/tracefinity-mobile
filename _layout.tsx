import { create } from 'zustand';
import * as db from './db';
import { Tool, Bin, Project, Photo, AppState } from './types';
import { v4 as uuidv4 } from 'react-native-uuid';

export const useAppStore = create<AppState>((set, get) => ({
  tools: [],
  bins: [],
  projects: [],
  currentPhoto: null,
  selectedTool: null,
  selectedBin: null,

  // Tools
  addTool: async (tool: Tool) => {
    try {
      const newTool = {
        ...tool,
        id: tool.id || (uuidv4() as string),
        createdAt: tool.createdAt || new Date().toISOString(),
      };
      await db.saveTool(newTool);
      set((state) => ({ tools: [newTool, ...state.tools] }));
    } catch (error) {
      console.error('Error adding tool:', error);
      throw error;
    }
  },

  updateTool: async (id: string, updates: Partial<Tool>) => {
    try {
      await db.updateTool(id, updates);
      set((state) => ({
        tools: state.tools.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  },

  deleteTool: async (id: string) => {
    try {
      await db.deleteTool(id);
      set((state) => ({
        tools: state.tools.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting tool:', error);
      throw error;
    }
  },

  // Bins
  addBin: async (bin: Bin) => {
    try {
      const newBin = {
        ...bin,
        id: bin.id || (uuidv4() as string),
        createdAt: bin.createdAt || new Date().toISOString(),
      };
      await db.saveBin(newBin);
      set((state) => ({ bins: [newBin, ...state.bins] }));
    } catch (error) {
      console.error('Error adding bin:', error);
      throw error;
    }
  },

  updateBin: async (id: string, updates: Partial<Bin>) => {
    try {
      await db.updateBin(id, updates);
      set((state) => ({
        bins: state.bins.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    } catch (error) {
      console.error('Error updating bin:', error);
      throw error;
    }
  },

  deleteBin: async (id: string) => {
    try {
      await db.deleteBin(id);
      set((state) => ({
        bins: state.bins.filter((b) => b.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting bin:', error);
      throw error;
    }
  },

  // Projects
  addProject: async (project: Project) => {
    try {
      const newProject = {
        ...project,
        id: project.id || (uuidv4() as string),
        createdAt: project.createdAt || new Date().toISOString(),
      };
      await db.saveProject(newProject);
      set((state) => ({ projects: [newProject, ...state.projects] }));
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    try {
      const state = get();
      const project = state.projects.find((p) => p.id === id);
      if (project) {
        await db.saveProject({ ...project, ...updates });
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    try {
      await db.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // UI state
  setCurrentPhoto: (photo: Photo | null) => {
    set({ currentPhoto: photo });
  },

  setSelectedTool: (tool: Tool | null) => {
    set({ selectedTool: tool });
  },

  setSelectedBin: (bin: Bin | null) => {
    set({ selectedBin: bin });
  },

  // Load from DB
  loadFromDB: async () => {
    try {
      const [tools, bins, projects] = await Promise.all([
        db.getTools(),
        db.getBins(),
        db.getProjects(),
      ]);
      set({ tools, bins, projects });
    } catch (error) {
      console.error('Error loading from DB:', error);
      throw error;
    }
  },
}));
