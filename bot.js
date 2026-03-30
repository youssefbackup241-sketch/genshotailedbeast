/**
 * Genshō Tailed Beast Discord Bot - Trivia Edition
 * ===============================================
 * A Discord bot mirroring the Genshō Tailed Beast web project.
 * Uses ! prefix commands for all interactions.
 * 
 * This version uses a Hard Yes/No Trivia system (50 questions per beast).
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
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const KCM_THRESHOLD = 15;
const MAX_DAILY_INTERACTIONS = 3;

// ─────────────────────────────────────────────
// Load Questions
// ─────────────────────────────────────────────
let TRIVIA_QUESTIONS = {};
if (fs.existsSync(QUESTIONS_FILE)) {
  TRIVIA_QUESTIONS = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
} else {
  console.error("CRITICAL: questions.json not found!");
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
// Beast-Specific Disdain Lines (for wrong answers)
// ─────────────────────────────────────────────
const WRONG_ANSWER_RESPONSES = {
  shukaku: [
    "WRONG! Ore-sama is insulted by your ignorance! A sandcastle has more brains than you!",
    "HA! You think that's the answer?! You're as weak as that mangy fox says you are!",
    "Pathetic! Ore-sama's absolute defense couldn't even protect you from your own stupidity!",
    "Incorrect! Begone before I bury you in a sand tomb!",
    "You know nothing of my greatness! Zero points!"
  ],
  matatabi: [
    "How disappointing. I expected elegance, but you offered only error. Zero points.",
    "A cat always lands on its feet, but you have fallen flat. Incorrect.",
    "My blue flames burn for the wise. You, however, are in the dark. Zero points.",
    "Elegance requires knowledge. You have shown neither. Incorrect.",
    "That was not the truth. I hope the silence teaches you better. Zero points."
  ],
  isobu: [
    "Oh... that's not right. I'll just... go back to the deep now. Zero points.",
    "Incorrect... the ocean is quiet, but your answer was just... wrong.",
    "I... I expected more. Zero points. Please try harder next time.",
    "The tides don't lie, but you just did. Incorrect.",
    "Even a pebble knows better. Zero points."
  ],
  songoku: [
    "A warrior must know his history! That was a shameful display! Zero points!",
    "Son Gokū is not impressed! You have dishonored this session with your ignorance!",
    "Incorrect! A true Sage would never make such a mistake!",
    "You call yourself a Jinchuriki? You're just a tool with no knowledge! Zero points!",
    "That answer was a surrender! I do not respect cowards or the ignorant!"
  ],
  kokou: [
    "...Incorrect. The wind carries the truth, but you did not listen. Zero points.",
    "Wisdom is silent; ignorance is loud. Your answer was loud and wrong.",
    "I run toward the horizon, but you are stuck in a fog of error. Zero points.",
    "That was not the path. Incorrect.",
    "Freedom requires truth. You have neither right now. Zero points."
  ],
  saiken: [
    "Oh dear... that answer just popped like an empty bubble. Zero points.",
    "Even my slime has more substance than that guess. Incorrect.",
    "I'm a little sad... I thought you knew me better. Zero points.",
    "That answer dissolved into nothing. Incorrect.",
    "Bubbles are fragile, but your knowledge is even weaker. Zero points."
  ],
  chomei: [
    "NOT LUCKY! That was the wrong answer! Lucky seven is disappointed! Zero points!",
    "Aww, come on! Even a caterpillar knows the answer to that! Incorrect!",
    "Zero points! You need to fly higher and study harder!",
    "That was a total miss! No luck for you today! Incorrect!",
    "Fū would have known that! You're not being very lucky right now! Zero points!"
  ],
  gyuki: [
    "Incorrect. That's a forfeit in my book. Zero points.",
    "Killer B would rap about how wrong you are. Discipline your mind. Zero points.",
    "A warrior's mind must be sharp. Yours is dull. Incorrect.",
    "No excuses. You were wrong. Zero points.",
    "I've seen ink dry with more purpose than that answer. Incorrect."
  ],
  kurama: [
    "Hmph. Centuries of history, and you know nothing. Zero points.",
    "Naruto would have known that. You're just another disappointing human. Incorrect.",
    "I can sense your uncertainty. You were guessing, and you were wrong. Zero points.",
    "Don't insult my intelligence with such a pathetic answer. Incorrect.",
    "You want my power? Earn it with knowledge, not guesses. Zero points."
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
  console.log(`✅ Genshō Trivia Bot is online as ${client.user.tag}`);
  client.user.setActivity('Trivia | !tbcmds', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // ─── !tbcmds command ───────────────────────────────────────
  if (content === '!tbcmds') {
    const embed = new EmbedBuilder()
      .setTitle('🦊 Genshō Tailed Beast Trivia')
      .setDescription('**Welcome, Jinchuriki!** Answer hard Yes/No questions to bond with your beast.')
      .setColor(0xFF8C00)
      .addFields(
        { name: '📋 **Staff Commands**', value: '`!setup <userId>` | `!wipetb <userId>`', inline: false },
        { name: '⚡ **Bonding Commands**', value: '`!<beast>` (e.g. !kurama) | Answer with `Yes` or `No`', inline: false },
        { name: '🐾 **Available Beasts**', value: '🏜️ Shukaku | 🔵 Matatabi | 🐢 Isobu | 🌋 Son Gokū | 🐎 Kokuō | 🫧 Saiken | 🪲 Chōmei | 🐙 Gyūki | 🦊 Kurama', inline: false }
      )
      .setFooter({ text: 'Correct = 1pt | Wrong = 0pt | KCM at 15pts' });
    await message.reply({ embeds: [embed] });
    return;
  }

  // ─── !setup / !wipetb (Simplified for brevity) ─────────────
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
  const cmd = content.replace('!', '').split(/\s+/)[0];
  if (BEAST_DATA[cmd]) {
    const beastKey = cmd;
    const beast = BEAST_DATA[beastKey];
    if (message.channel.id !== beast.channelId) return message.reply(`❌ Use ${beast.name}'s chamber!`);

    const data = loadData();
    const userData = getUserData(data, message.author.id);
    if (userData.beast !== beastKey) return message.reply(`❌ You are not bonded with ${beast.name}!`);

    const today = new Date().toISOString().slice(0, 10);
    if (userData.lastInteractionDate !== today) {
      userData.interactionCountToday = 0;
      userData.lastInteractionDate = today;
    }
    if (userData.interactionCountToday >= MAX_DAILY_INTERACTIONS) return message.reply(`❌ Limit reached (${MAX_DAILY_INTERACTIONS}/day).`);
    if (userData.pendingSession) return message.reply(`❓ Answer the pending question first!`);

    const questions = TRIVIA_QUESTIONS[beastKey];
    let available = questions.map((_, i) => i).filter(i => !userData.questionsAsked.includes(i));
    if (available.length === 0) { userData.questionsAsked = []; available = questions.map((_, i) => i); }

    const qIdx = available[Math.floor(Math.random() * available.length)];
    const questionObj = questions[qIdx];

    userData.pendingSession = { question: questionObj.question, answer: questionObj.answer, index: qIdx };
    activeSessions.set(message.channel.id, { userId: message.author.id, beastKey });
    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle(`${beast.emoji} ${beast.name}'s Challenge`)
      .setDescription(`**Question:**\n${questionObj.question}\n\n*Reply with **Yes** or **No***`)
      .setColor(beast.color)
      .setFooter({ text: `Bond: ${userData.bondPoints}/${KCM_THRESHOLD}` });
    return message.reply({ embeds: [embed] });
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
      userData.interactionCountToday += 1;
      userData.pendingSession = null;
      activeSessions.delete(message.channel.id);

      let feedback = isCorrect ? 
        `Correct! You actually know your history. I'm impressed.` : 
        WRONG_ANSWER_RESPONSES[session.beastKey][Math.floor(Math.random() * 5)];

      let justUnlocked = false;
      if (!userData.kcmUnlocked && userData.bondPoints >= KCM_THRESHOLD) {
        userData.kcmUnlocked = true;
        justUnlocked = true;
      }
      saveData(data);

      const embed = new EmbedBuilder()
        .setTitle(isCorrect ? '✅ Correct!' : '❌ Incorrect')
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
