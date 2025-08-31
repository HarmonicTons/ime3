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

export class Tile extends Container {
  constructor({ type, neighbors }: { type: string; neighbors: Neighbors }) {
    super();

    new Quadrant({
      type,
      variant: "11",
      neighbors,
      tile: this,
    });
    new Quadrant({
      type,
      variant: "12",
      neighbors,
      tile: this,
    });
    new Quadrant({
      type,
      variant: "13",
      neighbors,
      tile: this,
    });
    new Quadrant({
      type,
      variant: "14",
      neighbors,
      tile: this,
    });
  }
}

type QuadrantVariant = "11" | "12" | "13" | "14";

const quadrantPosition: Record<QuadrantVariant, { x: number; y: number }> = {
  "11": { x: 0, y: 0 },
  "12": { x: 8, y: 0 },
  "13": { x: 16, y: 0 },
  "14": { x: 24, y: 0 },
};

class Quadrant extends Sprite {
  constructor({
    type,
    variant,
    tile,
    neighbors,
  }: {
    type: string;
    variant: QuadrantVariant;
    neighbors: Neighbors;
    tile: Tile;
  }) {
    const neighborsString = neighborsToString(neighbors);
    // @ts-expect-error idgaf
    const cache = Assets.cache._cache as Map<string, Texture>;
    const quadrantTextures = [...cache.keys()].filter((k) =>
      k.startsWith(`${type}-${variant}-`)
    );
    const texturesScores = quadrantTextures.map((textureName) => {
      const [, , end] = textureName.split("-");
      const [n] = end.split(".png");
      const score = n
        .split("")
        .filter((c) => neighborsString.includes(c)).length;
      const isValid = score === n.length;
      return { textureName, score: isValid ? score : -1 };
    });

    console.log(texturesScores);
    const best = maxBy(texturesScores, "score")!;
    console.log(best);

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
