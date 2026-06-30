import Phaser from "phaser";
import { Room, getStateCallbacks } from "@colyseus/sdk";
import {
  INTERPOLATION_MS,
  MOVE_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../config";

const LOCAL_COLOR = 0x4ecca3;
const REMOTE_COLOR = 0x3498db;

interface PlayerState {
  id: string;
  nick: string;
  x: number;
  y: number;
}

interface RenderPlayer {
  id: string;
  nick: string;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  renderX: number;
  renderY: number;
  targetX: number;
  targetY: number;
  lastUpdateAt: number;
}

export class GameScene extends Phaser.Scene {
  private room!: Room;
  private players = new Map<string, RenderPlayer>();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private localSessionId = "";
  private lastMoveSentAt = 0;
  private desiredX = 0;
  private desiredY = 0;

  constructor() {
    super("GameScene");
  }

  init(data: { room: Room }): void {
    this.room = data.room;
    this.localSessionId = this.room.sessionId;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0f3460");
    this.add
      .rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x16213e)
      .setStrokeStyle(2, 0x533483);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.scale.resize(WORLD_WIDTH, WORLD_HEIGHT);

    if (this.room.state) {
      this.setupPlayers();
      return;
    }

    this.room.onStateChange.once(() => {
      this.setupPlayers();
    });
  }

  private setupPlayers(): void {
    const $ = getStateCallbacks(this.room);
    const players = (this.room.state as { players: Map<string, PlayerState> }).players;

    const localPlayer = players.get(this.localSessionId);
    if (localPlayer) {
      this.desiredX = localPlayer.x;
      this.desiredY = localPlayer.y;
    }

    $(this.room.state).players.onAdd((player: PlayerState, sessionId: string) => {
      this.addPlayer(sessionId, player);

      $(player).listen("x", () => {
        this.syncPlayerTarget(sessionId, player);
      });
      $(player).listen("y", () => {
        this.syncPlayerTarget(sessionId, player);
      });
      $(player).listen("nick", () => {
        const entry = this.players.get(sessionId);
        if (entry) {
          entry.label.setText(player.nick);
        }
      });
    });

    $(this.room.state).players.onRemove((_player: PlayerState, sessionId: string) => {
      this.removePlayer(sessionId);
    });
  }

  update(_time: number, delta: number): void {
    this.handleLocalInput(delta);
    this.interpolateRemotePlayers();
  }

  private addPlayer(sessionId: string, player: PlayerState): void {
    if (this.players.has(sessionId)) {
      return;
    }

    const isLocal = sessionId === this.localSessionId;
    const color = isLocal ? LOCAL_COLOR : REMOTE_COLOR;

    const rect = this.add.rectangle(
      player.x + PLAYER_WIDTH / 2,
      player.y + PLAYER_HEIGHT / 2,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      color,
    );

    const label = this.add
      .text(player.x + PLAYER_WIDTH / 2, player.y - 8, player.nick, {
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 1);

    this.players.set(sessionId, {
      id: sessionId,
      nick: player.nick,
      rect,
      label,
      renderX: player.x,
      renderY: player.y,
      targetX: player.x,
      targetY: player.y,
      lastUpdateAt: performance.now(),
    });
  }

  private removePlayer(sessionId: string): void {
    const entry = this.players.get(sessionId);
    if (!entry) {
      return;
    }

    entry.rect.destroy();
    entry.label.destroy();
    this.players.delete(sessionId);
  }

  private syncPlayerTarget(sessionId: string, player: PlayerState): void {
    const entry = this.players.get(sessionId);
    if (!entry) {
      return;
    }

    if (sessionId === this.localSessionId) {
      this.desiredX = player.x;
      this.desiredY = player.y;
      entry.renderX = player.x;
      entry.renderY = player.y;
      entry.targetX = player.x;
      entry.targetY = player.y;
      this.updatePlayerVisual(entry);
      return;
    }

    entry.targetX = player.x;
    entry.targetY = player.y;
    entry.lastUpdateAt = performance.now();
    entry.nick = player.nick;
    entry.label.setText(player.nick);
  }

  private handleLocalInput(delta: number): void {
    const local = this.players.get(this.localSessionId);
    if (!local) {
      return;
    }

    let dx = 0;
    let dy = 0;

    if (this.cursors.left?.isDown) dx -= 1;
    if (this.cursors.right?.isDown) dx += 1;
    if (this.cursors.up?.isDown) dy -= 1;
    if (this.cursors.down?.isDown) dy += 1;

    if (dx === 0 && dy === 0) {
      return;
    }

    const length = Math.hypot(dx, dy) || 1;
    const step = (MOVE_SPEED * delta) / 1000;

    this.desiredX = Phaser.Math.Clamp(
      this.desiredX + (dx / length) * step,
      0,
      WORLD_WIDTH - PLAYER_WIDTH,
    );
    this.desiredY = Phaser.Math.Clamp(
      this.desiredY + (dy / length) * step,
      0,
      WORLD_HEIGHT - PLAYER_HEIGHT,
    );

    const now = performance.now();
    if (now - this.lastMoveSentAt < 50) {
      return;
    }

    this.lastMoveSentAt = now;
    this.room.send("move", { x: this.desiredX, y: this.desiredY });

    local.renderX = this.desiredX;
    local.renderY = this.desiredY;
    this.updatePlayerVisual(local);
  }

  private interpolateRemotePlayers(): void {
    const now = performance.now();

    for (const [sessionId, entry] of this.players) {
      if (sessionId === this.localSessionId) {
        continue;
      }

      const elapsed = now - entry.lastUpdateAt;
      const t = Phaser.Math.Clamp(elapsed / INTERPOLATION_MS, 0, 1);

      entry.renderX = Phaser.Math.Linear(entry.renderX, entry.targetX, t);
      entry.renderY = Phaser.Math.Linear(entry.renderY, entry.targetY, t);
      this.updatePlayerVisual(entry);
    }
  }

  private updatePlayerVisual(entry: RenderPlayer): void {
    entry.rect.setPosition(
      entry.renderX + PLAYER_WIDTH / 2,
      entry.renderY + PLAYER_HEIGHT / 2,
    );
    entry.label.setPosition(entry.renderX + PLAYER_WIDTH / 2, entry.renderY - 8);
  }
}
