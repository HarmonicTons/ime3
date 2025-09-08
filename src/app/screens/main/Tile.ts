import { maxBy } from "lodash";
import { Assets, Container, Polygon, Sprite, Texture } from "pixi.js";

type Side = "up" | "north" | "east" | "south" | "west" | "down";

/**
 * Neighbors of a tile
 * false means there is a tile, true means there is nothing (kinda backward)
 */
export type Neighbors = Record<Side, boolean>;

/**
 * The name of the 12 quadrants of a tile
 */
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

/**
 * The quadriant is hidden if all these conditions are met (their is a neighbor in each direction)
 */
const quadrantVariantVisibilityConditions: Record<QuadrantVariant, Side[]> = {
  "11": ["up"],
  "12": ["up"],
  "13": ["up"],
  "14": ["up"],
  "21": ["up", "south"],
  "22": ["up", "south"],
  "23": ["up", "east"],
  "24": ["up", "east"],
  "31": ["south"],
  "32": ["south"],
  "33": ["east"],
  "34": ["east"],
};

/**
 * The X,Y position of each quadrant
 */
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

    this.interactive = true;
    // The hit area is a polygon that covers the entire tile (hexagon shape)
    this.hitArea = new Polygon([
      0, 7, 15, 0, 16, 0, 31, 7, 31, 15, 16, 22, 15, 22, 0, 15,
    ]);

    this.setQuadrants();

    const cursorUSprite = new Sprite(Texture.from("cursor-u.png"));
    const cursorESprite = new Sprite(Texture.from("cursor-e.png"));
    cursorESprite.anchor.set(-1, -0.5);
    const cursorSSprite = new Sprite(Texture.from("cursor-s.png"));
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
    this.setQuadrants();
  }

  public setQuadrants() {
    quadrantVariants.forEach((variant) => {
      const visibilityConditions = quadrantVariantVisibilityConditions[variant];
      const isHidden = visibilityConditions.every(
        (side) => this.neighbors[side] === false
      );
      if (isHidden) return;
      new Quadrant({
        type: this.type,
        variant,
        neighbors: this.neighbors,
        z: this.u,
        tile: this,
      });
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

/**
 * A quadrant
 * A tile is made of 12 quadrants (3 lines, 4 columns)
 */
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
    // find every textures for this type of tile into the cache of Pixi
    // TODO: use another system to register the textures instead of using Pixi's cache
    // @ts-expect-error idgaf
    const cache = Assets.cache._cache as Map<string, Texture>;
    const quadrantTextures = [...cache.keys()].filter((k) =>
      k.startsWith(`${type}-${variant}-`)
    );
    // score all the textures
    const texturesScores = quadrantTextures.map((textureName) =>
      scoreTexture({
        neighborsString,
        textureName,
        z,
      })
    );

    // find the best texture for this quadrant
    const best = maxBy(texturesScores, "score")!;
    const texture = Texture.from(best.textureName);
    if (!texture) {
      throw new Error(`Texture not found: "${best.textureName}"`);
    }
    // keep pixel art style
    texture.source.scaleMode = "nearest";
    const position = quadrantPosition[variant];

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
 * Score a texture for a quadrant
 * The higher the score the best this texture fit the neighbors of this quadrant
 */
const scoreTexture = ({
  textureName,
  neighborsString,
  z,
}: {
  textureName: string;
  neighborsString: string;
  z: number;
}) => {
  const regex = /^([a-z]+)-(\d+)-([a-z]+)(?:_(\d+))?\.png$/;
  const [, , , n, h] = textureName.match(regex)!;
  const score = n.split("").filter((c) => neighborsString.includes(c)).length;
  const isValidHeight = h ? (z % 2) + 1 === Number(h) : true;
  const isValid = score === n.length && isValidHeight;
  return { textureName, score: isValid ? score : -1 };
};
