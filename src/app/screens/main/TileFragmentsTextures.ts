import { Assets, Texture } from "pixi.js";
import { IsoDirection, isoDirections } from "./IsometricCoordinate";
import { TileFragmentKey } from "./TileFragment";
import { maxBy, sumBy } from "lodash";
import { TileNeighborhood } from "./Tile";

export type TextureData = {
  name: string;
  type: string;
  fragment: TileFragmentKey;
  height: [number, number] | null;
  score: number;
} & Record<IsoDirection, string>;

export type FragmentData = {
  type: string;
  fragment: TileFragmentKey;
  neighborhood: TileNeighborhood;
  height: number;
};

export type TextureByFragment = Map<TileFragmentKey, Array<TextureData>>;

export type TextureByTileType = Map<string, TextureByFragment>;

export class TileFragmentsTextures {
  public texturesInCache: TextureByTileType;
  constructor() {
    this.texturesInCache = new Map();

    this.init();
  }

  public static parseTextureName(textureName: string): TextureData {
    const [type, fragment, neighborhoodStr, height] = textureName
      .slice(0, ".png".length * -1)
      .split("-");

    const neighborhood = neighborhoodStr.split(",");

    const score = sumBy(neighborhood, (n) => {
      if (n === "*") return 0;
      if (n === "!") return 1;
      return 2;
    });

    const [up, north, east, south, west, down] = neighborhood;

    return {
      name: textureName,
      type,
      fragment: fragment as TileFragmentKey,
      up,
      north,
      east,
      south,
      west,
      down,
      score,
      height: height
        ? (height.split(":").map(Number) as [number, number])
        : null,
    };
  }

  public static isTexureValid({
    fragmentData,
    textureData,
  }: {
    textureData: TextureData;
    fragmentData: FragmentData;
  }): boolean {
    if (textureData.type !== fragmentData.type) {
      return false;
    }
    if (textureData.fragment !== fragmentData.fragment) {
      return false;
    }
    if (textureData.height) {
      const [mod, val] = textureData.height;
      if (fragmentData.height % mod !== val - 1) {
        return false;
      }
    }
    return isoDirections.every((dir) => {
      const neighborType = fragmentData.neighborhood[dir];
      const requirement = textureData[dir];
      if (requirement === "*") return true;
      if (requirement === "0") return neighborType === undefined;
      if (requirement === "1") return neighborType !== undefined;
      if (requirement === "=")
        return TileFragmentsTextures.areSameTypes(
          neighborType,
          fragmentData.type
        );
      if (requirement === "!")
        return (
          TileFragmentsTextures.areSameTypes(
            neighborType,
            fragmentData.type
          ) === false
        );
      return neighborType === requirement;
    });
  }

  public static areSameTypes(type1?: string, type2?: string): boolean {
    if (type1 === type2) return true;
    const baseType1 = type1?.split("_")[0];
    const baseType2 = type2?.split("_")[0];
    return baseType1 === baseType2;
  }

  private init() {
    // TODO: use another system to register the textures instead of using Pixi's cache
    // @ts-expect-error hack to access private property
    const cache = Assets.cache._cache as Map<string, Texture>;
    const fragmentTextureRegex =
      /([a-z0-9]+)-([1-4]{2})-([^,]+,){5}[^,]+(-\d+:\d+)?\.png/;
    const validTextures = [...cache.keys()].filter((k) =>
      fragmentTextureRegex.test(k)
    );
    validTextures.forEach((textureName) => {
      const data = TileFragmentsTextures.parseTextureName(textureName);

      if (!this.texturesInCache.has(data.type)) {
        this.texturesInCache.set(data.type, new Map());
      }
      const byFragment = this.texturesInCache.get(data.type)!;
      if (!byFragment.has(data.fragment)) {
        byFragment.set(data.fragment, []);
      }
      const textures = byFragment.get(data.fragment)!;
      textures.push(data);
    });
  }

  public getAllValidTexturesForFragment(
    fragmentData: FragmentData
  ): Array<TextureData> {
    const typeTextures = this.texturesInCache.get(fragmentData.type);
    if (!typeTextures) {
      return [];
    }
    const fragmentTextures = typeTextures.get(fragmentData.fragment);
    if (!fragmentTextures) {
      return [];
    }
    return fragmentTextures.filter((textureData) =>
      TileFragmentsTextures.isTexureValid({
        textureData,
        fragmentData,
      })
    );
  }

  public getFragmentTexture(fragmentData: FragmentData): Texture | null {
    const validTextures = this.getAllValidTexturesForFragment(fragmentData);
    if (validTextures.length === 0) {
      return null;
    }
    const textureData = maxBy(validTextures, "score")!;
    const texture = Texture.from(textureData.name);
    if (!texture) {
      return null;
    }
    // keep pixel art style
    texture.source.scaleMode = "nearest";
    return texture;
  }
}
