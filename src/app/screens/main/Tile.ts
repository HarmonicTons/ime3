import { Container, Polygon, Sprite, Texture } from "pixi.js";
import { NoTextureFound, TileFragment, tileFragmentKeys } from "./TileFragment";

type Side = "up" | "north" | "east" | "south" | "west" | "down";

/**
 * Neighbors of a tile
 * false means there is a tile, true means there is nothing (kinda backward)
 */
export type Neighbors = Record<Side, boolean>;

/**
 * A tile
 */
export class Tile extends Container {
  public type: string;
  public e: number;
  public s: number;
  public u: number;
  public neighbors: Neighbors;
  constructor({
    type,
    neighbors,
    e,
    s,
    u,
  }: {
    /**
     * the type, ex: wall or stone
     */
    type: string;
    /**
     * the neighbors of the tile
     */
    neighbors: Neighbors;
    /**
     * The E coordinate
     */
    e: number;
    /**
     * The S coordinate
     */
    s: number;
    /**
     * The U coordinate
     */
    u: number;
  }) {
    super();
    this.type = type;
    this.e = e;
    this.s = s;
    this.u = u;
    this.neighbors = neighbors;
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
      const side = Tile.getSide(evt.getLocalPosition(this));
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
      const side = Tile.getSide(evt.getLocalPosition(this));
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

  public updateNeighbors(neighbors: Neighbors) {
    this.removeChildren();
    this.neighbors = neighbors;
    this.setTileFragments();
  }

  public setTileFragments() {
    tileFragmentKeys.forEach((key) => {
      try {
        new TileFragment({
          type: this.type,
          key,
          neighbors: this.neighbors,
          z: this.u,
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
  public static getSide({ x, y }: { x: number; y: number }): Side {
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
