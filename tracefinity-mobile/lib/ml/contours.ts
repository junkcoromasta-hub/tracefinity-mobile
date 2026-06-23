// Ramer-Douglas-Peucker algorithm for polygon simplification
export function simplifyPolygon(
  points: [number, number][],
  epsilon = 2.0
): [number, number][] {
  if (points.length < 3) return points;

  let maxDist = 0;
  let maxIdx = 0;

  // Find point farthest from line between start and end
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolygon(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPolygon(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const num = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1);
  const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  return den === 0 ? 0 : num / den;
}

// Generate simple geometric contours from pixel coordinates
// This is a simplified version that traces connected black pixels
export function extractContoursFromCoordinates(
  blackPixelCoords: [number, number][]
): Array<[number, number][]> {
  if (blackPixelCoords.length === 0) return [];

  const contours: Array<[number, number][]> = [];
  const visited = new Set<string>();

  // Group nearby pixels into separate contours
  for (const pixel of blackPixelCoords) {
    const key = `${pixel[0]},${pixel[1]}`;
    if (visited.has(key)) continue;

    const contour = floodFillContour(pixel, blackPixelCoords, visited);
    if (contour.length > 5) {
      // Only keep contours with enough points
      const simplified = simplifyPolygon(contour, 1.5);
      if (simplified.length >= 3) {
        contours.push(simplified);
      }
    }
  }

  return contours;
}

function floodFillContour(
  startPixel: [number, number],
  allPixels: [number, number][],
  visited: Set<string>
): [number, number][] {
  const contour: [number, number][] = [];
  const queue: [number, number][] = [startPixel];
  const pixelSet = new Set(allPixels.map((p) => `${p[0]},${p[1]}`));

  while (queue.length > 0) {
    const pixel = queue.shift()!;
    const key = `${pixel[0]},${pixel[1]}`;

    if (visited.has(key)) continue;
    visited.add(key);
    contour.push(pixel);

    // Add neighbors
    const neighbors: [number, number][] = [
      [pixel[0] + 1, pixel[1]],
      [pixel[0] - 1, pixel[1]],
      [pixel[0], pixel[1] + 1],
      [pixel[0], pixel[1] - 1],
    ];

    for (const neighbor of neighbors) {
      const nKey = `${neighbor[0]},${neighbor[1]}`;
      if (pixelSet.has(nKey) && !visited.has(nKey)) {
        queue.push(neighbor);
      }
    }
  }

  return contour;
}

// Generate convex hull for tools (simpler fallback if contour detection fails)
export function generateConvexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  // Graham scan algorithm
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const cross = (o: [number, number], a: [number, number], b: [number, number]) => {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  };

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Detect the 4 corners of the Centauri build plate in an image
// Returns corner coordinates [topLeft, topRight, bottomRight, bottomLeft]
export function detectPlateCorners(
  imageWidth: number,
  imageHeight: number
): [number, number][] | null {
  try {
    // For now, detect corners at image edges (user can manually adjust)
    // In production with actual image data, would detect dark edges of plate
    
    // Assume plate fills most of the frame
    const margin = Math.min(imageWidth, imageHeight) * 0.05; // 5% margin
    
    const corners: [number, number][] = [
      [margin, margin], // top-left
      [imageWidth - margin, margin], // top-right
      [imageWidth - margin, imageHeight - margin], // bottom-right
      [margin, imageHeight - margin], // bottom-left
    ];
    
    return corners;
  } catch (error) {
    console.error('Corner detection failed:', error);
    return null;
  }
}

// Calculate scale (pixels per mm) from detected or selected corners
// corners: [topLeft, topRight, bottomRight, bottomLeft]
export function calculateScaleFromCorners(
  corners: [number, number][],
  plateSizeMm: number = 257 // Centauri plate is 257×257mm
): number {
  if (corners.length !== 4) return 1.0;
  
  // Calculate average distance between corners
  const topLeft = corners[0];
  const topRight = corners[1];
  const bottomRight = corners[2];
  const bottomLeft = corners[3];
  
  // Distance top edge (pixels)
  const topDist = Math.hypot(topRight[0] - topLeft[0], topRight[1] - topLeft[1]);
  
  // Distance left edge (pixels)
  const leftDist = Math.hypot(bottomLeft[0] - topLeft[0], bottomLeft[1] - topLeft[1]);
  
  // Average pixel distance per edge
  const avgPixelDist = (topDist + leftDist) / 2;
  
  // Scale: pixels per mm
  const scale = avgPixelDist / plateSizeMm;
  
  return Math.max(0.1, Math.min(scale, 100)); // Clamp to reasonable values
}

// Mock: Extract contours from a canvas draw
// In real app, this would read actual image pixel data
export function generateMockContours(): Array<[number, number][]> {
  // Generate some simple geometric shapes for testing
  const circle = generateCirclePoints(100, 100, 50, 16);
  const square = generateRectanglePoints(250, 100, 80, 60, 0);
  const polygon = generatePolygonPoints(100, 300, 40, 5);

  return [circle, square, polygon];
}

function generateCirclePoints(
  cx: number,
  cy: number,
  radius: number,
  points: number
): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    result.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return result;
}

function generateRectanglePoints(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): [number, number][] {
  const corners = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ] as [number, number][];

  if (rotation === 0) return corners;

  const cx = x + width / 2;
  const cy = y + height / 2;

  return corners.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos] as [number, number];
  });
}

function generatePolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number
): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    result.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return result;
}
