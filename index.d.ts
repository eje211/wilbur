import "phaser";

declare module NavMashPluginMod {
  export class PhaserNavMeshPlugin {
    constructor(scene: Phaser.Scene,
      pluginManager: Phaser.Plugins.PluginManager,
      pluginKey: string);

    protected game: Phaser.Game;
    private phaserNavMeshes: Record<string, PhaserNavMesh>;
    readonly pluginKey: string;
    protected pluginManager: Phaser.Plugins.PluginManager;
    protected scene: Phaser.Scene;
    protected systems: Phaser.Scenes.Systems;
    
    boot(): void;
    buildMeshFromTiled(key: string, objectLayer: Phaser.Tilemaps.ObjectLayer,
      meshShrinkAmount?: number): PhaserNavMesh;
    buildMeshFromTilemap(key: string, tilemap: Phaser.Tilemaps.Tilemap,
      tilemapLayers?: Phaser.Tilemaps.TilemapLayer[], isWalkable?: (tile: Phaser.Tilemaps.Tile) => boolean,
      shrinkAmount?: number): PhaserNavMesh;
    destroy(): void;
    init(): void;
    removeAllMeshes(): void;
    removeMesh(key: string): void;
    start(): void;
    stop(): void;
  }

  export class PhaserNavMesh {
    constructor(plugin: PhaserNavMeshPlugin,
      scene: Phaser.Scene, key: string, meshPolygonPoints: PolyPoints[],
      meshShrinkAmount?: number);
    
    private debugGraphics: null | Phaser.GameObjects.Graphics;
    private key: string;
    private navMesh: NavMesh;
    private plugin: PhaserNavMeshPlugin;
    private scene: Phaser.Scene;

    debugDrawClear(): void;
    debugDrawMesh(__namedParameters?: { drawBounds: any; drawCentroid: any; drawNeighbors: any; drawPortals: any; palette?: any }): void;
    debugDrawPath(path: Point[], color?: number, thickness?: number, alpha?: number): void;
    destroy(): void;
    disableDebug(): void;
    enableDebug(graphics: Phaser.GameObjects.Graphics): null | Phaser.GameObjects.Graphics;
    findPath(startPoint: Point, endPoint: Point, PointClass?: Class): null | Point[];
    isDebugEnabled(): null | boolean;
    isPointInMesh(point: Point): boolean;
  }


  export type PolyPoints = Point[];

  export interface Point {
    x: number;
    y: number;
  }

  export class NavMesh {
    constructor(meshPolygonPoints: PolyPoints[], meshShrinkAmount?: number);

    private graph: any;
    private meshShrinkAmount: number;
    private navPolygons: any[];

    private calculateNeighbors(): void;
    private destroy(): void;
    findClosestMeshPoint(point: Point, maxAllowableDist?: number): { distance: number; point: null | Point; polygon: null | PolyPoints };
    findPath(startPoint: Point, endPoint: Point): null | Point[];
    getPolygons(): Point[]; s
    private getSegmentOverlap(line1: any, line2: any): null | any[];
    isPointInMesh(point: Point): boolean;
    private projectPointToPolygon(point: any, navPoly: PolyPoints): { distance: number; point: null | Point };

  }
}