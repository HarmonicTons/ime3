import { maxBy } from "lodash";
import { Assets, Sprite, Texture } from "pixi.js";
import { Neighbors, Tile } from "./Tile";

/**
 * The name of the 12 tileFragments of a tile
 */
export const tileFragmentVariants = [
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
export type TileFragmentVariant = (typeof tileFragmentVariants)[number];

/**
 * The X,Y position of each fragment
 */
const tileFragmentPosition: Record<
  TileFragmentVariant,
  { x: number; y: number }
> = {
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

export class NoTextureFound extends Error {}

/**
 * A tiel fragment
 * A tile is made of 12 tileFragments (3 lines, 4 columns)
 */
export class TileFragment extends Sprite {
  constructor({
    type,
    variant,
    tile,
    neighbors,
    z,
  }: {
    type: string;
    variant: TileFragmentVariant;
    neighbors: Neighbors;
    z: number;
    tile: Tile;
  }) {
    const neighborsString = neighborsToString(neighbors);
    // find every textures for this type of tile into the cache of Pixi
    // TODO: use another system to register the textures instead of using Pixi's cache
    // @ts-expect-error idgaf
    const cache = Assets.cache._cache as Map<string, Texture>;
    const tileFragmentTextures = [...cache.keys()].filter((k) =>
      k.startsWith(`${type}-${variant}-`)
    );
    // score all the textures
    const texturesScores = tileFragmentTextures.map((textureName) =>
      scoreTexture({
        neighborsString,
        textureName,
        z,
      })
    );

    // find the best texture for this fragment
    let best = maxBy(texturesScores, "score")!;
    // if no texture match, try again ignoring the "up" side for some variants
    if (best.score === -1 && ["11", "14", "21", "24"].includes(variant)) {
      const texturesScoresIgnoreUp = tileFragmentTextures.map((textureName) =>
        scoreTexture({
          neighborsString,
          textureName,
          z,
          ignoreUp: true,
        })
      );
      const bestIgnoreUp = maxBy(texturesScoresIgnoreUp, "score")!;
      best = bestIgnoreUp;
    }
    if (best.score === -1) {
      throw new NoTextureFound(
        `No texture found for tile "${type}" variant "${variant}" with neighbors "${neighborsString}" at height ${z}`
      );
    }
    const texture = Texture.from(best.textureName);
    if (!texture) {
      throw new NoTextureFound(`Texture not found: "${best.textureName}"`);
    }
    // keep pixel art style
    texture.source.scaleMode = "nearest";
    const position = tileFragmentPosition[variant];

    super({ texture, position });

    tile.addChild(this);
  }
}

/**
 * Serialize the neighbors into a "uneswd" string
 */
const neighborsToString = (neighbors: Neighbors): string => {
  const sides = [];
  if (neighbors.up) sides.push("u");
  if (neighbors.north) sides.push("n");
  if (neighbors.east) sides.push("e");
  if (neighbors.south) sides.push("s");
  if (neighbors.west) sides.push("w");
  if (neighbors.down) sides.push("d");
  return sides.join("");
};

/**
 * Score a texture for a tile fragment
 * The higher the score the best this texture fit the neighbors of this fragment
 * If no valid texture is found, the score is -1
 * A texture is valid if all the sides it needs are free (no neighbor) and if the height condition is met
 * When ignoreUp is true, the "up" side is ignored in the scoring
 */
const scoreTexture = ({
  textureName,
  neighborsString,
  z,
  ignoreUp = false,
}: {
  textureName: string;
  neighborsString: string;
  z: number;
  ignoreUp?: boolean;
}) => {
  const regex = /^([a-z0-9]+)-(\d+)-([a-z]+)(?:_(\d+))?\.png$/;
  const [, , , n, h] = textureName.match(regex)!;
  const sides = ignoreUp ? n.replace("u", "") : n;
  const score = sides
    .split("")
    .filter((c) => neighborsString.includes(c)).length;
  const isValidHeight = h ? (z % 2) + 1 === Number(h) : true;
  const isValid = score === sides.length && isValidHeight;
  return { textureName, score: isValid ? score : -1 };
};
