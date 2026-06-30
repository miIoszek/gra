import Phaser from "phaser";
import { joinSejmRoom } from "./network/joinRoom";
import { GameScene } from "./scenes/GameScene";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "./config";

const nickScreen = document.getElementById("nick-screen")!;
const nickInput = document.getElementById("nick-input") as HTMLInputElement;
const joinBtn = document.getElementById("join-btn") as HTMLButtonElement;
const errorMsg = document.getElementById("error-msg")!;

let game: Phaser.Game | null = null;

function showError(message: string): void {
  errorMsg.textContent = message;
}

async function startGame(room: Awaited<ReturnType<typeof joinSejmRoom>>): Promise<void> {
  nickScreen.classList.add("hidden");

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    parent: "game-container",
    backgroundColor: "#0f3460",
    scene: [GameScene],
  });

  game.scene.start("GameScene", { room });
}

async function handleJoin(): Promise<void> {
  const nick = nickInput.value.trim();

  if (nick.length < 2) {
    showError("Nick musi mieć co najmniej 2 znaki.");
    return;
  }

  joinBtn.disabled = true;
  showError("Łączenie...");

  try {
    const room = await joinSejmRoom(nick);
    await startGame(room);
  } catch (error) {
    console.error(error);
    showError("Nie udało się połączyć z serwerem.");
    joinBtn.disabled = false;
  }
}

joinBtn.addEventListener("click", () => {
  void handleJoin();
});

nickInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    void handleJoin();
  }
});

nickInput.focus();

window.addEventListener("beforeunload", () => {
  game?.destroy(true);
});
