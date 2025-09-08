import { Container, Ticker } from "pixi.js";
import { Neighbors, Tile } from "./Tile";
import { orderBy } from "lodash";

export class Map extends Container {
  public tiles: Record<string, Tile> = {};
  constructor(sMax: number, eMax: number, uMax: number) {
    super();

    const mapData: Record<string, string> = {};
    for (let s = 0; s < sMax; s++) {
      for (let e = 0; e < eMax; e++) {
        for (let u = 0; u < uMax; u++) {
          const hasTile = Math.random() > 0.1;
          if (hasTile) {
            mapData[`${s},${e},${u}`] = "rock";
          }
        }
      }
    }

    this.tiles = {};
    for (let e = 0; e < eMax; e++) {
      for (let s = 0; s < sMax; s++) {
        for (let u = 0; u < uMax; u++) {
          const type = mapData[`${s},${e},${u}`];
          if (type === undefined) continue;
          const neighbors: Neighbors = {
            up: mapData[`${s},${e},${u + 1}`] === undefined,
            north: mapData[`${s - 1},${e},${u}`] === undefined,
            east: mapData[`${s},${e + 1},${u}`] === undefined,
            south: mapData[`${s + 1},${e},${u}`] === undefined,
            west: mapData[`${s},${e - 1},${u}`] === undefined,
            down: mapData[`${s},${e},${u - 1}`] === undefined,
          };
          this.createTile(s, e, u, type, neighbors);
        }
      }
    }
  }

  private createTile(
    s: number,
    e: number,
    u: number,
    type: string,
    neighbors: Neighbors
  ) {
    const tile = new Tile({ type, neighbors, e, s, u });
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
    });

    tile.on("mousedown", (evt) => {
      evt.stopPropagation();
      const localX = Math.floor(evt.getLocalPosition(tile).x);
      const localY = Math.floor(evt.getLocalPosition(tile).y);
      const side = Tile.getSide({ x: localX, y: localY });
      console.log("mousedown", s, e, u, side);
      if (side === "up") {
        this.addTileAt(s, e, u + 1, "rock");
      }
      if (side === "south") {
        this.addTileAt(s + 1, e, u, "rock");
      }
      if (side === "east") {
        this.addTileAt(s, e + 1, u, "rock");
      }
    });
  }

  private getTileAt(s: number, e: number, u: number): Tile | undefined {
    return this.tiles[`${s},${e},${u}`];
  }

  private removeTileAt(s: number, e: number, u: number) {
    console.log("removing tile at", s, e, u);
    const existingTile = this.getTileAt(s, e, u);
    if (existingTile) {
      this.removeChild(existingTile);
      delete this.tiles[`${s},${e},${u}`];
      // Update neighbors
      this.updateTileNeighbors(s, e, u);
    }
  }

  private sortTiles() {
    const sortedTiles = orderBy(
      Object.values(this.tiles),
      ["e", "s", "u"],
      ["asc", "asc", "asc"]
    );
    for (let i = 0; i < sortedTiles.length; i++) {
      this.setChildIndex(sortedTiles[i], i);
    }
  }

  private addTileAt(s: number, e: number, u: number, type: string) {
    if (this.getTileAt(s, e, u)) {
      console.warn("Tile already exists at", s, e, u);
      return;
    }
    console.log("adding tile at", s, e, u);
    const neighbors: Neighbors = {
      up: this.getTileAt(s, e, u + 1) === undefined,
      north: this.getTileAt(s - 1, e, u) === undefined,
      east: this.getTileAt(s, e + 1, u) === undefined,
      south: this.getTileAt(s + 1, e, u) === undefined,
      west: this.getTileAt(s, e - 1, u) === undefined,
      down: this.getTileAt(s, e, u - 1) === undefined,
    };
    this.createTile(s, e, u, type, neighbors);

    // Reorder the tiles
    this.sortTiles();
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
          up: this.getTileAt(neighborS, neighborE, neighborU + 1) === undefined,
          north:
            this.getTileAt(neighborS - 1, neighborE, neighborU) === undefined,
          east:
            this.getTileAt(neighborS, neighborE + 1, neighborU) === undefined,
          south:
            this.getTileAt(neighborS + 1, neighborE, neighborU) === undefined,
          west:
            this.getTileAt(neighborS, neighborE - 1, neighborU) === undefined,
          down:
            this.getTileAt(neighborS, neighborE, neighborU - 1) === undefined,
        };
        neighborTile.updateNeighbors(neighbors);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {}
}
