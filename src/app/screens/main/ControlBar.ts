import { Container, Graphics } from "pixi.js";
import { MapObject } from "./MapObject";
import { Tile } from "./Tile";
import { engine } from "../../getEngine";
import { FancyButton } from "@pixi/ui";
import { TileFragmentsTextures } from "./TileFragmentsTextures";
import { IsoCoordinates } from "./IsometricCoordinate";
import { CursorAction } from "./GameScreen";

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

type Control = {
  button: FancyButton;
  type: string;
};

export class ControlBar extends Container {
  public controls: Control[] = [];
  public background: Graphics;
  private getCursorAction: () => CursorAction;

  constructor({
    onClickRemove,
    onClickObject,
    onClickTile,
    tileFragmentsTextures,
    getCursorAction,
  }: {
    onClickRemove: () => void;
    onClickTile: (type: string) => void;
    onClickObject: (type: string) => void;
    tileFragmentsTextures: TileFragmentsTextures;
    getCursorAction: () => CursorAction;
  }) {
    super();
    this.getCursorAction = getCursorAction;

    const background = new Graphics()
      .rect(0, 0, 68, engine().screen.height)
      .fill(0xf8f8e8)
      .stroke({ color: 0x202828, width: 2 });
    this.addChild(background);
    background.interactive = true;
    this.background = background;

    // const downloadPngButton = new FancyButton({
    //   text: "⬇PNG",
    //   scale: 0.6,
    //   defaultTextAnchor: 0,
    //   animations: buttonAnimations,
    // });
    // downloadPngButton.onPress.connect(() => {
    //   this.extractToPng();
    // });
    // this.addChild(downloadPngButton);
    // this.controls.push(downloadPngButton);

    // const downloadJsonButton = new FancyButton({
    //   text: "⬇JSON",
    //   scale: 0.6,
    //   defaultTextAnchor: 0,
    //   animations: buttonAnimations,
    // });
    // downloadJsonButton.onPress.connect(() => {
    //   this.extractToJson();
    // });
    // this.addChild(downloadJsonButton);
    // this.controls.push(downloadJsonButton);

    const removeButton = new FancyButton({
      text: "❌",
      scale: 1.2,
      defaultTextAnchor: 0.5,
      animations: buttonAnimations,
    });
    removeButton.onPress.connect(() => {
      onClickRemove();
      this.update();
    });
    this.addChild(removeButton);
    this.controls.push({ button: removeButton, type: "remove" });

    const isoCoordinates = new IsoCoordinates(0, 0, 0);

    tilesets.forEach((type) => {
      const button = new FancyButton({
        defaultView: new Tile({
          isoCoordinates,
          type,
          getTileNeighbor: () => undefined,
          disableCursor: true,
          tileFragmentsTextures,
        }),
        scale: 1.5,
        anchor: 0.5,
        animations: buttonAnimations,
      });
      button.onPress.connect(() => {
        onClickTile(type);
        this.update();
      });
      this.addChild(button);
      this.controls.push({ button, type });
    });

    mapObjects.forEach((type) => {
      const button = new FancyButton({
        defaultView: new MapObject({
          isoCoordinates,
          type,
        }),
        scale: 1.5,
        anchor: 0.5,
        animations: buttonAnimations,
      });
      button.onPress.connect(() => {
        onClickObject(type);
        this.update();
      });
      this.addChild(button);
      this.controls.push({ button, type });
    });

    this.update();
  }

  public resize(_width: number, height: number) {
    this.background.clear();
    this.background
      .rect(0, 0, 68, height)
      .fill(0xf8f8e8)
      .stroke({ color: 0x202828, width: 2 });

    let y = 10;
    this.controls.forEach(({ button }) => {
      button.x = 32;
      button.y = y + button.height / 2;
      y += button.height + 10;
    });
  }

  public update() {
    const cursorAction = this.getCursorAction();
    this.controls.forEach(({ button, type }) => {
      if (cursorAction.mode === "remove") {
        if (type === "remove") {
          button.alpha = 1;
          return;
        }
        button.alpha = 0.5;
        return;
      }

      if (cursorAction.type === type) {
        button.alpha = 1;
        return;
      }

      button.alpha = 0.5;
    });
  }
}
