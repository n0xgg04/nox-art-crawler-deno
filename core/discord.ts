import axios from "npm:axios";

const isLoggingEnabled = !Deno.args.includes("--no-log");

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

class Discord {
  private getWebhookUrl(type: "art" | "label" | "joystick" | "frame"): string {
    const urlMap = {
      art: Deno.env.get("DISCORD_WEBHOOK_URL"),
      label: Deno.env.get("DISCORD_LABEL_URL"),
      joystick: Deno.env.get("DISCORD_JOYSTICK_URL"),
      frame: Deno.env.get("DISCORD_FRAME_URL"),
    };

    const url = urlMap[type];
    if (!url || url === "test") {
      logger.warn(
        `No valid webhook URL found for ${type}, skipping Discord notification`
      );
      return "";
    }
    return url;
  }

  async sendMessage(
    message: string,
    type: "art" | "label" | "joystick" | "frame" = "art"
  ) {
    const webhookUrl = this.getWebhookUrl(type);
    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
        }),
      });
      return response.json();
    } catch (error) {
      logger.error(`Failed to send message to ${type} channel:`, error);
    }
  }

  async sendMessageWithImage(
    message: string,
    imagePath: string,
    type: "art" | "label" | "joystick" | "frame" = "art"
  ) {
    const webhookUrl = this.getWebhookUrl(type);
    if (!webhookUrl) return;

    try {
      const imageData = await Deno.readFile(imagePath);
      const fileName = imagePath.split("/").pop() || "image.png";

      const formData = new FormData();
      formData.append("content", message);
      formData.append("file", new Blob([imageData]), fileName);

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });

      return response.json();
    } catch (error) {
      logger.error(
        `Failed to send image ${imagePath} to ${type} channel:`,
        error
      );
      await this.sendMessage(message + " (Image upload failed)", type);
    }
  }

  async sendImageWithMessage(
    message: string,
    imageData: Uint8Array,
    fileName: string,
    type: "art" | "label" | "joystick" | "frame" = "art"
  ) {
    const webhookUrl = this.getWebhookUrl(type);
    if (!webhookUrl) return;

    try {
      const formData = new FormData();
      formData.append("content", message);
      formData.append("file", new Blob([imageData]), fileName);

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });

      return response.json();
    } catch (error) {
      logger.error(
        `Failed to send image ${fileName} to ${type} channel:`,
        error
      );
      await this.sendMessage(message + " (Image upload failed)", type);
    }
  }
}

export const discord = new Discord();
