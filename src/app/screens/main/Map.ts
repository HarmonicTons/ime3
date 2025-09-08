import { Container, Ticker } from "pixi.js";
import { Tile } from "./Tile";

export class Map extends Container {
  public mapData: string[] = [];
  public tiles: Record<string, Tile> = {};
  constructor(
    public readonly sMax: number,
    public readonly eMax: number,
    public readonly uMax: number
  ) {
    super();

    this.mapData = [];
    for (let s = 0; s < sMax; s++) {
      for (let e = 0; e < eMax; e++) {
        for (let u = 0; u < uMax; u++) {
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

    this.tiles = {};
    for (let e = 0; e < eMax; e++) {
      for (let s = 0; s < sMax; s++) {
        for (let u = 0; u < uMax; u++) {
          const type = this.getMapData(s, e, u);
          if (type === "empty") continue;
          const neighbors = {
            up: this.getMapData(s, e, u + 1) === "empty",
            north: this.getMapData(s - 1, e, u) === "empty",
            east: this.getMapData(s, e + 1, u) === "empty",
            south: this.getMapData(s + 1, e, u) === "empty",
            west: this.getMapData(s, e - 1, u) === "empty",
            down: this.getMapData(s, e, u - 1) === "empty",
          };
          const tile = new Tile({ type, neighbors, z: u });
          tile.x = e * 16 - s * 16;
          tile.y = e * 8 + s * 8 - u * 8;
          this.tiles[`${s},${e},${u}`] = tile;
          this.addChild(tile);

          tile.on("rightdown", (evt) => {
            evt.stopPropagation();
            const localX = Math.floor(evt.getLocalPosition(tile).x);
            const localY = Math.floor(evt.getLocalPosition(tile).y);
            const side = Tile.getSide({ x: localX, y: localY });
            console.log("rightdown", s, e, u, side);
            this.removeTileAt(s, e, u);
            this.setMapData(s, e, u, "empty");
          });

          tile.on("mousedown", (evt) => {
            evt.stopPropagation();
            const localX = Math.floor(evt.getLocalPosition(tile).x);
            const localY = Math.floor(evt.getLocalPosition(tile).y);
            const side = Tile.getSide({ x: localX, y: localY });
            console.log("mousedown", s, e, u, side);
            if (side === "up") {
              this.setMapData(s, e, u + 1, "rock");
              this.addTileAt(s, e, u + 1, "rock");
            }
            if (side === "south") {
              this.setMapData(s + 1, e, u, "rock");
              this.addTileAt(s + 1, e, u, "rock");
            }
            if (side === "east") {
              this.setMapData(s, e + 1, u, "rock");
              this.addTileAt(s, e + 1, u, "rock");
            }
          });
        }
      }
    }
  }

  private getMapData(s: number, e: number, u: number): string {
    if (s < 0 || s >= this.sMax) return "empty";
    if (e < 0 || e >= this.eMax) return "empty";
    if (u < 0 || u >= this.uMax) return "empty";
    const index = s + e * this.sMax + u * this.sMax * this.eMax;
    return this.mapData[index] ?? "empty";
  }

  private setMapData(s: number, e: number, u: number, value: string) {
    if (s < 0 || s >= this.sMax) return;
    if (e < 0 || e >= this.eMax) return;
    if (u < 0 || u >= this.uMax) return;
    const index = s + e * this.sMax + u * this.sMax * this.eMax;
    this.mapData[index] = value;
  }

  private getTileAt(s: number, e: number, u: number): Tile | undefined {
    return this.tiles[`${s},${e},${u}`];
  }

  private removeTileAt(s: number, e: number, u: number) {
    console.log("removing tile at", s, e, u);
    const existingTile = this.getTileAt(s, e, u);
    if (existingTile) {
      this.setMapData(s, e, u, "empty");
      this.removeChild(existingTile);
      delete this.tiles[`${s},${e},${u}`];
      // Update neighbors
      this.updateTileNeighbors(s, e, u);
    }
  }

  private addTileAt(s: number, e: number, u: number, type: string) {
    if (this.getTileAt(s, e, u)) {
      console.warn("Tile already exists at", s, e, u);
      return;
    }
    const neighbors = {
      up: this.getMapData(s, e, u + 1) === "empty",
      north: this.getMapData(s - 1, e, u) === "empty",
      east: this.getMapData(s, e + 1, u) === "empty",
      south: this.getMapData(s + 1, e, u) === "empty",
      west: this.getMapData(s, e - 1, u) === "empty",
      down: this.getMapData(s, e, u - 1) === "empty",
    };
    const tile = new Tile({ type, neighbors, z: u });
    tile.x = e * 16 - s * 16;
    tile.y = e * 8 + s * 8 - u * 8;
    this.tiles[`${s},${e},${u}`] = tile;
    // this will add the tile on top of others
    this.addChild(tile);
    // but we want to reorder the children so that the tile is at the correct position
    for (let u = 0; u < this.uMax; u++) {
      for (let s = 0; s < this.sMax; s++) {
        for (let e = 0; e < this.eMax; e++) {
          const t = this.getTileAt(s, e, u);
          if (t) {
            this.setChildIndex(t, this.children.length - 1);
          }
        }
      }
    }
    this.setMapData(s, e, u, type);

    tile.on("rightdown", (evt) => {
      evt.stopPropagation();
      const localX = Math.floor(evt.getLocalPosition(tile).x);
      const localY = Math.floor(evt.getLocalPosition(tile).y);
      const side = Tile.getSide({ x: localX, y: localY });
      console.log("rightdown", s, e, u, side);
      this.removeTileAt(s, e, u);
      this.setMapData(s, e, u, "empty");
    });

    tile.on("mousedown", (evt) => {
      evt.stopPropagation();
      const localX = Math.floor(evt.getLocalPosition(tile).x);
      const localY = Math.floor(evt.getLocalPosition(tile).y);
      const side = Tile.getSide({ x: localX, y: localY });
      console.log("mousedown", s, e, u, side);
      if (side === "up") {
        this.setMapData(s, e, u + 1, "rock");
        this.addTileAt(s, e, u + 1, "rock");
      }
      if (side === "south") {
        this.setMapData(s + 1, e, u, "rock");
        this.addTileAt(s + 1, e, u, "rock");
      }
      if (side === "east") {
        this.setMapData(s, e + 1, u, "rock");
        this.addTileAt(s, e + 1, u, "rock");
      }
    });

    // Update neighbors
    this.updateTileNeighbors(s, e, u);
  }

  public updateTileNeighbors(s: number, e: number, u: number) {
    // Update neighbors
    const neighborOffsets = [
      { ds: 0, de: 0, du: 1 }, // up
      { ds: -1, de: 0, du: 0 }, // north
      { ds: 0, de: 1, du: 0 }, // east
      { ds: 1, de: 0, du: 0 }, // south
      { ds: 0, de: -1, du: 0 }, // west
      { ds: 0, de: 0, du: -1 }, // down
    ];
    for (const offset of neighborOffsets) {
      const neighborS = s + offset.ds;
      const neighborE = e + offset.de;
      const neighborU = u + offset.du;
      const neighborTile = this.getTileAt(neighborS, neighborE, neighborU);
      if (neighborTile) {
        const neighbors = {
          up: this.getMapData(neighborS, neighborE, neighborU + 1) === "empty",
          north:
            this.getMapData(neighborS - 1, neighborE, neighborU) === "empty",
          east:
            this.getMapData(neighborS, neighborE + 1, neighborU) === "empty",
          south:
            this.getMapData(neighborS + 1, neighborE, neighborU) === "empty",
          west:
            this.getMapData(neighborS, neighborE - 1, neighborU) === "empty",
          down:
            this.getMapData(neighborS, neighborE, neighborU - 1) === "empty",
        };
        neighborTile.updateNeighbors(neighbors);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {}
}
