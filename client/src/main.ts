import Phaser from "phaser";
import "./style.css";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const PLAYER_SPEED = 220;

type PlayerRectangle = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

type StaticRectangle = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.StaticBody;
  npcId?: string;
};

type NPCProfile = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  intro: string;
  personality: string;
  topicHint: string;
};

type ChatMessage = {
  sender: "player" | "npc";
  text: string;
};

const NPC_PROFILES: NPCProfile[] = [
  {
    id: "maya",
    name: "Maya",
    x: 300,
    y: 275,
    color: 0xf2c94c,
    personality: "warm, witty coffee shop owner who knows town gossip",
    topicHint: "coffee shop, rumors, train station, hidden places",
    intro:
      "Hey, you must be new here. I’m Maya. I run the coffee shop, which basically means I hear everything before everyone else.",
  },
  {
    id: "arjun",
    name: "Arjun",
    x: 500,
    y: 375,
    color: 0x56ccf2,
    personality: "nervous student who lost an important notebook",
    topicHint: "lost notebook, school, park, strange notes",
    intro:
      "Oh—hi. I’m Arjun. I’m trying not to panic, but I lost my notebook somewhere near the park.",
  },
  {
    id: "lina",
    name: "Lina",
    x: 690,
    y: 275,
    color: 0xbb6bd9,
    personality: "mysterious librarian who speaks carefully",
    topicHint: "library, old books, town history, locked room",
    intro:
      "Welcome, traveler. I’m Lina, the librarian. Some stories in MemoryTown are better discovered slowly.",
  },
];

class WorldScene extends Phaser.Scene {
  private player!: PlayerRectangle;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private npcGroup!: Phaser.Physics.Arcade.StaticGroup;
  private npcObjects: StaticRectangle[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };

  private hintText!: Phaser.GameObjects.Text;

  private isChatOpen = false;
  private activeNpc: NPCProfile | null = null;
  private chatHistory = new Map<string, ChatMessage[]>();

  private chatOverlay!: HTMLDivElement;
  private chatTitle!: HTMLDivElement;
  private chatLog!: HTMLDivElement;
  private chatInput!: HTMLInputElement;

  constructor() {
    super("WorldScene");
  }

