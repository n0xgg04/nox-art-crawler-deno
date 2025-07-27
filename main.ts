import {
  heroList,
  API,
  avatarFrameAPI,
  avatarFrameType,
  APIJoyTick,
  LabelAPI,
  JSON as HeroNames,
} from "./constants/api.ts";
import { discord } from "./core/discord.ts";
import { discordQueue } from "./core/queue.ts";
import { ensureDir, exists } from "@std/fs";

let updateCrawlerStatus: (() => void) | undefined;

try {
  const botModule = await import("./bot.ts");
  updateCrawlerStatus = botModule.updateCrawlerStatus;
} catch {
  updateCrawlerStatus = undefined;
}

interface FoundItem {
  id: string;
  apiLink: string;
  server: string;
  foundAt: string;
}

let Found: FoundItem[] = [];
let Found2: FoundItem[] = [];

const args = Deno.args;
const isLoggingEnabled = !args.includes("--no-log");

const getRolePing = (): string => {
  const roleId = Deno.env.get("ROLE_ID");
  return roleId ? ` <@&${roleId}>` : "";
};

const logger = {
  log: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.warn(...args);
    }
  },
};

const queue = {
  add: async (fn: () => Promise<void>) => {
    await fn();
    await new Promise((resolve) => setTimeout(resolve, 3000));
  },
};

async function saveImageToDisk(
  imageData: ArrayBuffer,
  filePath: string
): Promise<void> {
  await Deno.writeFile(filePath, new Uint8Array(imageData));
  logger.log(`Saved image to disk: ${filePath}`);
}

