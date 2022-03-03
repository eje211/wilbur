import "phaser";
import { ExtendedGameScene  } from "./extendedgamescene";
import { GameScene } from "./gamescene";
import { PhaserNavMesh, Point } from "phaser-navmesh";

type DynamicPoints = {
  [key: string]: boolean;
}

export class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number,
      texture: string | Phaser.Textures.Texture, frame?: string | number) {
    super(scene, x, y, texture, frame);
    this.extend();
    this.register();
  }

  extend(): void {
    this.scene.creates.push([this, this.create]);
    this.scene.updates.push([this, this.update]);
  }

  resize: boolean = false;
  walkEvent: Phaser.Time.TimerEvent;
  current: Point;
  flipX: boolean = false;
  path: Point[];
  navMesh: PhaserNavMesh;
  scene: GameScene;
  static instance: PlayerCharacter;
  step: Phaser.Sound.BaseSound;
  dynamic: DynamicPoints = {};
  navMeshLayer: Phaser.Tilemaps.ObjectLayer;
  topLayer: Phaser.Tilemaps.ObjectLayer;
  bottomLayer: Phaser.Tilemaps.ObjectLayer;
  readonly EdgeProximity = 6;
  readonly ScreenMidpoint = this.scene.game.canvas.height / 3 * 2;

  create(scene: Phaser.Scene): void {
    PlayerCharacter.instance = this;
    let navMeshTiles = scene.make.tilemap({key: 'lobbyTM',
      tileWidth: 10, tileHeight: 10, height: 60, width: 80});
      this.navMeshLayer = navMeshTiles.getObjectLayer('navmesh');
      this.topLayer = navMeshTiles.getObjectLayer('top');
      this.bottomLayer = navMeshTiles.getObjectLayer('bottom');
    this.setOrigin(.5, 1);

    this.step = this.scene.sound.add('footstep');

    this.setScale(this.playersScaler(this.y));
    this.adjustCharacterDepth();
    this.navMesh = this.scene.navMeshPlugin.buildMeshFromTiled("navmeshkey", this.navMeshLayer);
    this.anims.play('mainPause');
    this.playersScaler(this.y);
  }

  // TODO: Prevent walking if player character is close to a top or bottom edge
  // of the tilemap and is tasked to walk towards the edge.
  // If close to an edge (x == x of a tile or y == of a tile) and distance too short,
  // abort.
  walk() {
    let near = this.checkEdge();
    if (near) {
      this.stopWalking();
      return;
    }
    let config: Phaser.Types.Sound.SoundConfig = {
      loop: true,
      volume: .2
    };
    this.step.play(config);
    this.scene.time.removeEvent(this.walkEvent);
    this.walkEvent = this.scene.time.addEvent(new Phaser.Time.TimerEvent({
      callback: function() {
        let conditions = this.makeConditions()

        if (conditions.nothingToDo) {
          return;
        }

        this.adjustCharacterDepth();

        if (conditions.firstPoint) {
          this.goToFirstPoint();
          return;
        }
  
        if (conditions.nextPoint) {
          this.goToNextPoint();
          return;
        }
      }, loop: true, delay: 50, callbackScope: this }))
  }

  makeConditions(): object {
    return {
      nothingToDo: !this.current && !this.path,
      firstPoint: !this.current && !!this.path,
      nextPoint: this.isClose()
    }
  }

  goToFirstPoint(): void {
    this.current = this.path.pop();
    this.flipX = this.current.x < this.x;
    this.scene.physics.moveToObject(this, this.current, 200);
    this.resize = true;
    return;
  }

  goToNextPoint(): void {
    let oldCurrent = this.current;
    // In the chaos of the event system, this.path can be null here.]
    this.path = this.path || [];
    this.current = this.path.pop();
    if (!this.current) {
      // If we stop outside of the navMesh, we can't move out again.
      if (!this.navMesh.isPointInMesh(this) && !!oldCurrent) {
        this.current = oldCurrent;
        return;
      }
      this.stopWalking();
      return;
    }
    this.scene.physics.moveToObject(this, this.current, 200);
    this.flipX = this.current.x < this.x;
  }

  isClose(): boolean {
    if (!this.current) {
      return 
    }
    let distance = Phaser.Math.Distance
      .Between(this.x, this.y, this.current.x, this.current.y);
    return distance < GameScene.DistanceTolerance;
     
  }

  stopWalking(): void {
    this.scene.time.removeEvent(this.walkEvent);
    this.current = null;
    this.resize = false;
    this.anims.play('mainPause');
    this.setVelocity(0);
    this.step.stop();
    return;
  }

  adjustCharacterDepth() {
    this.setDepth(Math.round(this.y / 10));
  }

  update(): void {
    if (this.resize) {
      this.setScale(this.playersScaler(this.y));
    }
  }

  playersScaler(yCoordinate: number): number {
    return (15 + (
        Math.log(1 / (900 - yCoordinate))
          / Math.log(1.77)))
        / 2.5
  }

  buildClickAction(): void {
    this.scene.input.on('pointerdown', function () {
      let character = (this as PlayerCharacter);
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
    }, this);
  }

  /**
   * If the player character is moving a small distance away from the edge,
   * they can end up in a situation where they can advance out of the navmesh
   * and can no longer get back on it, making the map unplayable. This method
   * helps avoid that situation.
   * 
   * @returns Whether the player character is moving a small distance
   * away frome the edge.
   */
  checkEdge(): boolean {
    let y = this.scene.input.y;
    let isTop = (y < this.ScreenMidpoint);
    let distance = this.y - y;
    distance = isTop ? distance : -distance;
    if (distance <= 0 || Math.abs(distance) > this.EdgeProximity) {
      return false;
    }
    let layer = isTop ? this.topLayer : this.bottomLayer;
    for (const obj of layer.objects) {
      if (Math.abs(obj.y - y) <= this.EdgeProximity) {
        return true;
      }
    }
    return false;
  }

  register(): void {
    Phaser.GameObjects.GameObjectFactory.register(
      'playerCharacter',
      function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number,
          texture: string | Phaser.Textures.Texture, frame?: string | number): PlayerCharacter {
            const playerCharacter = new PlayerCharacter(this.scene, x, y, texture, frame);
    
            this.displayList.add(playerCharacter);
            this.updateList.add(playerCharacter);
        
            return playerCharacter;
      }
    )
  }
}
