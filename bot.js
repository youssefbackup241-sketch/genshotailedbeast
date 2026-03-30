/**
 * Genshō Tailed Beast Discord Bot - Bonding Choice Edition
 * =======================================================
 * A Discord bot mirroring the Genshō Tailed Beast web project.
 * Uses ! prefix commands for all interactions.
 * 
 * This version uses a "Bonding Choice" system (50 deep Yes/No questions per beast).
 * Limit: 1 interaction per 24 hours.
 */

const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, SelectMenuBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN';
const DATA_FILE = path.join(__dirname, 'jinchuriki_data.json');
const QUESTIONS_FILE = path.join(__dirname, 'bonding_questions.json');
const KCM_THRESHOLD = 15;
const MAX_DAILY_INTERACTIONS = 1; // Updated to 1 per day

// ─────────────────────────────────────────────
// Load Questions
// ─────────────────────────────────────────────
let BONDING_QUESTIONS = {};
if (fs.existsSync(QUESTIONS_FILE)) {
  BONDING_QUESTIONS = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
} else {
  console.error("CRITICAL: bonding_questions.json not found!");
}

// ─────────────────────────────────────────────
// Tailed Beast Data
// ─────────────────────────────────────────────
const BEAST_DATA = {
  shukaku: { name: "Shukaku", tails: 1, emoji: "🏜️", color: 0xC2B280, channelId: "1488142070848946349" },
  matatabi: { name: "Matatabi", tails: 2, emoji: "🔵", color: 0x1E90FF, channelId: "1488142174045343774" },
  isobu: { name: "Isobu", tails: 3, emoji: "🐢", color: 0x708090, channelId: "1488142308623908966" },
  songoku: { name: "Son Gokū", tails: 4, emoji: "🌋", color: 0xFF4500, channelId: "1488142674530795611" },
  kokou: { name: "Kokuō", tails: 5, emoji: "🐎", color: 0x8B8878, channelId: "1488142802478174349" },
  saiken: { name: "Saiken", tails: 6, emoji: "🫧", color: 0xE6E6FA, channelId: "1488142966282387527" },
  chomei: { name: "Chōmei", tails: 7, emoji: "🪲", color: 0x32CD32, channelId: "1488143101452095591" },
  gyuki: { name: "Gyūki", tails: 8, emoji: "🐙", color: 0x4B0082, channelId: "1488143484836905031" },
  kurama: { name: "Kurama", tails: 9, emoji: "🦊", color: 0xFF8C00, channelId: "1488143665196171424" }
};

// ─────────────────────────────────────────────
// Beast-Specific Disdain Lines (for "Wrong" Bonding Choices)
// ─────────────────────────────────────────────
const WRONG_CHOICE_RESPONSES = {
  shukaku: [
    "Hmph! You're as weak as a sandcastle in a storm! Ore-sama has no time for cowards!",
    "WRONG! You think that's the path to power?! You're just another pathetic human!",
    "Ore-sama is insulted! That choice was as hollow as an empty dune!",
    "Incorrect! You don't deserve my sand, let alone my respect!",
    "Zero points! You're not worthy of being Ore-sama's Jinchuriki!"
  ],
  matatabi: [
    "How disappointing. That choice lacked the elegance I require. Zero points.",
    "A cat always lands on its feet, but you have stumbled into dishonor. Incorrect.",
    "My blue flames burn for the refined. You, however, are crude. Zero points.",
    "That was not the path of grace. I hope the silence teaches you better.",
    "Incorrect. You have failed to honor the bond I offered. Zero points."
  ],
  isobu: [
    "Oh... that's not the right heart. I'll just... go back to the deep now. Zero points.",
    "Incorrect... the ocean is quiet, but your choice was just... wrong.",
    "I... I expected more depth from you. Zero points. Please try harder next time.",
    "The tides don't lie, but your heart just did. Incorrect.",
    "Even a pebble knows better than that. Zero points."
  ],
  songoku: [
    "A warrior must have honor! That choice was a disgrace! Zero points!",
    "Son Gokū is not impressed! You have dishonored our partnership with that answer!",
    "Incorrect! A true Sage would never choose such a cowardly path!",
    "You call yourself a warrior? You're just a tool with no conviction! Zero points!",
    "That choice was a surrender! I do not respect those who lack a warrior's soul!"
  ],
  kokou: [
    "...Incorrect. The wind carries the truth, but you chose the lie. Zero points.",
    "Wisdom is silent; your choice was loud and wrong. Zero points.",
    "I run toward the horizon, but you are stuck in the mud of error. Zero points.",
    "That was not the path of freedom. Incorrect.",
    "Honor requires truth. You have shown neither right now. Zero points."
  ],
  saiken: [
    "Oh dear... that choice just popped like an empty bubble. Zero points.",
    "Even my slime has more substance than that decision. Incorrect.",
    "I'm a little sad... I thought you were kinder than that. Zero points.",
    "That choice dissolved into nothing. Incorrect.",
    "Bubbles are fragile, but your conviction is even weaker. Zero points."
  ],
  chomei: [
    "NOT LUCKY! That was the wrong choice! Lucky seven is disappointed! Zero points!",
    "Aww, come on! Even a caterpillar knows better than that! Incorrect!",
    "Zero points! You need to fly higher and find your true spirit!",
    "That was a total miss! No luck for you today! Incorrect!",
    "Fū would never have chosen that! You're not being very lucky right now! Zero points!"
  ],
  gyuki: [
    "Incorrect. That's a forfeit of character in my book. Zero points.",
    "Killer B would rap about how weak that choice was. Discipline your soul. Zero points.",
    "A warrior's mind must be sharp. Your choice was dull. Incorrect.",
    "No excuses. You chose the wrong path. Zero points.",
    "I've seen ink dry with more purpose than that decision. Incorrect."
  ],
  kurama: [
    "Hmph. Centuries of history, and you still choose the path of a fool. Zero points.",
    "Naruto would have known better. You're just another disappointing human.",
    "I can sense your uncertainty. You chose the safe path, not the right one. Zero points.",
    "Don't insult my intelligence with such a pathetic choice. Incorrect.",
    "You want my power? Earn it with conviction, not cowardice. Zero points."
  ]
};

