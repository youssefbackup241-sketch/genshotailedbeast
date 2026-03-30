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
const MAX_DAILY_INTERACTIONS = 1;

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
  matatabis: { name: "Matatabis", tails: 2, emoji: "🔵", color: 0x1E90FF, channelId: "1488142174045343774" },
  isobu: { name: "Isobu", tails: 3, emoji: "🐢", color: 0x708090, channelId: "1488142308623908966" },
  songoku: { name: "Son Goku", tails: 4, emoji: "🌋", color: 0xFF4500, channelId: "1488142674530795611" },
  kokuo: { name: "Kokuo", tails: 5, emoji: "🐎", color: 0x8B8878, channelId: "1488142802478174349" },
  saikens: { name: "Saikens", tails: 6, emoji: "🫧", color: 0xE6E6FA, channelId: "1488142966282387527" },
  chomeis: { name: "Chomeis", tails: 7, emoji: "🪲", color: 0x32CD32, channelId: "1488143101452095591" },
  gyuki: { name: "Gyuki", tails: 8, emoji: "🐙", color: 0x4B0082, channelId: "1488143484836905031" },
  kurama: { name: "Kurama", tails: 9, emoji: "🦊", color: 0xFF8C00, channelId: "1488143665196171424" }
};

// ─────────────────────────────────────────────
// Beast-Specific Disdain Lines
// ─────────────────────────────────────────────
const WRONG_CHOICE_RESPONSES = {
  shukaku: ["Hmph! You're as weak as a sandcastle in a storm!", "WRONG! You think that's the path to power?!", "Ore-sama is insulted!", "Incorrect! You don't deserve my sand!", "Zero points! You're not worthy!"],
  matatabis: ["How disappointing. That choice lacked elegance.", "A cat always lands on its feet, but you have stumbled.", "My blue flames burn for the refined. You are crude.", "That was not the path of grace.", "Incorrect. You have failed to honor the bond."],
  isobu: ["Oh... that's not the right heart.", "Incorrect... the ocean is quiet, but your choice was wrong.", "I... I expected more depth from you.", "The tides don't lie, but your heart just did.", "Even a pebble knows better than that."],
  songoku: ["A warrior must have honor! That choice was a disgrace!", "Son Gokū is not impressed!", "Incorrect! A true Sage would never choose such a path!", "You call yourself a warrior? You're just a tool!", "That choice was a surrender!"],
  kokuo: ["...Incorrect. The wind carries the truth, but you chose the lie.", "Wisdom is silent; your choice was loud and wrong.", "I run toward the horizon, but you are stuck in the mud.", "That was not the path of freedom.", "Honor requires truth. You have shown neither."],
  saikens: ["Oh dear... that choice just popped like an empty bubble.", "Even my slime has more substance than that decision.", "I'm a little sad... I thought you were kinder.", "That choice dissolved into nothing.", "Bubbles are fragile, but your conviction is even weaker."],
  chomeis: ["NOT LUCKY! That was the wrong choice!", "Aww, come on! Even a caterpillar knows better!", "Zero points! You need to fly higher!", "That was a total miss! No luck for you today!", "Fū would never have chosen that!"],
  gyuki: ["Incorrect. That's a forfeit of character.", "Killer B would rap about how weak that choice was.", "A warrior's mind must be sharp. Your choice was dull.", "No excuses. You chose the wrong path.", "I've seen ink dry with more purpose than that decision."],
  kurama: ["Hmph. Centuries of history, and you still choose the path of a fool.", "Naruto would have known better.", "I can sense your uncertainty. You chose the safe path.", "Don't insult my intelligence with such a pathetic choice.", "You want my power? Earn it with conviction."]
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
    data[userId] = { beast: null, bondPoints: 0, kcmUnlocked: false, lastInteractionDate: '', interactionCountToday: 0, questionsAsked: [], pendingSession: null };
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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages]
});
const activeSessions = new Map();

client.on('ready', () => {
  console.log(`✅ Genshō Bonding Bot is online as ${client.user.tag}`);
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
        { name: '🐾 **Available Beasts**', value: '🏜️ Shukaku | 🔵 Matatabi | 🐢 Isobu | 🌋 Songoku | 🐎 Kokuo | 🫧 Saiken | 🪲 Chomei | 🐙 Gyuki | 🦊 Kurama', inline: false }
      )
      .setFooter({ text: 'Correct Choice = 1pt | Wrong Choice = 0pt | Limit: 1/day' });
    return message.reply({ embeds: [embed] });
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
        .addOptions(Object.entries(BEAST_DATA).map(([key, beast]) => ({ label: `${beast.emoji} ${beast.name}`, value: key })));
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
    const rawCmd = content.slice(1).split(/\s+/)[0];
    // Normalize command: remove accents and special characters
    const cmd = rawCmd.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
    
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
      if (!userAnswer) return;

      const data = loadData();
      const userData = getUserData(data, message.author.id);
      const pending = userData.pendingSession;
      const isCorrect = userAnswer === pending.answer;
      const points = isCorrect ? 1 : 0;
      
      userData.bondPoints += points;
      userData.questionsAsked.push(pending.index);
      userData.interactionCountToday = 1;
      userData.lastInteractionDate = new Date().toISOString().slice(0, 10);
      userData.pendingSession = null;
      activeSessions.delete(message.channel.id);

      let feedback = isCorrect ? `I see... your heart is true. We are one step closer.` : WRONG_CHOICE_RESPONSES[session.beastKey][Math.floor(Math.random() * 5)];
      let justUnlocked = (!userData.kcmUnlocked && userData.bondPoints >= KCM_THRESHOLD);
      if (justUnlocked) userData.kcmUnlocked = true;
      saveData(data);

      const embed = new EmbedBuilder()
        .setTitle(isCorrect ? '✨ Bond Strengthened' : '💔 Bond Weakened')
        .setDescription(`>>> ${feedback}`)
        .addFields({ name: '⭐ Points', value: `+${points}`, inline: true }, { name: '💯 Total Bond', value: `${userData.bondPoints} / ${KCM_THRESHOLD}`, inline: true }, { name: '📊 Progress', value: createProgressBar(userData.bondPoints, KCM_THRESHOLD), inline: false })
        .setColor(isCorrect ? 0x00FF00 : 0xFF0000);

      if (justUnlocked) {
        const kcmEmbed = new EmbedBuilder().setTitle('⚡ KCM UNLOCKED! ⚡').setDescription(`🔥 **<@${message.author.id}> has achieved Kurama Chakra Mode!** 🔥`).setColor(0xFFD700);
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
