export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 600;
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 32;
export const MOVE_SPEED = 160;
export const INTERPOLATION_MS = 100;

export const SERVER_URL =
  import.meta.env.VITE_COLYSEUS_URL ?? "ws://localhost:2567";
