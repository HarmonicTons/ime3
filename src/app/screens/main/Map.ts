import { orderBy } from "lodash";
import { Container, Ticker } from "pixi.js";
import { IsoCoordinates, isoDirections } from "./IsometricCoordinate";
import { MapObject } from "./MapObject";
import { Tile } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";

export type MapData = {
  objects: Record<string, string>;
  tiles: Record<string, string>;
};

export type CursorAction = {
  entityType: "tile" | "object";
  type: string;
};

/**
 * Map class representing a collection of isometric tiles.
 */
export class Map extends Container {
  public tiles: Record<string, Tile> = {};
  public objects: Record<string, MapObject> = {};

  constructor(
    mapData: MapData,
    public currentCursorAction: CursorAction,
    public tileFragmentsTextures: TileFragmentsTextures
  ) {
    super();
    const { tiles, objects } = mapData;
    for (const key in tiles) {
      const type = tiles[key];
      if (!type) continue;
      const iso = IsoCoordinates.fromString(key);
      this.createTile(iso, type);
    }
    for (const key in objects) {
      const type = objects[key];
      if (!type) continue;
      const iso = IsoCoordinates.fromString(key);
      this.createObject(iso, type);
    }

    this.updateAllTileNeighborhood();
    this.sortEntities();
  }

  public toJson(): string {
    const result: MapData = { objects: {}, tiles: {} };
    for (const key in this.objects) {
      result.objects[key] = this.objects[key].type;
    }
    for (const key in this.tiles) {
      result.tiles[key] = this.tiles[key].type;
    }
    return JSON.stringify(result);
  }

  private createObject(iso: IsoCoordinates, type: string) {
    const mapObject = new MapObject({ type, isoCoordinates: iso });
    mapObject.x = iso.e * 16 - iso.s * 16;
    mapObject.y = iso.e * 8 + iso.s * 8 - iso.u * 8 + 24;
    this.objects[iso.toString()] = mapObject;
    this.addChild(mapObject);

    mapObject.on("rightdown", (evt) => {
      evt.stopPropagation();
      this.removeMapObjectAt(iso);
    });
  }

  private createTile(iso: IsoCoordinates, type: string) {
    const tile = new Tile({
      type,
      getTileNeighbor: (relativeCoordinates) => {
        const neighborIso = iso.add(relativeCoordinates);
        const neighborTile = this.getTileAt(neighborIso);
        return neighborTile ? neighborTile.type : undefined;
      },
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
      if (this.currentCursorAction.entityType === "tile") {
        if (side === "up") {
          this.addTileAt(iso.move("up"), this.currentCursorAction.type);
        }
        if (side === "south") {
          this.addTileAt(iso.move("south"), this.currentCursorAction.type);
        }
        if (side === "east") {
          this.addTileAt(iso.move("east"), this.currentCursorAction.type);
        }
      }
      if (this.currentCursorAction.entityType === "object") {
        if (side === "up") {
          this.addMapObjectAt(iso.move("up"), this.currentCursorAction.type);
        }
        if (side === "south") {
          this.addMapObjectAt(iso.move("south"), this.currentCursorAction.type);
        }
        if (side === "east") {
          this.addMapObjectAt(iso.move("east"), this.currentCursorAction.type);
        }
      }
    });
  }

  private getTileAt(iso: IsoCoordinates): Tile | undefined {
    return this.tiles[iso.toString()];
  }
  private getMapObjectAt(iso: IsoCoordinates): MapObject | undefined {
    return this.objects[iso.toString()];
  }
  private getEntityAt(iso: IsoCoordinates): Tile | MapObject | undefined {
    return this.getTileAt(iso) || this.getMapObjectAt(iso);
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

  private removeMapObjectAt(iso: IsoCoordinates) {
    console.log("removing map object at", iso.s, iso.e, iso.u);
    const existingObject = this.getMapObjectAt(iso);
    if (existingObject) {
      this.removeChild(existingObject);
      delete this.objects[iso.toString()];
    }
  }

  private get entities(): (Tile | MapObject)[] {
    return [...Object.values(this.tiles), ...Object.values(this.objects)];
  }

  private sortEntities() {
    const sortedEntities = orderBy(
      this.entities,
      (entity) =>
        entity.isoCoordinates.s +
        entity.isoCoordinates.e +
        entity.isoCoordinates.u / 3
    );
    for (let i = 0; i < sortedEntities.length; i++) {
      this.setChildIndex(sortedEntities[i], i);
    }
  }

  public addTileAt(iso: IsoCoordinates, type: string) {
    if (this.getEntityAt(iso)) {
      console.warn("Entity already exists at", iso.s, iso.e, iso.u);
      return;
    }
    console.log("adding tile at", iso.s, iso.e, iso.u);
    this.createTile(iso, type);

    // Reorder the tiles
    this.sortEntities();
    // Update neighborhood
    this.updateTileNeighbors(iso);
  }

  public addMapObjectAt(iso: IsoCoordinates, type: string) {
    if (this.getEntityAt(iso)) {
      console.warn("Entity already exists at", iso.s, iso.e, iso.u);
      return;
    }
    console.log("adding map object at", iso.s, iso.e, iso.u);
    this.createObject(iso, type);

    // Reorder the tiles
    this.sortEntities();
  }

  /**
   * This won't work with tiles that are not UNESWD
   * TODO note which tile depends on which tile in a linked list
   */
  public updateTileNeighbors(iso: IsoCoordinates) {
    // Update neighborhood

    for (const direction of isoDirections) {
      const neighborTile = this.getTileAt(iso.move(direction));
      if (!neighborTile) {
        continue;
      }
      neighborTile.updateNeighborhood();
    }
    // HACK: hard code tiles to update
    const uuNeighborTile = this.getTileAt(iso.move("up").move("up"));
    uuNeighborTile?.updateNeighborhood();
    const unNeighborTile = this.getTileAt(iso.move("up").move("north"));
    unNeighborTile?.updateNeighborhood();
    const uwNeighborTile = this.getTileAt(iso.move("up").move("west"));
    uwNeighborTile?.updateNeighborhood();
    const ddNeighborTile = this.getTileAt(iso.move("down").move("down"));
    ddNeighborTile?.updateNeighborhood();
    const dsNeighborTile = this.getTileAt(iso.move("down").move("south"));
    dsNeighborTile?.updateNeighborhood();
    const deNeighborTile = this.getTileAt(iso.move("down").move("east"));
    deNeighborTile?.updateNeighborhood();
  }

  private updateAllTileNeighborhood() {
    for (const key in this.tiles) {
      const tile = this.tiles[key];
      tile.updateNeighborhood();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {}
}
