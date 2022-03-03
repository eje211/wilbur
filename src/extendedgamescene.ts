import "phaser";
import { PhaserNavMeshPlugin } from "phaser-navmesh";

export interface ExtendedGameScene {
  creates: [any, Function][];
  updates: [any, Function][];
  navMeshPlugin: PhaserNavMeshPlugin;
}