import "phaser";

import { PhaserNavMeshPlugin } from "phaser-navmesh";
import { GameScene } from "./gamescene";

const config: Phaser.Types.Core.GameConfig = {
  title: "Wilbur",
  width: 800,
  height: 600,
  parent: "game",
  plugins: {
    scene: [
      {
        key: "PhaserNavMeshPlugin",
        plugin: PhaserNavMeshPlugin, // Class that constructs plugins
        mapping: "navMeshPlugin", // Property mapping to use for the scene, e.g. this.navMeshPlugin
        start: true
      }
    ]
  },
  scene: [
    GameScene
  ],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  backgroundColor: "#000033"
};

export class WilburGame extends Phaser.Game {
  gameScene: GameScene;
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
    this.gameScene = new GameScene();
    // this.events.on('update', function() {console.log('hello;')}, this);
  }
}

window.onload = () => {
  var game = new WilburGame(config);
};