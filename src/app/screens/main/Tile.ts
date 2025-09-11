import { Container, Polygon, Sprite, Texture } from "pixi.js";
import { NoTextureFound, TileFragment, tileFragmentKeys } from "./TileFragment";
import { IsoDirection, IsoCoordinates } from "./IsometricCoordinate";

/**
 * Neighborhood (all neighbors types) of a tile
 */
export type TileNeighborhood = Record<IsoDirection, string | undefined>;

/**
 * An isometric tile
 */
export class Tile extends Container {
  public type: string;
  public isoCoordinates: IsoCoordinates;
  constructor({
    type,
    neighborhood,
    isoCoordinates,
  }: {
    /**
     * the type, ex: wall or stone
     */
    type: string;
    neighborhood: TileNeighborhood;
    isoCoordinates: IsoCoordinates;
  }) {
    super();
    this.type = type;
    this.isoCoordinates = isoCoordinates;

    this.interactive = true;
    // The hit area is a polygon that covers the entire tile (hexagon shape)
    this.hitArea = new Polygon([
      0, 7, 15, 0, 16, 0, 31, 7, 31, 15, 16, 22, 15, 22, 0, 15,
    ]);

    this.setTileFragments(neighborhood);
    this.addCursor();
  }

  /**
   * Get the side of the tile that was clicked based on the local coordinates of the click
   */
  public static getSideFromLocalCoordinates({
    x,
    y,
  }: {
    x: number;
    y: number;
  }): IsoDirection {
    if (x < 16) {
      if (5 + x / 2 >= y) {
        return "up";
      }
      return "south";
    }
    if (22 - x / 2 >= y) {
      return "up";
    }
    return "east";
  }

  public updateNeighborhood(neighborhood: TileNeighborhood) {
    this.removeChildren();
    this.setTileFragments(neighborhood);
  }

  private setTileFragments(neighborhood: TileNeighborhood) {
    tileFragmentKeys.forEach((key) => {
      try {
        new TileFragment({
          type: this.type,
          key,
          neighborhood,
          u: this.isoCoordinates.u,
          tile: this,
        });
      } catch (e) {
        if (e instanceof NoTextureFound) {
          // can safely ignore, just means this fragment is empty
          return;
        }
        throw e;
      }
    });
  }

  /**
   * Add a cursor that indicates where a new tile will be added
   */
  private addCursor() {
    const cursorUTexture = Texture.from("cursor-u.png");
    cursorUTexture.source.scaleMode = "nearest";
    const cursorUSprite = new Sprite(cursorUTexture);

    const cursorETexture = Texture.from("cursor-e.png");
    cursorETexture.source.scaleMode = "nearest";
    const cursorESprite = new Sprite(cursorETexture);
    cursorESprite.anchor.set(-1, -0.5);

    const cursorSTexture = Texture.from("cursor-s.png");
    cursorSTexture.source.scaleMode = "nearest";
    const cursorSSprite = new Sprite(cursorSTexture);
    cursorSSprite.anchor.set(0, -0.5);

    this.on("mousemove", (evt) => {
      const side = Tile.getSideFromLocalCoordinates(evt.getLocalPosition(this));
      if (side === "up") {
        this.addChild(cursorUSprite);
      }
      if (side === "east") {
        this.addChild(cursorESprite);
      }
      if (side === "south") {
        this.addChild(cursorSSprite);
      }
    });
    this.on("mousemove", (evt) => {
      const side = Tile.getSideFromLocalCoordinates(evt.getLocalPosition(this));
      if (side !== "up") {
        this.removeChild(cursorUSprite);
      }
      if (side !== "east") {
        this.removeChild(cursorESprite);
      }
      if (side !== "south") {
        this.removeChild(cursorSSprite);
      }
    });
    this.on("mouseleave", () => {
      this.removeChild(cursorUSprite);
      this.removeChild(cursorESprite);
      this.removeChild(cursorSSprite);
    });
  }
}
