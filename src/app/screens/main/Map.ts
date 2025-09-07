import { Container } from "pixi.js";
import { Tile } from "./Tile";

export class Map extends Container {
  public mapData: string[] = [];
  public tiles: Tile[] = [];
  constructor(
    public readonly xMax: number,
    public readonly yMax: number,
    public readonly zMax: number
  ) {
    super();

    this.mapData = [];
    for (let i = 0; i < xMax; i++) {
      for (let j = 0; j < yMax; j++) {
        for (let k = 0; k < zMax; k++) {
          const hasTile = Math.random() > 0.1;
          if (!hasTile) {
            this.mapData.push("empty");
            continue;
          }
          this.mapData.push("rock");
          //this.mapData.push("wall");
        }
      }
    }

    this.tiles = [];
    for (let y = 0; y < yMax; y++) {
      for (let x = 0; x < xMax; x++) {
        for (let z = 0; z < zMax; z++) {
          const type = this.getTile(x, y, z);
          if (type === "empty") continue;
          const neighbors = {
            up: this.getTile(x, y, z + 1) === "empty",
            north: this.getTile(x - 1, y, z) === "empty",
            east: this.getTile(x, y + 1, z) === "empty",
            south: this.getTile(x + 1, y, z) === "empty",
            west: this.getTile(x, y - 1, z) === "empty",
            down: this.getTile(x, y, z - 1) === "empty",
          };
          const tile = new Tile({ type, neighbors, z });
          tile.x = y * 16 - x * 16;
          tile.y = y * 8 + x * 8 - z * 8;
          this.tiles.push(tile);
          this.addChild(tile);

          tile.on("pointerdown", (e) => {
            const localX = Math.floor(e.getLocalPosition(tile).x);
            const localY = Math.floor(e.getLocalPosition(tile).y);
            const side = Tile.getSide({ x: localX, y: localY });
            console.log("click", x, y, z, side);
          });
        }
      }
    }
  }

  private getTile(x: number, y: number, z: number): string {
    if (x < 0 || x >= this.xMax) return "empty";
    if (y < 0 || y >= this.yMax) return "empty";
    if (z < 0 || z >= this.zMax) return "empty";
    const index = x + y * this.xMax + z * this.xMax * this.yMax;
    return this.mapData[index] ?? "empty";
  }
}
