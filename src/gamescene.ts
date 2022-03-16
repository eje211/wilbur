import "phaser";
import { PlayerCharacter } from "./playercharacter";
import { ExtendedGameScene } from "./extendedgamescene";
import { PhaserNavMeshPlugin } from "phaser-navmesh";
import DialogBox from "./dialogbox";
import { Frame, TextSprite } from "phaser-ui-tools";
import { Game } from "phaser";
import InkClass from './ink';
import GameItem from './gameitem';

type Point = {
    x: number,
    y: number
}

export class GameScene extends Phaser.Scene implements ExtendedGameScene {

  target: Point = { x: 0, y: 0 };
  static readonly DistanceTolerance = 15;
  tileMap: Phaser.Tilemaps.Tilemap;
  player: PlayerCharacter;
  creates: [any, Function][];
  updates: [any, Function][];
  navMeshPlugin: PhaserNavMeshPlugin;
  ink: InkClass;
  

  constructor() {
    super({
      key: "GameScene"
    });
    this.creates = [];
    this.updates = [];
    this.ink = new InkClass();
  }

  init(/* params */): void {
  }

  preload(): void {
    this.load.spritesheet('mainChar', 'assets/bez_right_sheet.png',
      { frameWidth: 50, frameHeight: 90 });
    this.load.image('hotelLobby', 'assets/hotellobby.png');
    this.load.image('hotelDesk', 'assets/lobbydesk.png');
    this.load.image('leftWall', 'assets/lobbyleftwall.png');
    this.load.audio('footstep', 'assets/footstep.mp3');
    this.load.tilemapTiledJSON('lobbyTM', 'assets/Lobby tilemap.tmj');
    this.load.image('redBook', 'assets/book_red.png');
  }

  create(): void {
    // console.log('objects b', navMeshLayer);
    // console.log(this.navMesh);

    this.input.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, function (pointer: any, gameObjects: Phaser.GameObjects.GameObject[]) {
      for (let gameObject of gameObjects) {
        gameObject.emit('clicked', gameObject);
      }
    }, this);
 
    let background = this.add.image(400, 300, 'hotelLobby');
    background.setDepth(0);
    background.setActive(true);
    background.setInteractive({
      useHandCursor: false
    });
    background.on('clicked', this.clickAction, this);
    let desk = this.add.image(400, 300, 'hotelDesk');
    desk.setDepth(34);
    let leftWall = this.add.image(400, 300, 'leftWall');
    leftWall.setDepth(36);
    this.player = new PlayerCharacter(this, 400, 320, 'mainChar');
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
    let frame = new Frame(this, 150, 50, 'black', true);
    let dialog = new DialogBox(this, 'This is more than just example Text; this is serious.',
      200, 200, this.sayHello, 250);
    this.add.existing(dialog);

    let book = new GameItem(this, 450, 350, 'redBook', 'A red book. What could it contain?');
    this.add.existing(book);

    this.anims.create({
      key: 'mainRight',
      frames: this.anims.generateFrameNumbers('mainChar', { start: 1, end: 10 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'mainPause',
      frames: [ { key: 'mainChar', frame: 0 } ],
      frameRate: 20
    });

    for (let [origin, create] of this.creates) {
      create.call(origin, this);
    }
  }

  sayHello() {
    console.log("Hello");
  }

  clickAction(): void {
    let character = this.player;
    character.path = character.navMesh
      .findPath({ x: character.x, y: character.y },
        { x: character.scene.input.x, y: character.scene.input.y });
    if (!character.path) {
      return;
    }
    character.path = character.path.reverse();
    character.anims.play('mainRight');
    character.path.pop();
    character.walk();
  }

  update(time: number, delta: number): void {
      for (let [origin, update] of this.updates) {
        update.call(origin, time, delta);
      }
  }
}
