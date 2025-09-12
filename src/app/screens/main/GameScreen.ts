import { FancyButton } from "@pixi/ui";
import { Viewport } from "pixi-viewport";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { engine } from "../../getEngine";
import { IsoCoordinates } from "./IsometricCoordinate";
import { Map } from "./Map";
import mapData from "./maps/koring-wood.json";
import { Tile, TileNeighborhood } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";

const tilesets = [
  "wall",
  "rock",
  "rock_moss",
  "dirt",
  "dirt_grass1",
  "dirt_grass2",
  "dirt_stones",
] as const;

/** The screen that holds the app */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["game"];
  public controls: Array<FancyButton> = [];

  public mainContainer: Viewport;
  private paused = false;
  private map: Map;
  public tileFragmentsTextures: TileFragmentsTextures;

  constructor() {
    super();

    engine().renderer.resolution = 1;
    this.mainContainer = new Viewport({
      events: engine().renderer.events,
    });
    this.addChild(this.mainContainer);
    this.mainContainer.drag({ mouseButtons: "middle" }).pinch().wheel();

    this.tileFragmentsTextures = new TileFragmentsTextures();

    const map = new Map(mapData, tilesets[0], this.tileFragmentsTextures);
    this.map = map;
    this.mainContainer.addChild(map);

    this.mainContainer.scale.set(2, 2);

    this.initControls();
  }

  public extractToPng = async () => {
    const base64 = await engine().renderer.extract.base64(this.mainContainer);
    // Download as PNG
    const link = document.createElement("a");
    link.href = base64;
    link.download = "map.png";
    link.click();
  };

  public extractToJson = async () => {
    const json = this.map.toJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "map.json";
    link.click();
  };

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */

  public update(time: Ticker) {
    if (this.paused) return;
    this.map.update(time);
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;
    this.controls.forEach((control, i) => {
      control.x = 10;
      control.y = 10 + i * 34;
    });
  }

  /** Show screen with animations */
  public async show(): Promise<void> {}

  /** Hide screen with animations */
  public async hide() {}

  private initControls() {
    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };

    const downloadPngButton = new FancyButton({
      text: "⬇PNG",
      scale: 0.6,
      defaultTextAnchor: 0,
      animations: buttonAnimations,
    });
    downloadPngButton.onPress.connect(() => {
      this.extractToPng();
    });
    this.addChild(downloadPngButton);
    this.controls.push(downloadPngButton);

    const downloadJsonButton = new FancyButton({
      text: "⬇JSON",
      scale: 0.6,
      defaultTextAnchor: 0,
      animations: buttonAnimations,
    });
    downloadJsonButton.onPress.connect(() => {
      this.extractToJson();
    });
    this.addChild(downloadJsonButton);
    this.controls.push(downloadJsonButton);

    const neighborhood: TileNeighborhood = {
      up: undefined,
      north: undefined,
      south: undefined,
      east: undefined,
      west: undefined,
      down: undefined,
    };

    const isoCoordinates = new IsoCoordinates(0, 0, 0);

    tilesets.forEach((type) => {
      const button = new FancyButton({
        defaultView: new Tile({
          isoCoordinates,
          type,
          neighborhood,
          disableCursor: true,
          tileFragmentsTextures: this.tileFragmentsTextures,
        }),
        anchor: 0,
        animations: buttonAnimations,
      });
      button.onPress.connect(() => {
        this.map.type = type;
      });
      this.addChild(button);
      this.controls.push(button);
    });
  }
}
