import { FancyButton } from "@pixi/ui";
import { Viewport } from "pixi-viewport";
import type { Ticker } from "pixi.js";
import { Container, FillGradient, Graphics } from "pixi.js";
import { engine } from "../../getEngine";
import { IsoCoordinates } from "./IsometricCoordinate";
import { CursorAction, Map } from "./Map";
import { MapObject } from "./MapObject";
import mapData from "./maps/koring-wood.json";
import { Tile } from "./Tile";
import { TileFragmentsTextures } from "./TileFragmentsTextures";
import { Text } from "pixi.js";
import { clamp } from "lodash";

const tilesets = [
  "wall",
  "rock",
  // "rock_hole",
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

  public mapContainer: Viewport;
  private paused = false;
  private map: Map;
  public tileFragmentsTextures: TileFragmentsTextures;
  public cursorAction: CursorAction;
  public title: Text;

  constructor() {
    super();

    this.setBackground();

    const title = new Text({
      text: "Isometric Map Editor",
    });
    title.style.fill = "white";
    title.alpha = 0.5;
    title.style.fontFamily = "Final Fantasy Tactics Advance";
    title.anchor.set(1, 1);
    this.addChild(title);
    this.title = title;

    this.mapContainer = new Viewport({
      events: engine().renderer.events,
      screenWidth: engine().screen.width,
      screenHeight: engine().screen.height,
    });
    this.addChild(this.mapContainer);
    this.mapContainer.drag({ mouseButtons: "middle" }).pinch().wheel();

    this.tileFragmentsTextures = new TileFragmentsTextures();

    this.cursorAction = {
      entityType: "tile",
      type: tilesets[0],
      mode: "add",
    };
    const map = new Map(
      mapData,
      () => this.cursorAction,
      this.tileFragmentsTextures
    );
    this.map = map;
    this.mapContainer.addChild(map);

    this.mapContainer.scale.set(2, 2);

    this.initControls();
  }

  public setBackground() {
    const linearGradient = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: "#54b8f5" },
        { offset: 1, color: "#d5fcfd" },
      ],
      textureSpace: "local",
    });
    const background = new Graphics()
      .rect(0, 0, engine().screen.width, engine().screen.height)
      .fill(linearGradient);
    // this.removeChildAt(0);
    this.addChildAt(background, 0);
  }

  public extractToPng = async () => {
    const base64 = await engine().renderer.extract.base64(this.mapContainer);
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
    this.mapContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mapContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const isLandscape = width > height;
    this.setBackground();

    this.title.style.fontSize = clamp(Math.floor(width / 10), 50, 150);
    this.title.anchor.set(1, isLandscape ? 1 : 0);
    this.title.x = isLandscape ? width - 32 : width - 12;
    this.title.y = isLandscape ? height - 32 : 0;

    const centerX = Math.round(width * 0.5);
    const centerY = Math.round(height * 0.5);
    this.mapContainer.x = centerX;
    this.mapContainer.y = centerY;

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

    const graphics = new Graphics()
      .rect(0, 0, 52, engine().screen.height)
      .fill(0xf8f8e8)
      .stroke({ color: 0x202828, width: 2 });
    this.addChild(graphics);
    graphics.interactive = true;

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

    const removeJsonButton = new FancyButton({
      text: "❌",
      scale: 1.1,
      defaultTextAnchor: 0,
      animations: buttonAnimations,
    });
    removeJsonButton.onPress.connect(() => {
      this.cursorAction = {
        mode: "remove",
      };
    });
    this.addChild(removeJsonButton);
    this.controls.push(removeJsonButton);

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
        this.cursorAction = {
          entityType: "tile",
          type,
          mode: "add",
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
        this.cursorAction = {
          entityType: "object",
          type,
          mode: "add",
        };
      });
      this.addChild(button);
      this.controls.push(button);
    });
  }
}