async function crawlLabelImages(hero: string) {
  let failed = 0;
  const heroDir = `./data/label/${hero}/`;
  await ensureDir(heroDir);

  for (let i = 1; i <= 30 && failed < 17; i++) {
    let skinId = `${hero}`;
    if (i < 10) skinId = skinId.concat("0");
    skinId = skinId.concat(`${i.toString()}`);

    const filePath = `${heroDir}${skinId}.png`;
    if (await exists(filePath)) {
      continue;
    }

    let isFound = false;

    for (const [server, api] of Object.entries(LabelAPI)) {
      const apiLink = api.replace("##ID##", skinId);

      try {
        const response = await fetch(apiLink, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const imageData = await response.arrayBuffer();
          const heroName =
            (HeroNames as Record<string, string>)[hero] || "Unknown Hero";

          await saveImageToDisk(imageData, filePath);

          await discordQueue.add(() =>
            discord.sendImageWithMessage(
              `🏷️ [Label Crawler] Found new skin label: ${skinId} - ${heroName} (Server: ${server})${getRolePing()}`,
              new Uint8Array(imageData),
              `${skinId}.png`,
              "label"
            )
          );

          logger.log(`Found new label ${skinId} at server ${server}`);

          Found2.push({
            id: skinId,
            apiLink: apiLink,
            server: server,
            foundAt: new Date().toISOString(),
          });
          isFound = true;
          break;
        } else {
          logger.log(`Not found ${skinId} at server ${server}`);
        }
      } catch (error) {
        logger.error(
          `Error fetching ${skinId} from ${server}:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      if (isFound) break;
    }

    if (!isFound) failed++;
  }
}

async function crawlImages(hero: string) {
  let failed = 0;
  const heroDir = `./data/art/${hero}/`;
  await ensureDir(heroDir);

  for (let i = 0; i <= 30 && failed < 4; i++) {
    let skinId = `${hero}`;
    if (i < 10) skinId = skinId.concat("0");
    skinId = skinId.concat(`${i.toString()}`);

    const filePath = `${heroDir}${skinId}.jpg`;
    if (await exists(filePath)) {
      continue;
    }

    let isFound = false;

    for (const [server, api] of Object.entries(API)) {
      const apiLink = api.replace("##ID##", skinId);

      try {
        const response = await fetch(apiLink, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const imageData = await response.arrayBuffer();
          const heroName =
            (HeroNames as Record<string, string>)[hero] || "Unknown Hero";

          await saveImageToDisk(imageData, filePath);

          await discordQueue.add(() =>
            discord.sendImageWithMessage(
              `🎨 [Art Crawler] Found new skin art ID: ${skinId} - ${heroName} (Server: ${server})${getRolePing()}`,
              new Uint8Array(imageData),
              `${skinId}.jpg`,
              "art"
            )
          );

          logger.log(`Found new art ${skinId} at server ${server}`);

          Found.push({
            id: skinId,
            apiLink: apiLink,
            server: server,
            foundAt: new Date().toISOString(),
          });
          isFound = true;
          break;
        } else {
          logger.log(`Not found ${skinId} at server ${server}`);
        }
      } catch (error) {
        logger.error(
          `Error fetching ${skinId} from ${server}:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      if (isFound) break;
    }

    if (!isFound) failed++;
  }
}

async function crawlJoyTick(hero: string) {
  let failed = 0;

  for (let i = 0; i <= 30; i++) {
    let skinId = `${hero}`;
    if (i < 10) skinId = skinId.concat("0");
    skinId = skinId.concat(`${i.toString()}`);

    const filePath = `./data/joytick/${skinId}.jpg`;
    if (await exists(filePath)) {
      continue;
    }

    let isFound = false;

    for (const [server, api] of Object.entries(APIJoyTick)) {
      const apiLink = api.replace("$ID$", skinId);

      try {
        const response = await fetch(apiLink, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const imageData = await response.arrayBuffer();

          await saveImageToDisk(imageData, filePath);

          await discordQueue.add(() =>
            discord.sendImageWithMessage(
              `🕹️ [JoyTick Crawler] Found new joystick: ${skinId} (Server: ${server})${getRolePing()}`,
              new Uint8Array(imageData),
              `${skinId}.jpg`,
              "joystick"
            )
          );

          logger.log(`Found new joytick ${skinId} at server ${server}`);

          Found.push({
            id: skinId,
            apiLink: apiLink,
            server: server,
            foundAt: new Date().toISOString(),
          });
          isFound = true;
          break;
        }
      } catch (error) {
        logger.error(
          `Error fetching joytick ${skinId} from ${server}:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      if (isFound) break;
    }

    if (!isFound) failed++;
  }
}

async function crawlAvatarFrame(from: number, to: number) {
  await ensureDir("./data/frame/");

  for (let i = from; i <= to; i++) {
    const frameId = `HeadFrame${i}`;
    const filePath = `./data/frame/${frameId}.png`;

    if (await exists(filePath)) {
      continue;
    }

    for (const [server, api] of Object.entries(avatarFrameAPI)) {
      const apiLink = `${api}${frameId}.png`;

      try {
        const response = await fetch(apiLink, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const imageData = await response.arrayBuffer();

          await saveImageToDisk(imageData, filePath);

          await discordQueue.add(() =>
            discord.sendImageWithMessage(
              `🖼️ [Frame Crawler] Found new frame: ${frameId} (Server: ${server})${getRolePing()}`,
              new Uint8Array(imageData),
              `${frameId}.png`,
              "frame"
            )
          );

          logger.log(`Found frame type  ${i} at server ${server}`);
          break;
        }
      } catch (error) {
        logger.error(
          `Error fetching frame  ${i} from ${server}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const scanArt = async (): Promise<void> => {
  updateCrawlerStatus?.();
  Found = [];
  await Promise.all(heroList.map(crawlImages));
  logger.log(`Found ${Found.length} new art.`);
  logger.log("Scan again after 1min...");
};

const scanLabel = async (): Promise<void> => {
  updateCrawlerStatus?.();
  Found2 = [];
  await Promise.all(heroList.map(crawlLabelImages));
  logger.log(`Found ${Found2.length} new labels.`);
  logger.log("Scan again after 5min...");
};

const scanJoyTick = async (): Promise<void> => {
  updateCrawlerStatus?.();
  Found = [];
  await Promise.all(heroList.map(crawlJoyTick));
  logger.log("JoyTick scan completed.");
};

const scanFrame = async (): Promise<void> => {
  updateCrawlerStatus?.();
  await crawlAvatarFrame(600, 9999);
  logger.log("Frame scan completed.");
};

const scanAll = async (): Promise<void> => {
  logger.log("Starting all crawlers concurrently...");

  const artCrawler = async () => {
    while (true) {
      try {
        await scanArt();
        await sleep(1000 * 60 * 1);
      } catch (error) {
        logger.error("Art crawler error:", error);
        await sleep(1000 * 30);
      }
    }
  };

  const labelCrawler = async () => {
    while (true) {
      try {
        await scanLabel();
        await sleep(1000 * 60 * 5);
      } catch (error) {
        logger.error("Label crawler error:", error);
        await sleep(1000 * 60);
      }
    }
  };

  const joytickCrawler = async () => {
    while (true) {
      try {
        await scanJoyTick();
        await sleep(1000 * 60 * 10);
      } catch (error) {
        logger.error("Joytick crawler error:", error);
        await sleep(1000 * 60 * 2);
      }
    }
  };

  const frameCrawler = async () => {
    while (true) {
      try {
        await scanFrame();
        await sleep(1000 * 60 * 60);
      } catch (error) {
        logger.error("Frame crawler error:", error);
        await sleep(1000 * 60 * 10);
      }
    }
  };

  await Promise.all([
    artCrawler(),
    labelCrawler(),
    joytickCrawler(),
    // frameCrawler(),
  ]);
};

const command = args[0];

Deno.addSignalListener("SIGINT", async () => {
  logger.log("\nShutting down gracefully...");
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", async () => {
  logger.log("\nShutting down gracefully...");
  Deno.exit(0);
});

switch (command) {
  case "art":
    await ensureDir("./data/art/");
    logger.log(
      "Starting art crawler in 3 seconds... PRESS CTRL + C TO STOP..."
    );
    await sleep(3000);
    while (true) {
      await scanArt();
      await sleep(1000 * 60 * 1);
    }
    break;

  case "label":
    await ensureDir("./data/label/");
    logger.log(
      "Starting label crawler in 3 seconds... PRESS CTRL + C TO STOP..."
    );
    await sleep(3000);
    while (true) {
      await scanLabel();
      await sleep(1000 * 60 * 5);
    }
    break;

  case "frame":
    await ensureDir("./data/frame/");
    await scanFrame();
    break;

  case "joytick":
    await ensureDir("./data/joytick/");
    await scanJoyTick();
    break;

  case "all":
    await ensureDir("./data/art/");
    await ensureDir("./data/label/");
    await ensureDir("./data/frame/");
    await ensureDir("./data/joytick/");
    logger.log(
      "Starting ALL crawlers in 3 seconds... PRESS CTRL + C TO STOP..."
    );
    await sleep(3000);
    await scanAll();
    break;

  default:
    logger.log(`Invalid command: ${command}`);
    logger.log("Available commands: art, label, frame, joytick, all");
    Deno.exit(1);
}
