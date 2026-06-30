import { defineRoom, defineServer } from "colyseus";
import cors from "cors";
import { SejmRoom } from "./rooms/SejmRoom.js";

const PORT = Number(process.env.PORT ?? 2567);

const server = defineServer({
  rooms: {
    sejm: defineRoom(SejmRoom),
  },
  express: (app) => {
    app.use(cors());
    app.get("/health", (_req, res) => {
      res.json({ ok: true });
    });
  },
});

void server.listen(PORT).then(() => {
  console.log(`Colyseus server listening on ws://localhost:${PORT}`);
});
