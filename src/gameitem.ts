import "phaser";
import DialogBox from "./dialogbox";

export default class GameItem extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture,
    description: string, action?: Function, condition?: () => boolean,  
    frame?: string | number, walkY?: integer) {
    super(scene, x, y, texture, frame);
    this._description = description;
    this._walkY = walkY || this.y + this.DefaultWalkShift;
    this.action = action || function() {};
    this._condition = condition || (() => false);
    this.setup();
  }
  
  private _description: string;
  private _walkY: integer;
  readonly DefaultWalkShift = 20;
  readonly action: Function;
  private _condition: Function;

  get description(): string {
    return this._description;
  }
  get walkY(): integer {
    return this._walkY;
  }
  get condition(): boolean {
    return this._condition();
  }

  set description(value: string) {
    this._description = value;
  }
  set walkY(value: integer) {
    this._walkY = value;
  }

  setup(): void {
    this.setDepth(Math.round(this.y / 10));
    this.setActive(true);
    this.setInteractive({
      useHandCursor: false
    });
    this.on('clicked', this.describe, this);
  }

  describe(): void {
    let x = this.x + this.width / 2;
    let y = this.y - 50;
    let dialog = new DialogBox(this.scene, this.description,
      x, y, undefined, 250);
    this.scene.add.existing(dialog);
  }

}