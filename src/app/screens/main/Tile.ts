import { maxBy } from "lodash";
import { Assets, Container, Sprite, Texture } from "pixi.js";

type Neighbors = {
  up: boolean;
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
  down: boolean;
};

const quadrantVariants = [
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
type QuadrantVariant = (typeof quadrantVariants)[number];
const quadrantVariantVisibilityConditions: Record<
  QuadrantVariant,
  (keyof Neighbors)[]
> = {
  "11": ["up"],
  "12": ["up"],
  "13": ["up"],
  "14": ["up"],
  "21": ["up", "west"],
  "22": ["up", "west"],
  "23": ["up", "east"],
  "24": ["up", "east"],
  "31": ["west"],
  "32": ["west"],
  "33": ["east"],
  "34": ["east"],
};

export class Tile extends Container {
  constructor({
    type,
    neighbors,
    z,
  }: {
    type: string;
    neighbors: Neighbors;
    z: number;
  }) {
    super();

    quadrantVariants.forEach((variant) => {
      const visibilityConditions = quadrantVariantVisibilityConditions[variant];
      const isHidden = visibilityConditions.every(
        (side) => neighbors[side] === false
      );
      if (isHidden) return;
      new Quadrant({
        type,
        variant,
        neighbors,
        z,
        tile: this,
      });
    });
  }
}

const quadrantPosition: Record<QuadrantVariant, { x: number; y: number }> = {
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

class Quadrant extends Sprite {
  constructor({
    type,
    variant,
    tile,
    neighbors,
    z,
  }: {
    type: string;
    variant: QuadrantVariant;
    neighbors: Neighbors;
    z: number;
    tile: Tile;
  }) {
    const neighborsString = neighborsToString(neighbors);
    // @ts-expect-error idgaf
    const cache = Assets.cache._cache as Map<string, Texture>;
    const quadrantTextures = [...cache.keys()].filter((k) =>
      k.startsWith(`${type}-${variant}-`)
    );
    const texturesScores = quadrantTextures.map((textureName) => {
      const regex = /^([a-z]+)-(\d+)-([a-z]+)(?:_(\d+))?\.png$/;
      const [, , , n, h] = textureName.match(regex)!;
      const score = n
        .split("")
        .filter((c) => neighborsString.includes(c)).length;
      const isValidHeight = h ? (z % 2) + 1 === Number(h) : true;
      const isValid = score === n.length && isValidHeight;
      return { textureName, score: isValid ? score : -1 };
    });

    const best = maxBy(texturesScores, "score")!;
    console.log({ variant, neighborsString, texturesScores, best });

    const texture = Texture.from(best.textureName);
    if (!texture) {
      throw new Error(`Texture not found: "${best.textureName}"`);
    }
    texture.source.scaleMode = "nearest";
    const position = quadrantPosition[variant];

    super({ texture, position });

    tile.addChild(this);
  }
}

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
