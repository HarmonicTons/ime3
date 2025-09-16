import { Sprite } from "pixi.js";
import { NoTextureFoundError } from "./NoTextureFoundError";
import { GetTileNeighbor, Tile } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";

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
    getTileNeighbor,
    height,
    tileFragmentsTextures,
  }: {
    type: string;
    key: TileFragmentKey;
    getTileNeighbor: GetTileNeighbor;
    height: number;
    tile: Tile;
    tileFragmentsTextures: TileFragmentsTextures;
  }) {
    const texture = tileFragmentsTextures.getFragmentTexture({
      type,
      fragment: key,
      getTileNeighbor,
      height,
    });
    if (!texture) {
      throw new NoTextureFoundError();
    }
    const position = tileFragmentPosition[key];

    super({ texture, position });

    tile.addChild(this);
  }
}
