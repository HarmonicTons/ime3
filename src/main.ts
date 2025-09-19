import { setEngine } from "./app/getEngine";
import { LoadScreen } from "./app/screens/LoadScreen";
import { GameScreen } from "./app/screens/main/GameScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import "@pixi/sound";
// import "@esotericsoftware/spine-pixi-v8";

(async () => {
  // Ensure the font is loaded before starting the application
  await document.fonts.load('1em "Final Fantasy Tactics Advance"');
  // Create a new creation engine instance
  const engine = new CreationEngine();
  setEngine(engine);

  // Initialize the creation engine instance
  await engine.init({
    background: "#202828",
    resizeOptions: { minWidth: 0, minHeight: 0, letterbox: false },
    // pixel-perfect option: disabled because it generates small gaps on some zoom level
    // roundPixels: true,
    resolution: window.devicePixelRatio ?? 1,
    resizeTo: window,
    autoDensity: true,
  });

  // Initialize the user settings
  userSettings.init();

  // Show the load screen
  await engine.navigation.showScreen(LoadScreen);
  // Show the main screen once the load screen is dismissed
  await engine.navigation.showScreen(GameScreen);
})();
