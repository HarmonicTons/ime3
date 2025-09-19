import { clamp } from "lodash";
import { Viewport } from "pixi-viewport";
import type { Ticker } from "pixi.js";
import { Container, FillGradient, Graphics, Text } from "pixi.js";
import { engine } from "../../getEngine";
import { ControlBar } from "./ControlBar";
import { Map } from "./Map";
import mapData from "./maps/koring-wood.json";
import { TileFragmentsTextures } from "./TileFragmentsTextures";

export type CursorAction =
  | {
      entityType: "tile" | "object";
      type: string;
      mode: "add";
    }
  | {
      mode: "remove";
    };

/** The screen that holds the app */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["game"];
  public controlBar: ControlBar;

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
      type: "dirt",
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

    this.controlBar = new ControlBar({
      onClickRemove: () => {
        this.cursorAction = {
          mode: "remove",
        };
      },
      onClickTile: (type) => {
        this.cursorAction = {
          entityType: "tile",
          type,
          mode: "add",
        };
      },
      onClickObject: (type) => {
        this.cursorAction = {
          entityType: "object",
          type,
          mode: "add",
        };
      },
      tileFragmentsTextures: this.tileFragmentsTextures,
    });
    this.addChild(this.controlBar);
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

    this.controlBar.resize(width, height);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {}

  /** Hide screen with animations */
  public async hide() {}
}
