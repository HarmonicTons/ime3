import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { Map } from "./Map";

/** The screen that holds the app */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["game"];

  public mainContainer: Container;
  private paused = false;
  private map: Map;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    const map = new Map(4, 4, 8);
    this.map = map;
    this.mainContainer.addChild(map);

    this.mainContainer.scale.set(4, 4);
  }

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
  }

  /** Show screen with animations */
  public async show(): Promise<void> {}

  /** Hide screen with animations */
  public async hide() {}
}
