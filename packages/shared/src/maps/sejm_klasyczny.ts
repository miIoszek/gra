import type { CorridorDef, GameMap, Rect, RoomDef } from "../types.js";

export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 32;

const TILE = 16;
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1100;

const ROOMS: RoomDef[] = [
  {
    id: "sala_plenarna",
    name: "Sala Plenarna",
    x: 560,
    y: 300,
    width: 480,
    height: 320,
    floorColor: 0x2d4a3e,
  },
  {
    id: "archiwum",
    name: "Archiwum",
    x: 670,
    y: 40,
    width: 260,
    height: 150,
    floorColor: 0x3d3d5c,
  },
  {
    id: "sala_komisji",
    name: "Sala Komisji",
    x: 40,
    y: 380,
    width: 260,
    height: 220,
    floorColor: 0x4a3d2d,
  },
  {
    id: "gabinet_marszalka",
    name: "Gabinet Marszałka",
    x: 1300,
    y: 380,
    width: 260,
    height: 200,
    floorColor: 0x5c3d4a,
  },
  {
    id: "kuluary",
    name: "Kuluary",
    x: 40,
    y: 740,
    width: 260,
    height: 220,
    floorColor: 0x4a4a4a,
  },
  {
    id: "lobby",
    name: "Lobby z choinką",
    x: 1040,
    y: 740,
    width: 280,
    height: 220,
    floorColor: 0x2d5c4a,
  },
  {
    id: "bufet",
    name: "Bufet sejmowy",
    x: 1090,
    y: 990,
    width: 220,
    height: 100,
    floorColor: 0x5c4a2d,
  },
];

const CORRIDORS: CorridorDef[] = [
  { id: "corr_n", x: 760, y: 190, width: 80, height: 110 },
  { id: "corr_w", x: 300, y: 460, width: 260, height: 80 },
  { id: "corr_e", x: 1040, y: 460, width: 260, height: 80 },
  { id: "corr_s", x: 760, y: 620, width: 80, height: 90 },
  { id: "corr_sw", x: 120, y: 620, width: 80, height: 120 },
  { id: "corr_junction", x: 300, y: 700, width: 580, height: 80 },
  { id: "corr_se", x: 1180, y: 620, width: 80, height: 120 },
  { id: "corr_bufet", x: 1160, y: 960, width: 80, height: 30 },
];

function fillRect(grid: Uint8Array, cols: number, rect: Rect): void {
  const startCol = Math.max(0, Math.floor(rect.x / TILE));
  const endCol = Math.min(cols - 1, Math.floor((rect.x + rect.width - 1) / TILE));
  const startRow = Math.max(0, Math.floor(rect.y / TILE));
  const endRow = Math.min(
    Math.ceil(WORLD_HEIGHT / TILE) - 1,
    Math.floor((rect.y + rect.height - 1) / TILE),
  );

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      grid[row * cols + col] = 1;
    }
  }
}

function buildWalkableGrid(): { grid: Uint8Array; cols: number; rows: number } {
  const cols = Math.ceil(WORLD_WIDTH / TILE);
  const rows = Math.ceil(WORLD_HEIGHT / TILE);
  const grid = new Uint8Array(cols * rows);

  for (const room of ROOMS) {
    fillRect(grid, cols, room);
  }
  for (const corridor of CORRIDORS) {
    fillRect(grid, cols, corridor);
  }

  return { grid, cols, rows };
}

function buildWallRects(
  grid: Uint8Array,
  cols: number,
  rows: number,
): Rect[] {
  const walls: Rect[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const walkable = grid[row * cols + col] === 1;
      if (walkable) {
        continue;
      }

      const neighbors = [
        row > 0 ? grid[(row - 1) * cols + col] : 0,
        row < rows - 1 ? grid[(row + 1) * cols + col] : 0,
        col > 0 ? grid[row * cols + (col - 1)] : 0,
        col < cols - 1 ? grid[row * cols + (col + 1)] : 0,
      ];

      if (neighbors.some((value) => value === 1)) {
        walls.push({
          x: col * TILE,
          y: row * TILE,
          width: TILE,
          height: TILE,
        });
      }
    }
  }

  return walls;
}

