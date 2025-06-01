import { discord } from "./core/discord.ts";

console.log("Testing Discord integration...");

try {
  await discord.sendMessage(
    "🔍 Image Crawler Test: Discord integration is working!"
  );
  console.log("✅ Discord notification sent successfully!");
} catch (error) {
  console.error("❌ Failed to send Discord notification:", error);
  console.log("Make sure to set DISCORD_WEBHOOK_URL in your .env file");
}
