import { Container, Polygon, Sprite, Texture } from "pixi.js";
import { NoTextureFound, TileFragment, tileFragmentKeys } from "./TileFragment";
import { IsometricCoordinates } from "./IsometricCoordinate";

export const tileSides = [
  "up",
  "north",
  "east",
  "south",
  "west",
  "down",
] as const;
export type TileSide = (typeof tileSides)[number];

/**
 * Neighbors tile type of a tile
 */
export type Neighborhood = Record<TileSide, string | undefined>;

export const neighborsOffsets: Record<TileSide, IsometricCoordinates> = {
  up: new IsometricCoordinates(0, 0, 1),
  north: new IsometricCoordinates(-1, 0, 0),
  east: new IsometricCoordinates(0, 1, 0),
  south: new IsometricCoordinates(1, 0, 0),
  west: new IsometricCoordinates(0, -1, 0),
  down: new IsometricCoordinates(0, 0, -1),
};

/**
 * An isometric tile
 */
export class Tile extends Container {
  public type: string;
  public isometricCoordinates: IsometricCoordinates;
  public neighborhood: Neighborhood;
  constructor({
    type,
    neighborhood,
    isometricCoordinates,
  }: {
    /**
     * the type, ex: wall or stone
     */
    type: string;
    neighborhood: Neighborhood;
    isometricCoordinates: IsometricCoordinates;
  }) {
    super();
    this.type = type;
    this.isometricCoordinates = isometricCoordinates;
    this.neighborhood = neighborhood;
    this.alpha = 1;

    this.interactive = true;
    // The hit area is a polygon that covers the entire tile (hexagon shape)
    this.hitArea = new Polygon([
      0, 7, 15, 0, 16, 0, 31, 7, 31, 15, 16, 22, 15, 22, 0, 15,
    ]);

    this.setTileFragments();

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

  public updateNeighborhood(neighborhood: Neighborhood) {
    this.removeChildren();
    this.neighborhood = neighborhood;
    this.setTileFragments();
  }

  public setTileFragments() {
    tileFragmentKeys.forEach((key) => {
      try {
        new TileFragment({
          type: this.type,
          key,
          neighborhood: this.neighborhood,
          z: this.isometricCoordinates.u,
          tile: this,
        });
      } catch (e) {
        if (!(e instanceof NoTextureFound)) throw e;
        // can safely ignore, just means no texture found for this fragment
      }
    });
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
  }): TileSide {
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
}
