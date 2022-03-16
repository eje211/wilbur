import "phaser";
import { GameScene } from "./gamescene";
import { PhaserNavMesh, Point } from "phaser-navmesh";

type DynamicPoints = {
  [key: string]: boolean;
}

type LayerContent = {
  [key: string]: Phaser.Tilemaps.ObjectLayer
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
  edgeLayers: LayerContent = {};
  readonly EdgeProximity = { x: 20, y: 10 };
  readonly ScreenMidpoint = {
    x: this.scene.game.canvas.width / 2,
    y: this.scene.game.canvas.height / 3 * 2};
  private readonly Directions = ["top", "right", "bottom", "left"];
  private readonly stepSoundConfig: Phaser.Types.Sound.SoundConfig = {
    loop: true,
    volume: .2
  }

  create(scene: Phaser.Scene): void {
    PlayerCharacter.instance = this;
    let navMeshTiles = scene.make.tilemap({key: 'lobbyTM',
      tileWidth: 10, tileHeight: 10, height: 60, width: 80});
    this.navMeshLayer = navMeshTiles.getObjectLayer('navmesh');
    for (const direction of this.Directions) {
      this.edgeLayers[direction] = navMeshTiles.getObjectLayer(direction);
    }
    this.setOrigin(.5, 1);
    this.step = this.scene.sound.add('footstep');
    this.setScale(this.playersScaler(this.y));
    this.adjustCharacterDepth();
    this.navMesh = this.scene.navMeshPlugin.buildMeshFromTiled("navmeshkey", this.navMeshLayer);
    this.anims.play('mainPause');
    this.playersScaler(this.y);
  }

  walk() {
    if (this.checkEdge()) {
      this.stopWalking();
      return;
    }
    this.step.play(this.stepSoundConfig);
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
    let location = {x: this.scene.input.x, y: this.scene.input.y};
    let orientation = {top : location.y < this.ScreenMidpoint.y, left: location.x < this.ScreenMidpoint.x};
    let distance = {x: this.x - location.x, y: this.y - location.y};
    distance.x = orientation.left ? distance.x : -distance.x;
    distance.y = orientation.top ? distance.y : -distance.y;
    let stop = {x: Math.abs(distance.x) > this.EdgeProximity.x,
        y: Math.abs(distance.y) > this.EdgeProximity.y}
    let layers: [Phaser.Tilemaps.ObjectLayer, string][] = [];
    layers.push([orientation.left ?  this.edgeLayers.left : this.edgeLayers.right, 'x']);
    layers.push([orientation.top ?  this.edgeLayers.top : this.edgeLayers.bottom, 'y']);
    for (const layerPair of layers) {
      let [layer, direction] = layerPair;
      if (stop[direction as keyof typeof stop]) {
        continue;
      }
      for (const obj of layer.objects) {
        let gap = Math.abs(obj[direction as keyof typeof obj] -
          location[direction as keyof typeof location]);
        if (gap <= this.EdgeProximity[direction as keyof typeof this.EdgeProximity]) {
          return true;
        }
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
