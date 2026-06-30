import { Client, Room } from "colyseus";
import {
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SEJM_KLASYCZNY,
  canPlacePlayer,
  clampToWorld,
  randomSpawnInRoom,
  resolveMovement,
} from "@gra/shared";
import { Player, SejmState } from "../schema/SejmState.js";

const MAP = SEJM_KLASYCZNY;
const MAX_STEP = 16;

type MoveMessage = { x: number; y: number };

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

      const boundedTarget = clampToWorld(
        MAP,
        message.x,
        message.y,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
      );
      const stepped = clampStep(player.x, player.y, boundedTarget.x, boundedTarget.y);
      const resolved = resolveMovement(
        MAP,
        player.x,
        player.y,
        stepped.x,
        stepped.y,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
      );

      if (!canPlacePlayer(MAP, resolved.x, resolved.y, PLAYER_WIDTH, PLAYER_HEIGHT)) {
        return;
      }

      player.x = resolved.x;
      player.y = resolved.y;
    });
  }

  onJoin(client: Client, options: { nick?: string }): void {
    const nick =
      typeof options?.nick === "string" && options.nick.trim().length > 0
        ? options.nick.trim().slice(0, 24)
        : `Gracz-${client.sessionId.slice(0, 4)}`;

    const spawn = randomSpawnInRoom(MAP, MAP.spawnRoomId, PLAYER_WIDTH, PLAYER_HEIGHT);

    const player = new Player();
    player.id = client.sessionId;
    player.nick = nick;
    player.x = spawn.x;
    player.y = spawn.y;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
  }
}
