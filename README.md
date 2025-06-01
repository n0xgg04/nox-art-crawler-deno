# Game Image Crawler

A Deno-based image crawler that downloads game assets (art, labels, joystick, avatar frames) and sends Discord notifications with role pings when new images are found. Uses file-based duplicate detection and supports multi-channel Discord notifications.

## Features

- ✅ **Multi-Channel Discord Notifications**: Send different content types to different Discord channels
- ✅ **Role Pings**: Configurable role notifications for new discoveries
- ✅ **File-Based Deduplication**: Uses file existence checks to prevent downloading duplicates
- ✅ **Multi-Threading**: Run all crawlers concurrently with the "all" command
- ✅ **Quiet Mode**: `--no-log` flag for silent operation
- ✅ **Multiple API Sources**: Tries multiple game servers to find images
- ✅ **Organized Storage**: Saves images in organized directory structure
- ✅ **Error Handling**: Robust error handling with timeouts
- ✅ **Rate Limiting**: Built-in delays to prevent overwhelming Discord API
- ✅ **Graceful Shutdown**: Handles SIGINT/SIGTERM signals properly

## Setup

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Discord Webhook URLs for different content types
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ART_WEBHOOK_ID/YOUR_ART_WEBHOOK_TOKEN
DISCORD_LABEL_URL=https://discord.com/api/webhooks/YOUR_LABEL_WEBHOOK_ID/YOUR_LABEL_WEBHOOK_TOKEN
DISCORD_JOYSTICK_URL=https://discord.com/api/webhooks/YOUR_JOYSTICK_WEBHOOK_ID/YOUR_JOYSTICK_WEBHOOK_TOKEN
DISCORD_FRAME_URL=https://discord.com/api/webhooks/YOUR_FRAME_WEBHOOK_ID/YOUR_FRAME_WEBHOOK_TOKEN

# Discord Role ID to ping (without <@& and > - just the number)
ROLE_ID=1378645826489815050
```

### 2. Install Deno

Make sure you have [Deno](https://deno.land/) installed.

### 3. API Configuration

Configure the game server endpoints in `constants/api.ts`. Replace the placeholder URLs with actual game server endpoints:

```typescript
// constants/api.ts
export const API = {
  server1: "https://example-server1.com/path/to/art/##ID##.jpg",
  server2: "https://example-server2.com/path/to/art/##ID##.jpg",
  server3: "https://example-server3.com/path/to/art/##ID##.jpg",
  // Add more servers as needed
};

export const LabelAPI = {
  server1: "https://example-server1.com/path/to/labels/##ID##.png",
  server2: "https://example-server2.com/path/to/labels/##ID##.png",
  // Add more servers as needed
};

export const APIJoyTick = {
  server1: "https://example-server1.com/path/to/joystick/$ID$/filename.png",
  server2: "https://example-server2.com/path/to/joystick/$ID$/filename.png",
  // Add more servers as needed
};

export const avatarFrameAPI = {
  server1: "https://example-server1.com/path/to/frames/",
  server2: "https://example-server2.com/path/to/frames/",
  // Add more servers as needed
};

// Hero ID to name mapping
export const JSON = {
  "105": "Hero Name 1",
  "106": "Hero Name 2",
  // Add more hero mappings
};
```

**Important Notes:**
- Replace `##ID##` with hero skin ID placeholder for art and label APIs
- Replace `$ID$` with hero skin ID placeholder for joystick API  
- The `JSON` object maps hero IDs to display names
- The crawler will try each server until it finds a valid image
- Add or remove servers as needed for your game

## Build & Compile

### Compile to Standalone Executable

Create standalone executables that don't require Deno to be installed:

```bash
# Compile for current platform
deno compile --allow-env --allow-read --allow-write --allow-net --output crawler main.ts

# Compile for specific platforms
deno compile --allow-env --allow-read --allow-write --allow-net --target x86_64-pc-windows-msvc --output crawler-windows.exe main.ts
deno compile --allow-env --allow-read --allow-write --allow-net --target x86_64-unknown-linux-gnu --output crawler-linux main.ts
deno compile --allow-env --allow-read --allow-write --allow-net --target x86_64-apple-darwin --output crawler-macos main.ts
deno compile --allow-env --allow-read --allow-write --allow-net --target aarch64-apple-darwin --output crawler-macos-arm64 main.ts
```

