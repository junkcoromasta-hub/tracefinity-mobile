import * as FileSystem from 'expo-file-system';
import { Tool, Bin } from './types';

// Gridfinity grid constant: 42mm per unit
const GRIDFINITY_UNIT = 42;

interface Triangle {
  normal: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  v3: [number, number, number];
}

export async function generateToolSTL(
  tool: Tool,
  wallThickness: number = 2,
  height: number = 10
): Promise<Uint8Array> {
  const triangles: Triangle[] = [];

  // Extrude 2D polygon to 3D walls
  const vertices = tool.vertices;

  // Bottom face
  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];

    // Inner triangle
    triangles.push({
      normal: [0, 0, -1],
      v1: [x1, y1, 0],
      v2: [x2, y2, 0],
      v3: [(x1 + x2) / 2, (y1 + y2) / 2, 0],
    });
  }

  // Top face (offset up)
  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];

    triangles.push({
      normal: [0, 0, 1],
      v1: [x1, y1, height],
      v2: [(x1 + x2) / 2, (y1 + y2) / 2, height],
      v3: [x2, y2, height],
    });
  }

  // Walls
  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];

    // Quad as two triangles
    // Bottom-inner, bottom-outer, top-inner
    triangles.push({
      normal: normalFromPoints([x1, y1, 0], [x2, y2, 0], [x1, y1, height]),
      v1: [x1, y1, 0],
      v2: [x2, y2, 0],
      v3: [x1, y1, height],
    });

    // Bottom-outer, top-outer, top-inner
    triangles.push({
      normal: normalFromPoints([x2, y2, 0], [x2, y2, height], [x1, y1, height]),
      v1: [x2, y2, 0],
      v2: [x2, y2, height],
      v3: [x1, y1, height],
    });
  }

  return trianglesToBinarySTL(triangles, tool.name);
}

export async function generateBinSTL(
  bin: Bin,
  tools: Map<string, Tool>
): Promise<Uint8Array> {
  const triangles: Triangle[] = [];

  // Gridfinity base
  const width = bin.width * GRIDFINITY_UNIT;
  const height = bin.height * GRIDFINITY_UNIT;
  const baseHeight = bin.baseHeight;

  // Generate base with magnet holes
  generateGridfinityBase(width, height, baseHeight, bin.wallThickness, triangles);

  // Add tool pockets
  for (const placement of bin.tools) {
    const tool = tools.get(placement.toolId);
    if (tool) {
      const x = placement.x * GRIDFINITY_UNIT + width / 2;
      const y = placement.y * GRIDFINITY_UNIT + height / 2;

      // Extrude tool shape as pocket
      extrudeToolPocket(tool.vertices, x, y, placement.rotation, baseHeight, triangles);
    }
  }

  return trianglesToBinarySTL(triangles, bin.name);
}

function generateGridfinityBase(
  width: number,
  height: number,
  baseHeight: number,
  wallThickness: number,
  triangles: Triangle[]
): void {
  // Simple rectangular base
  const depth = baseHeight;

  // Bottom
  addQuad(
    triangles,
    [0, 0, 0],
    [width, 0, 0],
    [width, height, 0],
    [0, height, 0]
  );

  // Top
  addQuad(
    triangles,
    [0, 0, depth],
    [0, height, depth],
    [width, height, depth],
    [width, 0, depth]
  );

  // Walls
  // Front
  addQuad(
    triangles,
    [0, 0, 0],
    [width, 0, 0],
    [width, 0, depth],
    [0, 0, depth]
  );

  // Back
  addQuad(
    triangles,
    [0, height, 0],
    [0, height, depth],
    [width, height, depth],
    [width, height, 0]
  );

  // Left
  addQuad(
    triangles,
    [0, 0, 0],
    [0, 0, depth],
    [0, height, depth],
    [0, height, 0]
  );

  // Right
  addQuad(
    triangles,
    [width, 0, 0],
    [width, height, 0],
    [width, height, depth],
    [width, 0, depth]
  );
}

