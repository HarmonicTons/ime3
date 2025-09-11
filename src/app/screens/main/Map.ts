import { orderBy } from "lodash";
import { Container, Ticker } from "pixi.js";
import { Neighborhood, neighborsOffsets, Tile, tileSides } from "./Tile";
import { IsometricCoordinates } from "./IsometricCoordinate";

/**
 * Map class representing a collection of isometric tiles.
 */
export class Map extends Container {
  public tiles: Record<string, Tile> = {};

  constructor(
    mapData: Record<string, string | undefined>,
    public type: "wall" | "rock" | "dirt"
  ) {
    super();

    this.tiles = {};
    for (const key in mapData) {
      const type = mapData[key];
      if (!type) continue;
      const iso = IsometricCoordinates.fromString(key);
      const neighborhood: Neighborhood = {
        up: mapData[iso.add(neighborsOffsets.up).toString()],
        north: mapData[iso.add(neighborsOffsets.north).toString()],
        east: mapData[iso.add(neighborsOffsets.east).toString()],
        south: mapData[iso.add(neighborsOffsets.south).toString()],
        west: mapData[iso.add(neighborsOffsets.west).toString()],
        down: mapData[iso.add(neighborsOffsets.down).toString()],
      };
      this.createTile(iso, type, neighborhood);
    }
  }

  private createTile(
    iso: IsometricCoordinates,
    type: string,
    neighborhood: Neighborhood
  ) {
    const tile = new Tile({ type, neighborhood, isometricCoordinates: iso });
    tile.x = iso.e * 16 - iso.s * 16;
    tile.y = iso.e * 8 + iso.s * 8 - iso.u * 8;
    this.tiles[iso.toString()] = tile;
    this.addChild(tile);

    tile.on("rightdown", (evt) => {
      evt.stopPropagation();
      this.removeTileAt(iso);
    });

    tile.on("mousedown", (evt) => {
      // ignore right and middle clicks
      if (evt.button !== 0) return;
      evt.stopPropagation();
      const localX = Math.floor(evt.getLocalPosition(tile).x);
      const localY = Math.floor(evt.getLocalPosition(tile).y);
      const side = Tile.getSideFromLocalCoordinates({ x: localX, y: localY });
      if (side === "up") {
        this.addTileAt(iso.add(neighborsOffsets.up), this.type);
      }
      if (side === "south") {
        this.addTileAt(iso.add(neighborsOffsets.south), this.type);
      }
      if (side === "east") {
        this.addTileAt(iso.add(neighborsOffsets.east), this.type);
      }
    });
  }

  private getTileAt(iso: IsometricCoordinates): Tile | undefined {
    return this.tiles[iso.toString()];
  }

  private removeTileAt(iso: IsometricCoordinates) {
    console.log("removing tile at", iso.s, iso.e, iso.u);
    const existingTile = this.getTileAt(iso);
    if (existingTile) {
      this.removeChild(existingTile);
      delete this.tiles[iso.toString()];
      // Update neighborhood
      this.updateTileNeighbors(iso);
    }
  }

  private sortTiles() {
    const sortedTiles = orderBy(
      Object.values(this.tiles),
      [
        "isometricCoordinates.e",
        "isometricCoordinates.s",
        "isometricCoordinates.u",
      ],
      ["asc", "asc", "asc"]
    );
    for (let i = 0; i < sortedTiles.length; i++) {
      this.setChildIndex(sortedTiles[i], i);
    }
  }

  public addTileAt(iso: IsometricCoordinates, type: string) {
    if (this.getTileAt(iso)) {
      console.warn("Tile already exists at", iso.s, iso.e, iso.u);
      return;
    }
    console.log("adding tile at", iso.s, iso.e, iso.u);
    const neighborhood = this.getNeighborhood(iso);
    this.createTile(iso, type, neighborhood);

    // Reorder the tiles
    this.sortTiles();
    // Update neighborhood
    this.updateTileNeighbors(iso);
  }

  public updateTileNeighbors(iso: IsometricCoordinates) {
    // Update neighborhood

    for (const side of tileSides) {
      const neighborTile = this.getTileAt(iso.add(neighborsOffsets[side]));
      if (!neighborTile) {
        continue;
      }
      const neighborhood = this.getNeighborhood(
        neighborTile.isometricCoordinates
      );
      neighborTile.updateNeighborhood(neighborhood);
    }
  }

  private getNeighborhood(iso: IsometricCoordinates): Neighborhood {
    return {
      up: this.getTileAt(iso.add(neighborsOffsets.up))?.type,
      north: this.getTileAt(iso.add(neighborsOffsets.north))?.type,
      east: this.getTileAt(iso.add(neighborsOffsets.east))?.type,
      south: this.getTileAt(iso.add(neighborsOffsets.south))?.type,
      west: this.getTileAt(iso.add(neighborsOffsets.west))?.type,
      down: this.getTileAt(iso.add(neighborsOffsets.down))?.type,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {}
}
