import Phaser from "phaser";
import {
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SEJM_KLASYCZNY,
  type GameMap,
} from "@gra/shared";

const WALL_COLOR = 0x1a1a1a;
const CORRIDOR_COLOR = 0x243447;
const VOID_COLOR = 0x0a0f18;

export class MapRenderer {
  private readonly mapLayer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, map: GameMap = SEJM_KLASYCZNY) {
    this.mapLayer = scene.add.container(0, 0);

    this.mapLayer.add(
      scene.add.rectangle(
        map.worldWidth / 2,
        map.worldHeight / 2,
        map.worldWidth,
        map.worldHeight,
        VOID_COLOR,
      ),
    );

    for (const corridor of map.corridors) {
      this.mapLayer.add(
        scene.add.rectangle(
          corridor.x + corridor.width / 2,
          corridor.y + corridor.height / 2,
          corridor.width,
          corridor.height,
          CORRIDOR_COLOR,
        ),
      );
    }

    for (const room of map.rooms) {
      this.mapLayer.add(
        scene.add
          .rectangle(
            room.x + room.width / 2,
            room.y + room.height / 2,
            room.width,
            room.height,
            room.floorColor,
            0.95,
          )
          .setStrokeStyle(2, 0x8899aa),
      );

      this.mapLayer.add(
        scene.add
          .text(room.x + room.width / 2, room.y + room.height / 2, room.name, {
            fontSize: "14px",
            color: "#e8eef5",
            align: "center",
            wordWrap: { width: room.width - 24 },
          })
          .setOrigin(0.5),
      );
    }

    for (const wall of map.wallRects) {
      this.mapLayer.add(
        scene.add.rectangle(
          wall.x + wall.width / 2,
          wall.y + wall.height / 2,
          wall.width,
          wall.height,
          WALL_COLOR,
        ),
      );
    }

    const lobby = map.rooms.find((room) => room.id === "lobby");
    if (lobby) {
      this.mapLayer.add(
        scene.add
          .rectangle(lobby.x + lobby.width / 2, lobby.y + lobby.height - 48, 36, 56, 0x1f6b3a)
          .setStrokeStyle(2, 0x8b4513),
      );
    }

    this.mapLayer.setDepth(0);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.mapLayer;
  }
}

export { SEJM_KLASYCZNY, PLAYER_WIDTH, PLAYER_HEIGHT };
