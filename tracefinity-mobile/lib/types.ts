export interface Tool {
  id: string;
  name: string;
  vertices: [number, number][];
  rotation: number;
  scale: number;
  projectId?: string;
  createdAt: string;
}

export interface ToolPlacement {
  toolId: string;
  x: number;
  y: number;
  rotation: number;
  scale?: number;
}

export interface Bin {
  id: string;
  name: string;
  tools: ToolPlacement[];
  width: number; // gridfinity units
  height: number;
  wallThickness: number; // mm
  baseHeight: number; // mm
  projectId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Mask {
  base64: string;
  width: number;
  height: number;
}

export interface Photo {
  id: string;
  uri: string;
  corners: [[number, number], [number, number], [number, number], [number, number]];
  scale: number;
  createdAt: string;
}

export interface AppState {
  tools: Tool[];
  bins: Bin[];
  projects: Project[];
  currentPhoto: Photo | null;
  selectedTool: Tool | null;
  selectedBin: Bin | null;
  
  // Actions
  addTool: (tool: Tool) => Promise<void>;
  updateTool: (id: string, updates: Partial<Tool>) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
  
  addBin: (bin: Bin) => Promise<void>;
  updateBin: (id: string, updates: Partial<Bin>) => Promise<void>;
  deleteBin: (id: string) => Promise<void>;
  
  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  setCurrentPhoto: (photo: Photo | null) => void;
  setSelectedTool: (tool: Tool | null) => void;
  setSelectedBin: (bin: Bin | null) => void;
  
  loadFromDB: () => Promise<void>;
}
