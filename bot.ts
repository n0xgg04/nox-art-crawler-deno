import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  REST,
  Routes,
  ChatInputCommandInteraction,
  SlashCommandStringOption,
  Interaction,
} from "discord.js";
import { Buffer } from "node:buffer";
import {
  API,
  LabelAPI,
  APIJoyTick,
  JSON as HeroNames,
} from "./constants/api.ts";
import { discordQueue } from "./core/queue.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const CLIENT_ID = Deno.env.get("CLIENT_ID");

if (!BOT_TOKEN || !CLIENT_ID) {
  console.error("BOT_TOKEN and CLIENT_ID environment variables are required!");
  Deno.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let crawlerRunning = false;
let lastCrawlerPing = Date.now();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findImageInAPIs(
  id: string,
  apiSet: Record<string, string>,
  placeholder: string
): Promise<{
  found: boolean;
  url?: string;
  server?: string;
  data?: ArrayBuffer;
}> {
  for (const [server, api] of Object.entries(apiSet)) {
    const apiLink = api.replace(placeholder, id);

    try {
      const response = await fetch(apiLink, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const imageData = await response.arrayBuffer();
        return {
          found: true,
          url: apiLink,
          server: server,
          data: imageData,
        };
      }
    } catch (error) {
      console.error(`Error fetching ${id} from ${server}:`, error);
    }
  }

  return { found: false };
}

const commands = [
  new SlashCommandBuilder()
    .setName("check")
    .setDescription("Check if the crawler is currently running"),

  new SlashCommandBuilder()
    .setName("art")
    .setDescription("Get art image by ID")
    .addStringOption((option: SlashCommandStringOption) =>
      option
        .setName("id")
        .setDescription("Art ID to search for")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("label")
    .setDescription("Get label image by ID")
    .addStringOption((option: SlashCommandStringOption) =>
      option
        .setName("id")
        .setDescription("Label ID to search for")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("joystick")
    .setDescription("Get joystick image by ID")
    .addStringOption((option: SlashCommandStringOption) =>
      option
        .setName("id")
        .setDescription("Joystick ID to search for")
        .setRequired(true)
    ),
];

client.once("ready", async () => {
  console.log(`🤖 Bot ${client.user?.username} is ready!`);

  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

  try {
    console.log("📝 Refreshing application (/) commands...");

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands.map((cmd) => cmd.toJSON()),
    });

    console.log("✅ Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("❌ Error refreshing commands:", error);
  }

  setInterval(() => {
    crawlerRunning = Date.now() - lastCrawlerPing < 120000;
  }, 30000);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "check": {
      const queueSize = discordQueue.getSize();
      const queuePending = discordQueue.getPending();
      const status = crawlerRunning ? "🟢 Running" : "🔴 Not Running";
      const lastSeen = new Date(lastCrawlerPing).toLocaleString();

      const embed = new EmbedBuilder()
        .setTitle("📊 Crawler Status")
        .addFields(
          { name: "Status", value: status, inline: true },
          { name: "Queue Size", value: queueSize.toString(), inline: true },
          { name: "Processing", value: queuePending.toString(), inline: true },
          { name: "Last Seen", value: lastSeen, inline: false }
        )
        .setColor(crawlerRunning ? 0x00ff00 : 0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      break;
    }

    case "art": {
      const id = interaction.options.getString("id");
      if (!id) return;

      await interaction.reply(`🔍 Searching for art ID: ${id}...`);

      const result = await findImageInAPIs(id, API, "##ID##");

      if (result.found && result.data) {
        const heroName =
          (HeroNames as Record<string, string>)[id.slice(0, 3)] ||
          "Unknown Hero";
        const attachment = new AttachmentBuilder(Buffer.from(result.data), {
          name: `${id}.jpg`,
        });

        await interaction.editReply({
          content: `🎨 Found art for **${heroName}** (ID: ${id}) from server **${result.server}**`,
          files: [attachment],
        });
      } else {
        await interaction.editReply(
          `❌ Art with ID **${id}** not found in any server.`
        );
      }
      break;
    }

    case "label": {
      const id = interaction.options.getString("id");
      if (!id) return;

      await interaction.reply(`🔍 Searching for label ID: ${id}...`);

      const result = await findImageInAPIs(id, LabelAPI, "##ID##");

      if (result.found && result.data) {
        const heroName =
          (HeroNames as Record<string, string>)[id.slice(0, 3)] ||
          "Unknown Hero";
        const attachment = new AttachmentBuilder(Buffer.from(result.data), {
          name: `${id}.png`,
        });

        await interaction.editReply({
          content: `🏷️ Found label for **${heroName}** (ID: ${id}) from server **${result.server}**`,
          files: [attachment],
        });
      } else {
        await interaction.editReply(
          `❌ Label with ID **${id}** not found in any server.`
        );
      }
      break;
    }

    case "joystick": {
      const id = interaction.options.getString("id");
      if (!id) return;

      await interaction.reply(`🔍 Searching for joystick ID: ${id}...`);

      const result = await findImageInAPIs(id, APIJoyTick, "$ID$");

      if (result.found && result.data) {
        const attachment = new AttachmentBuilder(Buffer.from(result.data), {
          name: `${id}.png`,
        });

        await interaction.editReply({
          content: `🕹️ Found joystick for ID **${id}** from server **${result.server}**`,
          files: [attachment],
        });
      } else {
        await interaction.editReply(
          `❌ Joystick with ID **${id}** not found in any server.`
        );
      }
      break;
    }
  }
});

export function updateCrawlerStatus() {
  lastCrawlerPing = Date.now();
  crawlerRunning = true;
}

if (import.meta.main) {
  console.log("🚀 Starting Discord bot...");
  await client.login(BOT_TOKEN);
}
