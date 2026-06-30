import { Client, Room } from "colyseus";
import { Player, SejmState } from "../schema/SejmState.js";

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 32;
const MAX_STEP = 16;

type MoveMessage = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(x, 0, WORLD_WIDTH - PLAYER_WIDTH),
    y: clamp(y, 0, WORLD_HEIGHT - PLAYER_HEIGHT),
  };
}

function clampStep(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
): { x: number; y: number } {
  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.hypot(dx, dy);

  if (distance <= MAX_STEP || distance === 0) {
    return { x: targetX, y: targetY };
  }

  const ratio = MAX_STEP / distance;
  return {
    x: currentX + dx * ratio,
    y: currentY + dy * ratio,
  };
}

export class SejmRoom extends Room<{ state: SejmState }> {
  maxClients = 32;
  state = new SejmState();

  onCreate(): void {
    this.onMessage("move", (client: Client, message: MoveMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        return;
      }

      if (
        typeof message?.x !== "number" ||
        typeof message?.y !== "number" ||
        !Number.isFinite(message.x) ||
        !Number.isFinite(message.y)
      ) {
        return;
      }

      const clampedTarget = clampPosition(message.x, message.y);
      const next = clampStep(player.x, player.y, clampedTarget.x, clampedTarget.y);

      player.x = next.x;
      player.y = next.y;
    });
  }

  onJoin(client: Client, options: { nick?: string }): void {
    const nick =
      typeof options?.nick === "string" && options.nick.trim().length > 0
        ? options.nick.trim().slice(0, 24)
        : `Gracz-${client.sessionId.slice(0, 4)}`;

    const spawnX = Math.random() * (WORLD_WIDTH - PLAYER_WIDTH);
    const spawnY = Math.random() * (WORLD_HEIGHT - PLAYER_HEIGHT);

    const player = new Player();
    player.id = client.sessionId;
    player.nick = nick;
    player.x = spawnX;
    player.y = spawnY;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
  }
}
