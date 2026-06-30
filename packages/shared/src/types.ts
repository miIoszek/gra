export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomDef extends Rect {
  id: string;
  name: string;
  floorColor: number;
}

export interface CorridorDef extends Rect {
  id: string;
}

export interface GameMap {
  id: string;
  name: string;
  worldWidth: number;
  worldHeight: number;
  tileSize: number;
  spawnRoomId: string;
  rooms: RoomDef[];
  corridors: CorridorDef[];
  walkable: Uint8Array;
  walkableCols: number;
  walkableRows: number;
  wallRects: Rect[];
}
