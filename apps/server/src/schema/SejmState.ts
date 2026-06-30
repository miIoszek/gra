import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") nick: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

export class SejmState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
