import { Sprite } from "pixi.js";
import { Tile, TileNeighborhood } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";
import { NoTextureFoundError } from "./NoTextureFoundError";

/**
 * The name of the 12 tileFragments of a tile
 */
export const tileFragmentKeys = [
  "11",
  "12",
  "13",
  "14",
  "21",
  "22",
  "23",
  "24",
  "31",
  "32",
  "33",
  "34",
] as const;
export type TileFragmentKey = (typeof tileFragmentKeys)[number];

/**
 * The X,Y position of each fragment
 */
const tileFragmentPosition: Record<TileFragmentKey, { x: number; y: number }> =
  {
    "11": { x: 0, y: 0 },
    "12": { x: 8, y: 0 },
    "13": { x: 16, y: 0 },
    "14": { x: 24, y: 0 },
    "21": { x: 0, y: 8 },
    "22": { x: 8, y: 8 },
    "23": { x: 16, y: 8 },
    "24": { x: 24, y: 8 },
    "31": { x: 0, y: 16 },
    "32": { x: 8, y: 16 },
    "33": { x: 16, y: 16 },
    "34": { x: 24, y: 16 },
  };

/**
 * An isometric tile fragment
 * A tile is made of 12 fragments (4 columns x 3 lines)
 */
export class TileFragment extends Sprite {
  constructor({
    type,
    key,
    tile,
    neighborhood,
    height,
    tileFragmentsTextures,
  }: {
    type: string;
    key: TileFragmentKey;
    neighborhood: TileNeighborhood;
    height: number;
    tile: Tile;
    tileFragmentsTextures: TileFragmentsTextures;
  }) {
    const texture = tileFragmentsTextures.getFragmentTexture({
      type,
      fragment: key,
      neighborhood,
      height,
    });
    if (!texture) {
      throw new NoTextureFoundError(
        `No texture found for fragment ${key} of type ${type} with neighbors ${JSON.stringify(
          neighborhood
        )} at height ${height}`
      );
    }
    const position = tileFragmentPosition[key];

    super({ texture, position });

    tile.addChild(this);
  }
}
