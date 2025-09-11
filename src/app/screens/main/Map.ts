import { orderBy } from "lodash";
import { Container, Ticker } from "pixi.js";
import { TileNeighborhood, Tile } from "./Tile";
import { isoDirections, IsoCoordinates } from "./IsometricCoordinate";

/**
 * Map class representing a collection of isometric tiles.
 */
export class Map extends Container {
  public tiles: Record<string, Tile> = {};

  constructor(
    mapData: Record<string, string | undefined>,
    public type: string
  ) {
    super();
    for (const key in mapData) {
      const type = mapData[key];
      if (!type) continue;
      const iso = IsoCoordinates.fromString(key);
      const neighborhood: TileNeighborhood = {
        up: mapData[iso.move("up").toString()],
        north: mapData[iso.move("north").toString()],
        east: mapData[iso.move("east").toString()],
        south: mapData[iso.move("south").toString()],
        west: mapData[iso.move("west").toString()],
        down: mapData[iso.move("down").toString()],
      };
      this.createTile(iso, type, neighborhood);
    }
  }

  private createTile(
    iso: IsoCoordinates,
    type: string,
    neighborhood: TileNeighborhood
  ) {
    const tile = new Tile({ type, neighborhood, isoCoordinates: iso });
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
        this.addTileAt(iso.move("up"), this.type);
      }
      if (side === "south") {
        this.addTileAt(iso.move("south"), this.type);
      }
      if (side === "east") {
        this.addTileAt(iso.move("east"), this.type);
      }
    });
  }

  private getTileAt(iso: IsoCoordinates): Tile | undefined {
    return this.tiles[iso.toString()];
  }

  private removeTileAt(iso: IsoCoordinates) {
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

  public addTileAt(iso: IsoCoordinates, type: string) {
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

  public updateTileNeighbors(iso: IsoCoordinates) {
    // Update neighborhood

    for (const direction of isoDirections) {
      const neighborTile = this.getTileAt(iso.move(direction));
      if (!neighborTile) {
        continue;
      }
      const neighborhood = this.getNeighborhood(neighborTile.isoCoordinates);
      neighborTile.updateNeighborhood(neighborhood);
    }
  }

  private getNeighborhood(iso: IsoCoordinates): TileNeighborhood {
    return {
      up: this.getTileAt(iso.move("up"))?.type,
      north: this.getTileAt(iso.move("north"))?.type,
      east: this.getTileAt(iso.move("east"))?.type,
      south: this.getTileAt(iso.move("south"))?.type,
      west: this.getTileAt(iso.move("west"))?.type,
      down: this.getTileAt(iso.move("down"))?.type,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {}
}
