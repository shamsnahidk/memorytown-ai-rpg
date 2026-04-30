import Phaser from "phaser";
import "./style.css";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const PLAYER_SPEED = 220;

type ArcadeRectangle = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

class WorldScene extends Phaser.Scene {
  private player!: ArcadeRectangle;
  private npc!: ArcadeRectangle;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
  };

  private dialogueBox!: Phaser.GameObjects.Rectangle;
  private dialogueText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  private isDialogueOpen = false;

  constructor() {
    super("WorldScene");
  }

  create() {
    this.createWorld();
    this.createObstacles();
    this.createPlayer();
    this.createNPC();
    this.createUI();
    this.createControls();

    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.npc);
  }

  update() {
    if (!this.isDialogueOpen) {
      this.handleMovement();
    } else {
      this.player.body.setVelocity(0);
    }

    this.handleInteraction();
    this.handleDialogueClose();
  }

  private createWorld() {
    // Grass background
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x8fd694
    );

    // Main road
    this.add.rectangle(GAME_WIDTH / 2, 280, GAME_WIDTH, 90, 0xd9c7a3);

    // Vertical road
    this.add.rectangle(460, GAME_HEIGHT / 2, 90, GAME_HEIGHT, 0xd9c7a3);

    // Road intersection
    this.add.rectangle(460, 280, 110, 110, 0xcbb68f);

    this.add.text(24, 20, "MemoryTown - Day 2 Prototype", {
      fontSize: "20px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(24, 48, "Move: WASD / Arrow Keys | Talk: E | Close: ESC", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    // Location labels
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

    // Park trees
    this.createTree(670, 405);
    this.createTree(760, 410);
    this.createTree(710, 470);
    this.createTree(830, 455);

    // Small fountain
    const fountain = this.add.rectangle(735, 455, 70, 45, 0x4ea8de) as ArcadeRectangle;
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
    const building = this.add.rectangle(x, y, width, height, color) as ArcadeRectangle;
    this.physics.add.existing(building, true);
    this.obstacles.add(building);

    // Roof highlight
    this.add.rectangle(x, y - height / 2 + 12, width, 24, 0x2f2f2f);
  }

  private createTree(x: number, y: number) {
    const trunk = this.add.rectangle(x, y + 16, 16, 28, 0x8b5a2b);
    const leaves = this.add.circle(x, y, 28, 0x2f855a) as unknown as ArcadeRectangle;

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
    ) as ArcadeRectangle;

    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.setDepth(10);
  }

  private createNPC() {
    this.npc = this.add.rectangle(
      300,
      275,
      40,
      54,
      0xf2c94c
    ) as ArcadeRectangle;

    this.physics.add.existing(this.npc, true);
    this.npc.setDepth(10);

    this.add.text(270, 220, "Maya", {
      fontSize: "16px",
      color: "#102a43",
      fontFamily: "Arial",
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

    this.dialogueBox = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      GAME_WIDTH - 80,
      110,
      0x111111,
      0.92
    );

    this.dialogueText = this.add.text(70, GAME_HEIGHT - 120, "", {
      fontSize: "18px",
      color: "#ffffff",
      fontFamily: "Arial",
      wordWrap: {
        width: GAME_WIDTH - 140,
      },
    });

    this.dialogueBox.setVisible(false);
    this.dialogueText.setVisible(false);

    this.dialogueBox.setDepth(100);
    this.dialogueText.setDepth(101);
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
      E: Phaser.Input.Keyboard.Key;
      ESC: Phaser.Input.Keyboard.Key;
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
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.npc.x,
      this.npc.y
    );

    const isNearNPC = distance < 90;

    this.hintText.setVisible(isNearNPC && !this.isDialogueOpen);
    this.hintText.setPosition(this.npc.x - 50, this.npc.y - 85);

    if (
      isNearNPC &&
      !this.isDialogueOpen &&
      Phaser.Input.Keyboard.JustDown(this.keys.E)
    ) {
      this.openDialogue(
        "Maya: Hey, you must be new here. I run the coffee shop in MemoryTown. People talk a lot around here, so listen carefully."
      );
    }
  }

  private openDialogue(message: string) {
    this.isDialogueOpen = true;
    this.dialogueBox.setVisible(true);
    this.dialogueText.setVisible(true);
    this.dialogueText.setText(message);
  }

  private closeDialogue() {
    this.isDialogueOpen = false;
    this.dialogueBox.setVisible(false);
    this.dialogueText.setVisible(false);
    this.dialogueText.setText("");
  }

  private handleDialogueClose() {
    if (this.isDialogueOpen && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.closeDialogue();
    }
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