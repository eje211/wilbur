import "phaser";
import { Scene } from "phaser";

import { PhaserNavMeshPlugin } from "phaser-navmesh";
import { NavMashPluginMod } from "..";

type Point = {
    x: number,
    y: number
}

export class GameScene extends Phaser.Scene {

  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  target: Point = { x: 0, y: 0 };
  resize: boolean = false;
  navMeshPlugin: NavMashPluginMod.PhaserNavMeshPlugin;
  static readonly DistanceTolerance = 15;
  tileMap: NavMashPluginMod.PhaserNavMesh;
  current: NavMashPluginMod.Point;
  navMesh: NavMashPluginMod.PhaserNavMesh;
  walkEvent: Phaser.Time.TimerEvent;
  path: NavMashPluginMod.Point[];

  constructor() {
    super({
      key: "GameScene",
      plugins: {
        scene: [
          {
            key: "PhaserNavMeshPluginB", // Key to store the plugin class under in cache
            plugin: PhaserNavMeshPlugin, // Class that constructs plugins
            mapping: "navMeshPlugin", // Property mapping to use for the scene, e.g. this navMeshPlugin
            start: true
          }
        ]
      }
    });
  }

  init(/* params */): void {
  }

  preload(): void {
    this.load.spritesheet('mainChar', 'assets/bez_right_sheet.png',
      { frameWidth: 50, frameHeight: 90 });
    this.load.image('hotelLobby', 'assets/hotellobby.png');
    this.load.image('hotelDesk', 'assets/lobbydesk.png');
    this.load.image('leftWall', 'assets/lobbyleftwall.png');
    this.load.tilemapTiledJSON('lobbyTM', 'assets/Lobby tilemap.tmj');
  }

  create(): void {
    let navMeshTiles = this.make.tilemap({key: 'lobbyTM',
      tileWidth: 10, tileHeight: 10, height: 60, width: 80});
    let navMeshLayer = navMeshTiles.getObjectLayer('navmesh2');
    for (let layer of navMeshLayer.objects) {
      layer.x /= 1;
      layer.y /= 1;
      layer.x -= 4000;
      layer.y -= 3000;
    }
    this.navMesh = this.navMeshPlugin.buildMeshFromTiled("navmeshkey", navMeshLayer);
    // console.log('objects b', navMeshLayer);
    // console.log(this.navMesh);
 
    let background = this.add.image(400, 300, 'hotelLobby');
    background.setDepth(-1);
    let desk = this.add.image(400, 300, 'hotelDesk');
    desk.setDepth(34);
    let leftWall = this.add.image(400, 300, 'leftWall');
    leftWall.setDepth(36);
    this.player = this.physics.add.sprite(400, 340, 'mainChar');
    this.player.setOrigin(.5, 1);
    this.player.setScale(this.playersScaler(this.player.y));
    this.adjustCharacterDepth();
    // this.navMesh.enableDebug(null);
    // console.log('now2');
    // this.navMesh.debugDrawMesh({
    //   drawCentroid: false,
    //   drawBounds: false,
    //   drawNeighbors: false,
    //   drawPortals: false
    // });

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

    this.anims.play('mainPause', this.player);
    this.playersScaler(this.player.y);

    this.buildClickAction();
  }

  update(time: number, delta: number): void {
      
      if (this.resize) {
        this.player.setScale(this.playersScaler(this.player.y));
      }
  }

  playersScaler(yCoordinate: number): number {
    return (15 + (
        Math.log(1 / (900 - yCoordinate))
          / Math.log(1.77)))
        / 2.5
  }

  buildClickAction(): void {
    let scene = this;
    this.input.on('pointerdown', function (pointer) {
      this.path = scene.navMesh
        .findPath({ x: this.player.x, y: this.player.y },
          { x: this.input.x, y: this.input.y });
      if (!this.path) {
        return;
      }
      // console.log(this.path);
      this.anims.play('mainRight', this.player);
      this.path.shift();
      // console.log(this.path, { x: this.player.x, y: this.player.y }, { x: this.input.x, y: this.input.y });
      this.walk();
    }, this);
  }

  walk() {
    if (this.walkEvent) {
      this.time.removeEvent(this.walkEvent);
    }
    this.walkEvent = this.time.addEvent(new Phaser.Time.TimerEvent({
      callback: function() {
        if (!this.current && !this.path) {
          // console.log('nothing to do')
          return;
        }

        this.adjustCharacterDepth();

        if (!this.current && this.path) {
          // console.log('to first point', this.current, this.path);
          this.current = this.path.shift();
          this.player.flipX = this.current.x < this.player.x;
          this.physics.moveToObject(this.player, this.current, 200);
          // console.log('moving from', this.player.x, this. player.y, 'to', this.current);
          this.resize = true;
          return;
        }

        let distance = Phaser.Math.Distance
          .Between(this.player.x, this.player.y, this.current.x, this.current.y);
        let close = distance < GameScene.DistanceTolerance;
  
        if (close) {
          // console.log('next point');
          let oldCurrent = this.current;
          // In the chaos of the event system, this.path can be null here.
          this.current = this.path ? this.path.shift() : null;
          // console.log(this.navMesh.isPointInMesh(this.player));
          if (!this.current) {
            // If we stop outside of the navMesh, we can't move out again.
            if (!this.navMesh.isPointInMesh(this.player)) {
              this.current = oldCurrent;
              return;
            }
            this.time.removeEvent(this.walkEvent);
            this.current = null;
            this.resize = false;
            this.anims.play('mainPause', this.player);
            this.player.setVelocity(0);
            return;
          }
          this.physics.moveToObject(this.player, this.current, 200);
          this.player.flipX = this.current.x < this.player.x;
          //   s  console.log('moving from', this.player.x, this. player.y, 'to', this.current);
        }
      }, loop: true, delay: 50, callbackScope: this }))
  }

  adjustCharacterDepth() {
    this.player.setDepth(Math.round(this.player.y / 10));
  }
}