const { grid, cols, rows } = buildWalkableGrid();

export const SEJM_KLASYCZNY: GameMap = {
  id: "sejm_klasyczny",
  name: "Sejm klasyczny",
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  tileSize: TILE,
  spawnRoomId: "sala_plenarna",
  rooms: ROOMS,
  corridors: CORRIDORS,
  walkable: grid,
  walkableCols: cols,
  walkableRows: rows,
  wallRects: buildWallRects(grid, cols, rows),
};

export function getRoomById(map: GameMap, roomId: string): RoomDef | undefined {
  return map.rooms.find((room) => room.id === roomId);
}

function tileIndex(map: GameMap, x: number, y: number): number {
  const col = Math.floor(x / map.tileSize);
  const row = Math.floor(y / map.tileSize);
  if (col < 0 || row < 0 || col >= map.walkableCols || row >= map.walkableRows) {
    return -1;
  }
  return row * map.walkableCols + col;
}

function isTileWalkable(map: GameMap, x: number, y: number): boolean {
  const index = tileIndex(map, x, y);
  if (index < 0) {
    return false;
  }
  return map.walkable[index] === 1;
}

export function canPlacePlayer(
  map: GameMap,
  x: number,
  y: number,
  playerWidth = PLAYER_WIDTH,
  playerHeight = PLAYER_HEIGHT,
): boolean {
  const samplePoints = [
    [x + 2, y + 2],
    [x + playerWidth - 3, y + 2],
    [x + 2, y + playerHeight - 3],
    [x + playerWidth - 3, y + playerHeight - 3],
    [x + playerWidth / 2, y + playerHeight / 2],
  ] as const;

  return samplePoints.every(([px, py]) => isTileWalkable(map, px, py));
}

export function clampToWorld(
  map: GameMap,
  x: number,
  y: number,
  playerWidth = PLAYER_WIDTH,
  playerHeight = PLAYER_HEIGHT,
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, map.worldWidth - playerWidth)),
    y: Math.max(0, Math.min(y, map.worldHeight - playerHeight)),
  };
}

export function resolveMovement(
  map: GameMap,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  playerWidth = PLAYER_WIDTH,
  playerHeight = PLAYER_HEIGHT,
): { x: number; y: number } {
  const target = clampToWorld(map, toX, toY, playerWidth, playerHeight);

  if (canPlacePlayer(map, target.x, target.y, playerWidth, playerHeight)) {
    return target;
  }

  const slideX = clampToWorld(map, target.x, fromY, playerWidth, playerHeight);
  if (canPlacePlayer(map, slideX.x, slideX.y, playerWidth, playerHeight)) {
    return slideX;
  }

  const slideY = clampToWorld(map, fromX, target.y, playerWidth, playerHeight);
  if (canPlacePlayer(map, slideY.x, slideY.y, playerWidth, playerHeight)) {
    return slideY;
  }

  return { x: fromX, y: fromY };
}

export function randomSpawnInRoom(
  map: GameMap,
  roomId: string,
  playerWidth = PLAYER_WIDTH,
  playerHeight = PLAYER_HEIGHT,
): { x: number; y: number } {
  const room = getRoomById(map, roomId);
  if (!room) {
    return { x: 100, y: 100 };
  }

  const inset = 24;
  const minX = room.x + inset;
  const minY = room.y + inset;
  const maxX = room.x + room.width - inset - playerWidth;
  const maxY = room.y + room.height - inset - playerHeight;

  for (let attempt = 0; attempt < 40; attempt++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    if (canPlacePlayer(map, x, y, playerWidth, playerHeight)) {
      return { x, y };
    }
  }

  return {
    x: room.x + room.width / 2 - playerWidth / 2,
    y: room.y + room.height / 2 - playerHeight / 2,
  };
}
