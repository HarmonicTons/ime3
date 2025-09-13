import { orderBy } from "lodash";
import { Container, Ticker } from "pixi.js";
import { IsoCoordinates, isoDirections } from "./IsometricCoordinate";
import { MapObject } from "./MapObject";
import { Tile, TileNeighborhood } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";

export type MapData = {
  objects: Record<string, string>;
  tiles: Record<string, string>;
};

/**
 * Map class representing a collection of isometric tiles.
 */
export class Map extends Container {
  public tiles: Record<string, Tile> = {};
  public objects: Record<string, MapObject> = {};

  constructor(
    mapData: MapData,
    public type: string,
    public tileFragmentsTextures: TileFragmentsTextures
  ) {
    super();
    const { tiles, objects } = mapData;
    for (const key in tiles) {
      const type = tiles[key];
      if (!type) continue;
      const iso = IsoCoordinates.fromString(key);
      const neighborhood: TileNeighborhood = {
        up: tiles[iso.move("up").toString()],
        north: tiles[iso.move("north").toString()],
        east: tiles[iso.move("east").toString()],
        south: tiles[iso.move("south").toString()],
        west: tiles[iso.move("west").toString()],
        down: tiles[iso.move("down").toString()],
      };
      this.createTile(iso, type, neighborhood);
    }
    for (const key in objects) {
      const type = objects[key];
      if (!type) continue;
      const iso = IsoCoordinates.fromString(key);
      this.createObject(iso, type);
    }

    this.sortEntities();
  }

  public toJson(): string {
    const result: Record<string, string> = {};
    for (const key in this.tiles) {
      result[key] = this.tiles[key].type;
    }
    return JSON.stringify(result);
  }

  private createObject(iso: IsoCoordinates, type: string) {
    const mapObject = new MapObject({ type, isoCoordinates: iso });
    mapObject.x = iso.e * 16 - iso.s * 16;
    mapObject.y = iso.e * 8 + iso.s * 8 - iso.u * 8 - 8;
    this.objects[iso.toString()] = mapObject;
    this.addChild(mapObject);
  }

  private createTile(
    iso: IsoCoordinates,
    type: string,
    neighborhood: TileNeighborhood
  ) {
    const tile = new Tile({
      type,
      neighborhood,
      isoCoordinates: iso,
      tileFragmentsTextures: this.tileFragmentsTextures,
    });
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

  private get entities(): (Tile | MapObject)[] {
    return [...Object.values(this.tiles), ...Object.values(this.objects)];
  }

  private sortEntities() {
    const sortedEntities = orderBy(
      this.entities,
      ["isoCoordinates.e", "isoCoordinates.s", "isoCoordinates.u"],
      ["asc", "asc", "asc"]
    );
    for (let i = 0; i < sortedEntities.length; i++) {
      this.setChildIndex(sortedEntities[i], i);
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
    this.sortEntities();
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