### Add Compile Tasks to deno.json

Add these tasks to your `deno.json` for easy compilation:

```json
{
  "tasks": {
    "build": "deno compile --allow-env --allow-read --allow-write --allow-net --output crawler main.ts",
    "build:windows": "deno compile --allow-env --allow-read --allow-write --allow-net --target x86_64-pc-windows-msvc --output crawler-windows.exe main.ts",
    "build:linux": "deno compile --allow-env --allow-read --allow-write --allow-net --target x86_64-unknown-linux-gnu --output crawler-linux main.ts",
    "build:macos": "deno compile --allow-env --allow-read --allow-write --allow-net --target x86_64-apple-darwin --output crawler-macos main.ts",
    "build:macos-arm": "deno compile --allow-env --allow-read --allow-write --allow-net --target aarch64-apple-darwin --output crawler-macos-arm64 main.ts",
    "build:all": "deno task build:windows && deno task build:linux && deno task build:macos && deno task build:macos-arm"
  }
}
```

### Usage After Compilation

Once compiled, run the executable directly:

```bash
# Run compiled executable
./crawler all --no-log

# Windows
crawler-windows.exe all --no-log

# With environment file
./crawler all --no-log  # Will automatically load .env if present
```

### Available Targets

| Target | Platform | Architecture |
|--------|----------|--------------|
| `x86_64-pc-windows-msvc` | Windows | x64 |
| `x86_64-unknown-linux-gnu` | Linux | x64 |
| `x86_64-apple-darwin` | macOS | Intel |
| `aarch64-apple-darwin` | macOS | Apple Silicon |

### JavaScript Bundling

Create JavaScript bundles that can run with Node.js:

```bash
# Bundle to JavaScript
deno task bundle                    # Creates dist/crawler.js
deno task bundle:minify            # Creates minified version (requires terser)

# Manual bundling
deno bundle main.ts dist/crawler.js
```

### JavaScript Execution

Run the bundled JavaScript with Node.js:

```bash
# Run all crawlers
deno task js:all                   # With logs
deno task js:all:no-log           # Silent mode

# Run individual crawlers
deno task js:art                   # Art crawler
deno task js:art:no-log           # Art crawler (silent)
deno task js:label                # Label crawler
deno task js:label:no-log         # Label crawler (silent)
deno task js:frame                # Frame crawler
deno task js:frame:no-log         # Frame crawler (silent)
deno task js:joytick              # Joystick crawler
deno task js:joytick:no-log       # Joystick crawler (silent)

# Direct Node.js execution
node dist/crawler.js all --no-log
```

### JavaScript Requirements

To run the JavaScript bundle, you need:

1. **Node.js** (version 16 or later)
2. **Environment file** (`.env`) in the same directory
3. **Required directories** (`data/` folder structure)

### Bundle vs Executable Comparison

| Method | Pros | Cons |
|--------|------|------|
| **Deno Executable** | Single file, no dependencies | Larger file size |
| **JavaScript Bundle** | Smaller file, Node.js ecosystem | Requires Node.js installed |
| **Native Deno** | Development friendly, hot reload | Requires Deno runtime |

## Usage

### Available Commands

#### Run All Crawlers (Recommended)
```bash
deno task all           # With logs
deno task all:no-log    # Silent mode
```

#### Individual Crawlers
```bash
# Art Crawler (runs continuously, 1min intervals)
deno task art           # With logs
deno task art:no-log    # Silent mode

# Label Crawler (runs continuously, 5min intervals)
deno task label         # With logs
deno task label:no-log  # Silent mode

# Frame Crawler (one-time scan)
deno task frame         # With logs
deno task frame:no-log  # Silent mode

# Joystick Crawler (one-time scan)
deno task joytick       # With logs
deno task joytick:no-log # Silent mode
```

