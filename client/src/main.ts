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

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };

  private dialogueBox!: Phaser.GameObjects.Rectangle;
  private dialogueText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super("WorldScene");
  }

  create() {
    this.createWorld();
    this.createPlayer();
    this.createNPC();
    this.createUI();
    this.createControls();

    this.physics.add.collider(this.player, this.npc);
  }

  update() {
    this.handleMovement();
    this.handleInteraction();
  }

  private createWorld() {
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x8fd694
    );

    this.add.text(24, 20, "MemoryTown - Day 1 Prototype", {
      fontSize: "20px",
      color: "#102a43",
      fontFamily: "Arial",
    });

    this.add.text(24, 48, "Move: WASD / Arrow Keys | Interact: E", {
      fontSize: "15px",
      color: "#102a43",
      fontFamily: "Arial",
    });
  }

  private createPlayer() {
    this.player = this.add.rectangle(
      200,
      260,
      34,
      46,
      0x2f80ed
    ) as ArcadeRectangle;

    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
  }

  private createNPC() {
    this.npc = this.add.rectangle(
      620,
      260,
      40,
      54,
      0xf2c94c
    ) as ArcadeRectangle;

    this.physics.add.existing(this.npc, true);

    this.add.text(585, 200, "Maya", {
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

    this.dialogueBox = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 80,
      GAME_WIDTH - 80,
      110,
      0x111111,
      0.9
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
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.npc.x,
      this.npc.y
    );

    const isNearNPC = distance < 90;

    this.hintText.setVisible(isNearNPC);
    this.hintText.setPosition(this.npc.x - 50, this.npc.y - 85);

    if (isNearNPC && Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.dialogueBox.setVisible(true);
      this.dialogueText.setVisible(true);

      this.dialogueText.setText(
        "Maya: Hey, you must be new here. I run the coffee shop in MemoryTown. People talk a lot around here, so listen carefully."
      );
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