import { FancyButton } from "@pixi/ui";
import { Viewport } from "pixi-viewport";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { engine } from "../../getEngine";
import { IsoCoordinates } from "./IsometricCoordinate";
import { CursorAction, Map } from "./Map";
import { MapObject } from "./MapObject";
import mapData from "./maps/deti-plains.json";
import { Tile } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";

const tilesets = [
  "wall",
  "rock",
  "rock_moss",
  "dirt",
  "dirt_grass1",
  "dirt_grass2",
  "dirt_stones",
  "dirt_pile",
  "dirt_bush",
] as const;

const mapObjects = [
  "flower",
  "small_pine",
  "large_pine",
  "large-rock",
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

    this.mainContainer = new Viewport({
      events: engine().renderer.events,
      // HACK: the * 2 should not be necessary,
      // but idk why without it the full screen is not interactive
      screenWidth: window.innerWidth * 2,
      screenHeight: window.innerHeight * 2,
    });
    this.addChild(this.mainContainer);
    this.mainContainer.drag({ mouseButtons: "middle" }).pinch().wheel();

    this.tileFragmentsTextures = new TileFragmentsTextures();

    const cursorAction: CursorAction = {
      entityType: "tile",
      type: tilesets[0],
    };
    const map = new Map(mapData, cursorAction, this.tileFragmentsTextures);
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
    const centerX = Math.round(width * 0.5);
    const centerY = Math.round(height * 0.5);

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;
    let y = 0;
    this.controls.forEach((control) => {
      control.x = 10;
      control.y = 10 + y;
      y += control.height + 10;
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

    const isoCoordinates = new IsoCoordinates(0, 0, 0);

    tilesets.forEach((type) => {
      const button = new FancyButton({
        defaultView: new Tile({
          isoCoordinates,
          type,
          getTileNeighbor: () => undefined,
          disableCursor: true,
          tileFragmentsTextures: this.tileFragmentsTextures,
        }),
        anchor: 0,
        animations: buttonAnimations,
      });
      button.onPress.connect(() => {
        this.map.currentCursorAction = {
          entityType: "tile",
          type,
        };
      });
      this.addChild(button);
      this.controls.push(button);
    });

    mapObjects.forEach((type) => {
      const button = new FancyButton({
        defaultView: new MapObject({
          isoCoordinates,
          type,
        }),
        anchor: 0,
        animations: buttonAnimations,
      });
      button.onPress.connect(() => {
        this.map.currentCursorAction = {
          entityType: "object",
          type,
        };
      });
      this.addChild(button);
      this.controls.push(button);
    });
  }
}