#### Manual Execution
```bash
# With environment file
deno run --env-file --allow-env --allow-read --allow-write --allow-net main.ts all

# With manual environment variables
DISCORD_WEBHOOK_URL="your-url" ROLE_ID="123456" deno run --allow-env --allow-read --allow-write --allow-net main.ts art

# Silent mode
deno run --env-file --allow-env --allow-read --allow-write --allow-net main.ts all --no-log
```

## Content Types & Channels

| Type | Directory | Discord Channel | Icon | Interval |
|------|-----------|----------------|------|----------|
| **Art** | `./data/art/{hero}/` | `DISCORD_WEBHOOK_URL` | 🎨 | 1 minute |
| **Label** | `./data/label/{hero}/` | `DISCORD_LABEL_URL` | 🏷️ | 5 minutes |
| **Joystick** | `./data/joytick/` | `DISCORD_JOYSTICK_URL` | 🕹️ | 10 minutes |
| **Frame** | `./data/frame/` | `DISCORD_FRAME_URL` | 🖼️ | 60 minutes |

## Directory Structure

```
data/
├── art/
│   ├── hero1/
│   │   ├── hero100.jpg
│   │   └── hero101.jpg
│   └── hero2/
├── label/
│   ├── hero1/
│   │   ├── hero101.png
│   │   └── hero102.png
│   └── hero2/
├── joytick/
│   ├── hero100.jpg
│   └── hero101.jpg
└── frame/
    ├── Gold_HeadFrame1.png
    └── Silver_HeadFrame1.png
```

## Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_WEBHOOK_URL` | Yes | Art discoveries webhook URL |
| `DISCORD_LABEL_URL` | Yes | Label discoveries webhook URL |
| `DISCORD_JOYSTICK_URL` | Yes | Joystick discoveries webhook URL |
| `DISCORD_FRAME_URL` | Yes | Frame discoveries webhook URL |
| `ROLE_ID` | Optional | Discord role ID to ping (numbers only) |

### Command Line Flags

| Flag | Description |
|------|-------------|
| `--no-log` | Silent mode - suppresses all console output |

## Discord Notifications

### Message Format

Each notification includes:
- 📱 **Icon** for content type identification
- 🏷️ **Content details** (ID, hero name, server)
- 🖼️ **Actual image** attached to message
- 👥 **Role ping** (if `ROLE_ID` is configured)

### Example Notifications

```
🎨 [Art Crawler] Found new skin art ID: 52100 - Hero Name (Server: th) <@&1378645826489815050>
🏷️ [Label Crawler] Found new skin label: 52101 - Hero Name (Server: vn) <@&1378645826489815050>
🕹️ [JoyTick Crawler] Found new joystick: 52102 (Server: tw) <@&1378645826489815050>
🖼️ [Frame Crawler] Found new frame: Gold_HeadFrame1 (Server: th) <@&1378645826489815050>
```

## Architecture

```
├── main.ts                 # Main crawler logic and CLI
├── core/
│   └── discord.ts          # Multi-channel Discord integration
├── constants/
│   └── api.ts             # API endpoints and hero mappings
├── data/                  # Downloaded images storage
├── deno.json             # Deno configuration and tasks
└── .env                  # Environment configuration
```

## How It Works

1. **Scans** multiple game servers for new images
2. **Checks** if image already exists locally (file-based deduplication)
3. **Downloads** new images to organized directory structure
4. **Sends** Discord notification with image and role ping to appropriate channel
5. **Continues** scanning at configured intervals

## Production Deployment

For production use, run in silent mode:

```bash
# Run all crawlers silently in background
nohup deno task all:no-log > /dev/null 2>&1 &

# Or with systemd service
deno task all:no-log
```

## Permissions Required

- `--allow-env`: Read environment variables
- `--allow-read`: Read existing image files
- `--allow-write`: Save new images to disk
- `--allow-net`: Fetch images and send Discord notifications

## Troubleshooting

### Common Issues

1. **No Discord notifications**: Check webhook URLs in `.env`
2. **Role ping not working**: Verify `ROLE_ID` is just numbers (no `<@&>`)
3. **Images not saving**: Check directory permissions for `./data/`
4. **Too much output**: Use `--no-log` flag for silent operation

### Debug Mode

Remove `--no-log` to see detailed logging:
```bash
deno task all  # Shows all discovery and error messages
``` 