import 'phaser';

export default class DialogBox extends Phaser.GameObjects.Group {
  constructor(scene: Phaser.Scene, text: string, x: number, y: number, 
      callback: Function, width?: number) {
    super(scene)
    this.text = text;
    this.scene = scene;
    this.width = width || 200;
    this.callback = callback || function() {};
    this.populate();
    this.setX(x);
    this.setY(y)
  }

  protected text: string;
  protected width: number;
  public scene: Phaser.Scene;
  protected rectangle: Phaser.GameObjects.Rectangle;
  protected modal: Phaser.GameObjects.Rectangle;
  protected textBox: Phaser.GameObjects.Text;
  protected readonly margin = [8, 12, 8, 12];
  protected readonly backgroundColor = 0xdddddd;
  protected readonly textColor = 'black';
  protected callback: Function;

  private populate(): void {
    this.setOrigin(0.5);
    let style: Phaser.Types.GameObjects.Text.TextStyle = {
      'fontFamily': 'Verdana',
      'color': 'black',
      'backgroundColor': '#ddd'
    };
    this.textBox = new Phaser.GameObjects.Text(this.scene, 0, 0, this.text, style);
    // this.rectangle.setDepth(1000);
    this.textBox.setDepth(1001);
    let padding: Phaser.Types.GameObjects.Text.TextPadding = {
      top: 8,
      right: 12,
      bottom: 8,
      left: 12
    }
    this.textBox.setPadding(padding);
    this.textBox.setWordWrapWidth(this.width);
    this.textBox.setOrigin(.5);
    this.rectangle = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, this.textBox.width, this.textBox.height);
    this.rectangle.strokeColor = 0x338833;
    this.rectangle.isStroked = true;
    this.rectangle.setDepth(1001);
    this.rectangle.setOrigin(.5);
    let { width, height } = this.scene.sys.game.canvas;
    this.modal = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, 200, 200, 0x000000, .33);
    this.modal.setOrigin(1, 1);
    this.modal.setSize(width, height);
    this.modal.setDepth(1000);
    let context = this;
    this.modal.on('pointerup', function(event: Event) {
      context.modal.destroy();
      context.rectangle.destroy();
      context.textBox.destroy();
      context.callback();
      return false;
    });
    let area = {};
    this.modal.setInteractive(area, function (hitArea: any, x: number, y: number, gameObject: Phaser.GameObjects.GameObject) {
    });
    this.modal.setActive(true);
    this.add(this.rectangle, true);
    this.add(this.textBox, true);
    this.add(this.modal, true);

  }
}