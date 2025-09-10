import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { Map } from "./Map";
import { FancyButton } from "@pixi/ui";
import mapData from "./map-data.json";

/** The screen that holds the app */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["game"];
  public rockButton: FancyButton;
  public wallButton: FancyButton;
  public dirtButton: FancyButton;

  public mainContainer: Container;
  private paused = false;
  private map: Map;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    const map = new Map(mapData, "rock");
    this.map = map;
    this.mainContainer.addChild(map);

    this.mainContainer.scale.set(2, 2);

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
    this.rockButton = new FancyButton({
      defaultView: "rock.png",
      anchor: 0,
      animations: buttonAnimations,
    });
    this.rockButton.onPress.connect(() => (this.map.type = "rock"));
    this.addChild(this.rockButton);

    this.wallButton = new FancyButton({
      defaultView: "wall.png",
      anchor: 0,
      animations: buttonAnimations,
    });
    this.wallButton.onPress.connect(() => (this.map.type = "wall"));
    this.addChild(this.wallButton);

    this.dirtButton = new FancyButton({
      defaultView: "dirt.png",
      anchor: 0,
      animations: buttonAnimations,
    });
    this.dirtButton.onPress.connect(() => (this.map.type = "dirt"));
    this.addChild(this.dirtButton);
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
    this.rockButton.x = 10;
    this.rockButton.y = 10;
    this.wallButton.x = 80;
    this.wallButton.y = 10;
    this.dirtButton.x = 150;
    this.dirtButton.y = 10;
  }

  /** Show screen with animations */
  public async show(): Promise<void> {}

  /** Hide screen with animations */
  public async hide() {}
}