  create() {
    this.createWorld();
    this.createObstacles();
    this.createPlayer();
    this.createNPCs();
    this.createUI();
    this.createChatOverlay();
    this.createControls();

    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.npcGroup);
  }

  update() {
    if (!this.isChatOpen) {
      this.handleMovement();
      this.handleInteraction();
    } else {
      this.player.body.setVelocity(0);
    }
  }

  private createWorld() {
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x8fd694
    );

    this.add.rectangle(GAME_WIDTH / 2, 280, GAME_WIDTH, 90, 0xd9c7a3);
    this.add.rectangle(460, GAME_HEIGHT / 2, 90, GAME_HEIGHT, 0xd9c7a3);
    this.add.rectangle(460, 280, 110, 110, 0xcbb68f);

    this.add.text(24, 20, "MemoryTown - Day 3 Dialogue Prototype", {
      fontSize: "20px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(24, 48, "Move: WASD / Arrow Keys | Talk: E | Close Chat: ESC", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(115, 112, "Coffee Shop", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(680, 112, "Library", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(120, 420, "Apartments", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(680, 420, "Park", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });
  }

  private createObstacles() {
    this.obstacles = this.physics.add.staticGroup();

    this.createBuilding(170, 155, 180, 110, 0xb56576);
    this.createBuilding(735, 155, 190, 120, 0x6d597a);
    this.createBuilding(175, 445, 190, 100, 0x355070);

    this.createTree(670, 405);
    this.createTree(760, 410);
    this.createTree(710, 470);
    this.createTree(830, 455);

    const fountain = this.add.rectangle(735, 455, 70, 45, 0x4ea8de);
    this.physics.add.existing(fountain, true);
    this.obstacles.add(fountain);
  }

  private createBuilding(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    const building = this.add.rectangle(x, y, width, height, color);
    this.physics.add.existing(building, true);
    this.obstacles.add(building);

    this.add.rectangle(x, y - height / 2 + 12, width, 24, 0x2f2f2f);
  }

  private createTree(x: number, y: number) {
    const trunk = this.add.rectangle(x, y + 16, 16, 28, 0x8b5a2b);
    const leaves = this.add.circle(x, y, 28, 0x2f855a);

    this.physics.add.existing(leaves, true);
    this.obstacles.add(leaves);

    trunk.setDepth(1);
    leaves.setDepth(2);
  }

  private createPlayer() {
    this.player = this.add.rectangle(
      460,
      280,
      34,
      46,
      0x2f80ed
    ) as PlayerRectangle;

    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.setDepth(10);
  }

  private createNPCs() {
    this.npcGroup = this.physics.add.staticGroup();

    NPC_PROFILES.forEach((profile) => {
      const npc = this.add.rectangle(
        profile.x,
        profile.y,
        40,
        54,
        profile.color
      ) as StaticRectangle;

      npc.npcId = profile.id;
      npc.setDepth(10);

      this.physics.add.existing(npc, true);
      this.npcGroup.add(npc);
      this.npcObjects.push(npc);

      this.add.text(profile.x - 28, profile.y - 55, profile.name, {
        fontSize: "16px",
        color: "#102a43",
        fontFamily: "Arial",
      });
    });
  }

  private createUI() {
    this.hintText = this.add.text(0, 0, "Press E to talk", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#111111",
      padding: {
        x: 8,
        y: 4,
      },
      fontFamily: "Arial",
    });

    this.hintText.setVisible(false);
    this.hintText.setDepth(100);
  }

  private createChatOverlay() {
    const app = document.querySelector<HTMLDivElement>("#app");

    if (!app) {
      throw new Error("App container not found");
    }

    this.chatOverlay = document.createElement("div");
    this.chatOverlay.id = "chat-overlay";

    this.chatTitle = document.createElement("div");
    this.chatTitle.id = "chat-title";

    this.chatLog = document.createElement("div");
    this.chatLog.id = "chat-log";

    const inputRow = document.createElement("div");
    inputRow.id = "chat-input-row";

    this.chatInput = document.createElement("input");
    this.chatInput.id = "chat-input";
    this.chatInput.placeholder = "Type your message and press Enter...";

    const sendButton = document.createElement("button");
    sendButton.id = "chat-send-button";
    sendButton.textContent = "Send";

    inputRow.appendChild(this.chatInput);
    inputRow.appendChild(sendButton);

    this.chatOverlay.appendChild(this.chatTitle);
    this.chatOverlay.appendChild(this.chatLog);
    this.chatOverlay.appendChild(inputRow);

    app.appendChild(this.chatOverlay);

    sendButton.addEventListener("click", () => {
      this.sendPlayerMessage();
    });

    this.chatInput.addEventListener("keydown", (event) => {
      event.stopPropagation();

      if (event.key === "Enter") {
        this.sendPlayerMessage();
      }

      if (event.key === "Escape") {
        this.closeChat();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (this.isChatOpen && event.key === "Escape") {
        this.closeChat();
      }
    });
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
    }) as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
      E: Phaser.Input.Keyboard.Key;
    };
  }

  private handleMovement() {
    const body = this.player.body;

    body.setVelocity(0);

    const left = this.cursors.left?.isDown || this.keys.A.isDown;
    const right = this.cursors.right?.isDown || this.keys.D.isDown;
    const up = this.cursors.up?.isDown || this.keys.W.isDown;
    const down = this.cursors.down?.isDown || this.keys.S.isDown;

    if (left) body.setVelocityX(-PLAYER_SPEED);
    if (right) body.setVelocityX(PLAYER_SPEED);
    if (up) body.setVelocityY(-PLAYER_SPEED);
    if (down) body.setVelocityY(PLAYER_SPEED);

    body.velocity.normalize().scale(PLAYER_SPEED);
  }

  private handleInteraction() {
    const nearestNpc = this.getNearestNpc();

    if (!nearestNpc) {
      this.hintText.setVisible(false);
      return;
    }

    this.hintText.setVisible(true);
    this.hintText.setPosition(nearestNpc.x - 50, nearestNpc.y - 85);

    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      const profile = NPC_PROFILES.find((npc) => npc.id === nearestNpc.npcId);

      if (profile) {
        this.openChat(profile);
      }
    }
  }

  private getNearestNpc(): StaticRectangle | null {
    let nearestNpc: StaticRectangle | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.npcObjects.forEach((npc) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );

      if (distance < 90 && distance < nearestDistance) {
        nearestNpc = npc;
        nearestDistance = distance;
      }
    });

    return nearestNpc;
  }

  private openChat(npc: NPCProfile) {
    this.isChatOpen = true;
    this.activeNpc = npc;
    this.hintText.setVisible(false);

    if (!this.chatHistory.has(npc.id)) {
      this.chatHistory.set(npc.id, [
        {
          sender: "npc",
          text: npc.intro,
        },
      ]);
    }

    this.chatTitle.textContent = `${npc.name} — ${npc.personality}`;
    this.renderChatHistory(npc.id);

    this.chatOverlay.style.display = "block";
    this.chatInput.value = "";

    setTimeout(() => {
      this.chatInput.focus();
    }, 0);
  }

  private closeChat() {
    this.isChatOpen = false;
    this.activeNpc = null;
    this.chatOverlay.style.display = "none";
    this.chatInput.blur();
  }

  private sendPlayerMessage() {
    if (!this.activeNpc) return;

    const message = this.chatInput.value.trim();

    if (!message) return;

    const history = this.chatHistory.get(this.activeNpc.id) ?? [];

    history.push({
      sender: "player",
      text: message,
    });

    const npcReply = this.generateMockReply(this.activeNpc, message);

    history.push({
      sender: "npc",
      text: npcReply,
    });

    this.chatHistory.set(this.activeNpc.id, history);

    this.chatInput.value = "";
    this.renderChatHistory(this.activeNpc.id);
  }

  private renderChatHistory(npcId: string) {
    const history = this.chatHistory.get(npcId) ?? [];

    this.chatLog.innerHTML = "";

    history.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.className =
        message.sender === "player" ? "chat-message player" : "chat-message npc";

      messageElement.textContent =
        message.sender === "player" ? `You: ${message.text}` : message.text;

      this.chatLog.appendChild(messageElement);
    });

    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  private generateMockReply(npc: NPCProfile, playerMessage: string): string {
    const message = playerMessage.toLowerCase();

    if (message.includes("hello") || message.includes("hi")) {
      return `${npc.name}: Hi. Since you're here, ask me about ${npc.topicHint}.`;
    }

    if (message.includes("library")) {
      return `${npc.name}: The library is not just a library. Lina knows more than she admits.`;
    }

    if (message.includes("notebook")) {
      return `${npc.name}: Arjun’s notebook went missing near the park. That feels too convenient to be random.`;
    }

    if (message.includes("coffee")) {
      return `${npc.name}: Maya’s coffee shop is where half the town pretends not to gossip.`;
    }

    if (message.includes("park")) {
      return `${npc.name}: The park is peaceful during the day, but people avoid it after sunset.`;
    }

    return `${npc.name}: Interesting. I don't know enough to answer that yet, but later my responses will come from a RAG backend instead of this placeholder logic.`;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "app",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [WorldScene],
};

new Phaser.Game(config);