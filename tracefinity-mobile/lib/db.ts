import * as SQLite from 'expo-sqlite';
import { Tool, Bin, Project, Photo } from './types';
import { v4 as uuidv4 } from 'react-native-uuid';

const db = SQLite.openDatabaseSync('tracefinity.db');

export async function initDb() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        vertices TEXT NOT NULL,
        rotation REAL DEFAULT 0,
        scale REAL DEFAULT 1,
        projectId TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tools TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        wallThickness REAL DEFAULT 2,
        baseHeight REAL DEFAULT 10,
        projectId TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        uri TEXT NOT NULL,
        corners TEXT NOT NULL,
        scale REAL NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tools_projectId ON tools(projectId);
      CREATE INDEX IF NOT EXISTS idx_bins_projectId ON bins(projectId);
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
}

// Tools
export async function saveTool(tool: Tool): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO tools (id, name, vertices, rotation, scale, projectId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tool.id,
        tool.name,
        JSON.stringify(tool.vertices),
        tool.rotation,
        tool.scale,
        tool.projectId || null,
        tool.createdAt,
      ]
    );
  } catch (error) {
    console.error('Error saving tool:', error);
    throw error;
  }
}

export async function updateTool(id: string, updates: Partial<Tool>): Promise<void> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.vertices !== undefined) {
      setClauses.push('vertices = ?');
      values.push(JSON.stringify(updates.vertices));
    }
    if (updates.rotation !== undefined) {
      setClauses.push('rotation = ?');
      values.push(updates.rotation);
    }
    if (updates.scale !== undefined) {
      setClauses.push('scale = ?');
      values.push(updates.scale);
    }

    if (setClauses.length === 0) return;

    values.push(id);
    const query = `UPDATE tools SET ${setClauses.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  } catch (error) {
    console.error('Error updating tool:', error);
    throw error;
  }
}

export async function deleteTool(id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM tools WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting tool:', error);
    throw error;
  }
}

export async function getTools(): Promise<Tool[]> {
  try {
    const result = await db.getAllAsync('SELECT * FROM tools ORDER BY createdAt DESC');
    return result.map((row: any) => ({
      ...row,
      vertices: JSON.parse(row.vertices),
    }));
  } catch (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
}

export async function getToolById(id: string): Promise<Tool | null> {
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM tools WHERE id = ?',
      [id]
    ) as any;
    if (!result) return null;
    return {
      ...result,
      vertices: JSON.parse(result.vertices),
    };
  } catch (error) {
    console.error('Error fetching tool:', error);
    return null;
  }
}

// Bins
export async function saveBin(bin: Bin): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO bins (id, name, tools, width, height, wallThickness, baseHeight, projectId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bin.id,
        bin.name,
        JSON.stringify(bin.tools),
        bin.width,
        bin.height,
        bin.wallThickness,
        bin.baseHeight,
        bin.projectId || null,
        bin.createdAt,
      ]
    );
  } catch (error) {
    console.error('Error saving bin:', error);
    throw error;
  }
}

export async function updateBin(id: string, updates: Partial<Bin>): Promise<void> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.tools !== undefined) {
      setClauses.push('tools = ?');
      values.push(JSON.stringify(updates.tools));
    }
    if (updates.width !== undefined) {
      setClauses.push('width = ?');
      values.push(updates.width);
    }
    if (updates.height !== undefined) {
      setClauses.push('height = ?');
      values.push(updates.height);
    }
    if (updates.wallThickness !== undefined) {
      setClauses.push('wallThickness = ?');
      values.push(updates.wallThickness);
    }
    if (updates.baseHeight !== undefined) {
      setClauses.push('baseHeight = ?');
      values.push(updates.baseHeight);
    }

    if (setClauses.length === 0) return;

    values.push(id);
    const query = `UPDATE bins SET ${setClauses.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  } catch (error) {
    console.error('Error updating bin:', error);
    throw error;
  }
}

export async function deleteBin(id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM bins WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting bin:', error);
    throw error;
  }
}

export async function getBins(): Promise<Bin[]> {
  try {
    const result = await db.getAllAsync('SELECT * FROM bins ORDER BY createdAt DESC');
    return result.map((row: any) => ({
      ...row,
      tools: JSON.parse(row.tools),
    }));
  } catch (error) {
    console.error('Error fetching bins:', error);
    return [];
  }
}

export async function getBinById(id: string): Promise<Bin | null> {
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM bins WHERE id = ?',
      [id]
    ) as any;
    if (!result) return null;
    return {
      ...result,
      tools: JSON.parse(result.tools),
    };
  } catch (error) {
    console.error('Error fetching bin:', error);
    return null;
  }
}

// Projects
export async function saveProject(project: Project): Promise<void> {
  try {
    await db.runAsync(
      'INSERT INTO projects (id, name, description, createdAt) VALUES (?, ?, ?, ?)',
      [project.id, project.name, project.description || null, project.createdAt]
    );
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const result = await db.getAllAsync('SELECT * FROM projects ORDER BY createdAt DESC');
    return result as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// Photos
export async function savePhoto(photo: Photo): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO photos (id, uri, corners, scale, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [
        photo.id,
        photo.uri,
        JSON.stringify(photo.corners),
        photo.scale,
        photo.createdAt,
      ]
    );
  } catch (error) {
    console.error('Error saving photo:', error);
    throw error;
  }
}

export async function getPhotos(): Promise<Photo[]> {
  try {
    const result = await db.getAllAsync('SELECT * FROM photos ORDER BY createdAt DESC LIMIT 20');
    return result.map((row: any) => ({
      ...row,
      corners: JSON.parse(row.corners),
    }));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM photos WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}