// ─────────────────────────────────────────────
// Persistent Data Helpers
// ─────────────────────────────────────────────
function loadData() {
  if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  return {};
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getUserData(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      beast: null,
      bondPoints: 0,
      kcmUnlocked: false,
      lastInteractionDate: '',
      interactionCountToday: 0,
      questionsAsked: [],
      pendingSession: null
    };
  }
  return data[userId];
}

function createProgressBar(current, max) {
  const filled = Math.round((Math.max(0, current) / max) * 10);
  const empty = 10 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`;
}

// ─────────────────────────────────────────────
// Discord Bot Setup
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const activeSessions = new Map();

client.on('ready', () => {
  console.log(`✅ Genshō Bonding Bot is online as ${client.user.tag}`);
  client.user.setActivity('Bonding | !tbcmds', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // ─── !tbcmds command ───────────────────────────────────────
  if (content === '!tbcmds') {
    const embed = new EmbedBuilder()
      .setTitle('🦊 Genshō Tailed Beast Bonding')
      .setDescription('**Welcome, Jinchuriki!** Make the right choices to bond with your beast.')
      .setColor(0xFF8C00)
      .addFields(
        { name: '📋 **Staff Commands**', value: '`!setup <userId>` | `!wipetb <userId>`', inline: false },
        { name: '⚡ **Bonding Commands**', value: '`!<beast>` (e.g. !kurama) | Answer with `Yes` or `No`', inline: false },
        { name: '🐾 **Available Beasts**', value: '🏜️ Shukaku | 🔵 Matatabi | 🐢 Isobu | 🌋 Son Gokū | 🐎 Kokuō | 🫧 Saiken | 🪲 Chōmei | 🐙 Gyūki | 🦊 Kurama', inline: false }
      )
      .setFooter({ text: 'Correct Choice = 1pt | Wrong Choice = 0pt | Limit: 1/day' });
    await message.reply({ embeds: [embed] });
    return;
  }

  // ─── !setup / !wipetb ──────────────────────────────────────
  if (content.startsWith('!setup') || content.startsWith('!wipetb')) {
    if (!message.member.permissions.has('Administrator')) return message.reply('❌ Admin only.');
    const parts = content.split(/\s+/);
    if (parts.length < 2) return message.reply('Usage: `!setup/!wipetb <userId>`');
    const userId = parts[1].replace(/[<@!>]/g, '');
    const data = loadData();

    if (content.startsWith('!setup')) {
      const selectMenu = new SelectMenuBuilder()
        .setCustomId(`setup_beast_${userId}`)
        .setPlaceholder('🐾 Select a Tailed Beast...')
        .addOptions(Object.entries(BEAST_DATA).map(([key, beast]) => ({
          label: `${beast.emoji} ${beast.name}`, value: key
        })));
      const row = new ActionRowBuilder().addComponents(selectMenu);
      return message.reply({ content: `Select a beast for <@${userId}>:`, components: [row] });
    } else {
      delete data[userId];
      saveData(data);
      return message.reply(`✅ Data wiped for <@${userId}>.`);
    }
  }

  // ─── Beast commands (!kurama, etc.) ────────────────────────
  if (content.startsWith('!')) {
    const cmd = content.slice(1).split(/\s+/)[0];
    if (BEAST_DATA[cmd]) {
    const beastKey = cmd;
    const beast = BEAST_DATA[beastKey];
    if (message.channel.id !== beast.channelId) return message.reply(`❌ Use ${beast.name}'s chamber!`);

    const data = loadData();
    const userData = getUserData(data, message.author.id);
    if (userData.beast !== beastKey) return message.reply(`❌ You are not bonded with ${beast.name}!`);

    const today = new Date().toISOString().slice(0, 10);
    if (userData.lastInteractionDate === today && userData.interactionCountToday >= MAX_DAILY_INTERACTIONS) {
      return message.reply(`❌ You have already bonded with ${beast.name} today. Return tomorrow.`);
    }

    if (userData.pendingSession) return message.reply(`❓ Answer the pending question first!`);

    const questions = BONDING_QUESTIONS[beastKey];
    let available = questions.map((_, i) => i).filter(i => !userData.questionsAsked.includes(i));
    if (available.length === 0) { userData.questionsAsked = []; available = questions.map((_, i) => i); }

    const qIdx = available[Math.floor(Math.random() * available.length)];
    const questionObj = questions[qIdx];

    userData.pendingSession = { question: questionObj.question, answer: questionObj.answer, index: qIdx };
    activeSessions.set(message.channel.id, { userId: message.author.id, beastKey });
    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle(`${beast.emoji} ${beast.name}'s Bonding Choice`)
      .setDescription(`**${beast.name} asks:**\n\n"${questionObj.question}"\n\n*Reply with **Yes** or **No***`)
      .setColor(beast.color)
      .setFooter({ text: `Bond: ${userData.bondPoints}/${KCM_THRESHOLD} | Limit: 1/day` });
      return message.reply({ embeds: [embed] });
    }
  }

  // ─── Answer handler ───────────────────────────────────────
  if (activeSessions.has(message.channel.id)) {
    const session = activeSessions.get(message.channel.id);
    if (session.userId === message.author.id) {
      const userAnswer = content.includes('yes') ? 'Yes' : (content.includes('no') ? 'No' : null);
      if (!userAnswer) return; // Ignore non-yes/no messages

      const data = loadData();
      const userData = getUserData(data, message.author.id);
      const pending = userData.pendingSession;
      const beast = BEAST_DATA[session.beastKey];

      const isCorrect = userAnswer === pending.answer;
      const points = isCorrect ? 1 : 0;
      
      userData.bondPoints += points;
      userData.questionsAsked.push(pending.index);
      userData.interactionCountToday = 1;
      userData.lastInteractionDate = new Date().toISOString().slice(0, 10);
      userData.pendingSession = null;
      activeSessions.delete(message.channel.id);

      let feedback = isCorrect ? 
        `I see... your heart is true. We are one step closer to understanding each other.` : 
        WRONG_CHOICE_RESPONSES[session.beastKey][Math.floor(Math.random() * 5)];

      let justUnlocked = false;
      if (!userData.kcmUnlocked && userData.bondPoints >= KCM_THRESHOLD) {
        userData.kcmUnlocked = true;
        justUnlocked = true;
      }
      saveData(data);

      const embed = new EmbedBuilder()
        .setTitle(isCorrect ? '✨ Bond Strengthened' : '💔 Bond Weakened')
        .setDescription(`>>> ${feedback}`)
        .addFields(
          { name: '⭐ Points', value: `+${points}`, inline: true },
          { name: '💯 Total Bond', value: `${userData.bondPoints} / ${KCM_THRESHOLD}`, inline: true },
          { name: '📊 Progress', value: createProgressBar(userData.bondPoints, KCM_THRESHOLD), inline: false }
        )
        .setColor(isCorrect ? 0x00FF00 : 0xFF0000)
        .setTimestamp();

      if (justUnlocked) {
        const kcmEmbed = new EmbedBuilder()
          .setTitle('⚡ KCM UNLOCKED! ⚡')
          .setDescription(`🔥 **<@${message.author.id}> has achieved Kurama Chakra Mode!** 🔥`)
          .setColor(0xFFD700);
        return message.reply({ embeds: [embed, kcmEmbed] });
      }
      return message.reply({ embeds: [embed] });
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId.startsWith('setup_beast_')) {
    const userId = interaction.customId.replace('setup_beast_', '');
    const beastKey = interaction.values[0];
    const data = loadData();
    const userData = getUserData(data, userId);
    userData.beast = beastKey;
    userData.bondPoints = 0;
    userData.kcmUnlocked = false;
    userData.questionsAsked = [];
    saveData(data);
    await interaction.reply(`✅ Sealed ${BEAST_DATA[beastKey].name} within <@${userId}>.`);
  }
});

client.login(DISCORD_TOKEN);