function extrudeToolPocket(
  vertices: [number, number][],
  offsetX: number,
  offsetY: number,
  rotation: number,
  baseZ: number,
  triangles: Triangle[],
  pocketHeight: number = 8
): void {
  // Apply offset and rotation
  const rotatedVerts = vertices.map(([x, y]) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return [offsetX + rx, offsetY + ry] as [number, number];
  });

  // Bottom of pocket
  for (let i = 0; i < rotatedVerts.length; i++) {
    const [x1, y1] = rotatedVerts[i];
    const [x2, y2] = rotatedVerts[(i + 1) % rotatedVerts.length];

    triangles.push({
      normal: [0, 0, -1],
      v1: [x1, y1, baseZ],
      v2: [x2, y2, baseZ],
      v3: [(x1 + x2) / 2, (y1 + y2) / 2, baseZ],
    });
  }

  // Walls of pocket
  for (let i = 0; i < rotatedVerts.length; i++) {
    const [x1, y1] = rotatedVerts[i];
    const [x2, y2] = rotatedVerts[(i + 1) % rotatedVerts.length];

    triangles.push({
      normal: normalFromPoints([x1, y1, baseZ], [x2, y2, baseZ], [x1, y1, baseZ + pocketHeight]),
      v1: [x1, y1, baseZ],
      v2: [x2, y2, baseZ],
      v3: [x1, y1, baseZ + pocketHeight],
    });

    triangles.push({
      normal: normalFromPoints([x2, y2, baseZ], [x2, y2, baseZ + pocketHeight], [x1, y1, baseZ + pocketHeight]),
      v1: [x2, y2, baseZ],
      v2: [x2, y2, baseZ + pocketHeight],
      v3: [x1, y1, baseZ + pocketHeight],
    });
  }
}

function addQuad(
  triangles: Triangle[],
  v1: [number, number, number],
  v2: [number, number, number],
  v3: [number, number, number],
  v4: [number, number, number]
): void {
  const normal = normalFromPoints(v1, v2, v3);
  triangles.push({ normal, v1, v2, v3 });
  triangles.push({ normal, v1: v3, v2: v4, v3: v1 });
}

function normalFromPoints(
  v1: [number, number, number],
  v2: [number, number, number],
  v3: [number, number, number]
): [number, number, number] {
  const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]] as [number, number, number];
  const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]] as [number, number, number];

  const normal = [
    edge1[1] * edge2[2] - edge1[2] * edge2[1],
    edge1[2] * edge2[0] - edge1[0] * edge2[2],
    edge1[0] * edge2[1] - edge1[1] * edge2[0],
  ] as [number, number, number];

  const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
  if (len > 0) {
    return [normal[0] / len, normal[1] / len, normal[2] / len];
  }
  return [0, 0, 1];
}

function trianglesToBinarySTL(triangles: Triangle[], name: string): Uint8Array {
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Header (80 bytes)
  const header = new TextEncoder().encode(name.substring(0, 80).padEnd(80));
  uint8.set(header);

  // Triangle count (4 bytes, little-endian)
  view.setUint32(80, triangles.length, true);

  // Triangles
  let offset = 84;
  for (const tri of triangles) {
    // Normal (3 × float32)
    view.setFloat32(offset, tri.normal[0], true);
    offset += 4;
    view.setFloat32(offset, tri.normal[1], true);
    offset += 4;
    view.setFloat32(offset, tri.normal[2], true);
    offset += 4;

    // Vertices (3 vertices × 3 coords × float32)
    for (const vertex of [tri.v1, tri.v2, tri.v3]) {
      view.setFloat32(offset, vertex[0], true);
      offset += 4;
      view.setFloat32(offset, vertex[1], true);
      offset += 4;
      view.setFloat32(offset, vertex[2], true);
      offset += 4;
    }

    // Attribute byte count (uint16)
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return uint8;
}

export async function saveSTLFile(data: Uint8Array, filename: string): Promise<string> {
  const filePath = `${FileSystem.documentDirectory}${filename}.stl`;
  const base64 = Buffer.from(data).toString('base64');
  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return filePath;
}
