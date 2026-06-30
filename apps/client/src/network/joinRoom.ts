import { Client, Room } from "@colyseus/sdk";
import { SERVER_URL } from "../config";

export async function joinSejmRoom(nick: string): Promise<Room> {
  const client = new Client(SERVER_URL);
  return client.joinOrCreate("sejm", { nick });
}
