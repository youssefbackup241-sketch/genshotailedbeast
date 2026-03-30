# Genshō Tailed Beast Discord Bot (JavaScript)

This Discord bot is a direct port of the **Genshō Tailed Beast** web project, written in **JavaScript (Node.js)** using `discord.js`. It uses the exact same personas, question pools, and bonding logic as your original site, with a message-based `!` prefix command system and **OpenAI integration** for enhanced in-character responses.

## Features

- **9 Tailed Beasts**: All beasts from Shukaku to Kurama are included with their original personas.
- **Jinchuriki Bonding**: Staff can assign users to beasts using `!setup`. Users then bond with their beast through AI-evaluated questions.
- **OpenAI Integration**: The bot uses OpenAI's GPT-4.1-mini to evaluate user answers and provide in-character feedback, awarding points based on the quality of the response.
- **KCM Progress**: Track your bond points and unlock Kurama Chakra Mode (KCM) once you reach 15 points.
- **Daily Limits**: Users are limited to 3 bonding sessions per day, matching the original project's constraints.
- **Chamber Validation**: Bonding can only occur in the designated Discord channel for each beast.

## Prerequisites

1. **Node.js 16+** (with npm or pnpm)
2. **Discord Bot Token** (with `Message Content Intent` enabled)
3. **OpenAI API Key**

## Setup Instructions

### 1. Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Or using npm:
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_discord_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Discord Channel Setup

The bot is configured to only allow bonding in specific "chambers" (channels). Create channels for each beast and ensure they match these IDs (or update them in `bot.js`):

| Beast | Channel ID |
|-------|-----------|
| Shukaku | `1488142070848946349` |
| Matatabi | `1488142174045343774` |
| Isobu | `1488142308623908966` |
| Son Gokū | `1488142674530795611` |
| Kokuō | `1488142802478174349` |
| Saiken | `1488142966282387527` |
| Chōmei | `1488143101452095591` |
| Gyūki | `1488143484836905031` |
| Kurama | `1488143665196171424` |

### 4. Run the Bot

```bash
node bot.js
```

You should see: `✅ Genshō Bot is online as YourBotName#0000`

## Commands

### Staff Commands
- **`!setup <beast> <userId>`**: Assign a Tailed Beast to a user. Only administrators can use this.
  - Example: `!setup kurama 123456789012345678`

### Bonding Commands
- **`!<beast>`**: Start a bonding session with a specific beast (e.g., `!kurama`, `!shukaku`, `!isobu`).
  - Must be used in the beast's designated chamber channel.
  - The beast will ask you a question.
  
- **`<answer text>`**: Submit your answer to the beast's question.
  - Simply type your response directly in the channel.
  - The bot will evaluate it using OpenAI and award points.

### Examples

```
!setup kurama 987654321098765432
# Assigns Kurama to the user with ID 987654321098765432

!kurama
# Starts a bonding session with Kurama (must be in Kurama's chamber)

I believe that true strength comes from protecting those you care about.
# Your answer to Kurama's question
```

## How It Works

1. **Setup**: A staff member assigns a user to a Tailed Beast using `!setup`.
2. **Bonding**: The user enters their beast's chamber and types `!<beast>` to start a session.
3. **Question**: The bot picks a unique question from the beast's pool and displays it.
4. **Answer**: The user types their answer directly in the channel.
5. **Evaluation**: OpenAI evaluates the answer using the beast's persona and awards points (-2 to 2).
6. **Progress**: Bond points accumulate. At 15 points, KCM (Kurama Chakra Mode) is unlocked.
7. **Limits**: Users can bond 3 times per day, resetting at UTC midnight.

## Customization

The `BEAST_DATA` object in `bot.js` contains all the personas and questions. You can:
- Add more questions to each beast's `questions` array.
- Modify the `persona` string to change how the beast evaluates answers.
- Adjust `KCM_THRESHOLD` (default: 15) for the points needed to unlock KCM.
- Adjust `MAX_DAILY_INTERACTIONS` (default: 3) for daily session limits.

## Data Persistence

The bot saves all user progress to `jinchuriki_data.json` in the bot's directory. This file contains:
- Assigned beast
- Bond points
- KCM unlock status
- Daily interaction count
- Questions already asked
- Pending sessions

## Troubleshooting

- **Bot not responding**: Ensure `Message Content Intent` is enabled in the Discord Developer Portal under your application's settings.
- **Commands not working**: Make sure the bot has permission to send messages and embed links in the channel.
- **OpenAI errors**: Check that your API key is valid and has sufficient quota.
- **Channel validation failing**: Verify the channel IDs match your server's channels or update them in `bot.js`.
- **Dependencies not installing**: Try clearing pnpm/npm cache and reinstalling: `pnpm install --force` or `npm install --force`.

## License

This project mirrors the Genshō Tailed Beast web project and is provided as-is.
