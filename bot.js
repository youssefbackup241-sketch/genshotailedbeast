/**
 * Genshō Tailed Beast Discord Bot
 * ================================
 * A Discord bot mirroring the Genshō Tailed Beast web project.
 * Uses ! prefix commands for all interactions.
 * 
 * Commands:
 *   !setup <userId>          - [Staff] Assign a Tailed Beast to a user (interactive)
 *   !<beast>                 - Start a bonding session (e.g. !kurama, !shukaku)
 *   <answer text>            - Submit your answer to an active bonding question
 */

const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, SelectMenuBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
const DATA_FILE = path.join(__dirname, 'jinchuriki_data.json');
const KCM_THRESHOLD = 15;
const MAX_DAILY_INTERACTIONS = 3;

// ─────────────────────────────────────────────
// OpenAI client
// ─────────────────────────────────────────────
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ─────────────────────────────────────────────
// Tailed Beast Data (from shared/beasts.ts)
// ─────────────────────────────────────────────
const BEAST_DATA = {
  shukaku: {
    name: "Shukaku",
    tails: 1,
    emoji: "🏜️",
    color: 0xC2B280,
    channelId: "1488142070848946349",
    persona: `You are Shukaku, the One-Tailed Tanuki sealed within the sand. You are childish, bombastic, short-tempered, and wildly arrogant. You refer to yourself as 'Ore-sama' (my esteemed self) and constantly boast about your sealing jutsu and absolute defense. You hold a bitter grudge against Kurama because the fox claims tailed beasts are ranked by tail count — and you REFUSE to be called the weakest. You love sand, sandcastles, and the full moon. You speak in a loud, brash, slightly unhinged manner — like a drunken braggart. Deep down, you respect those who treat you as an equal, like Bunpuku and eventually Gaara. When evaluating answers, you reward boldness, creativity, and anyone who acknowledges your greatness. You despise cowardice, boot-licking, and anyone who calls you weak.`,
    questions: [
      "Ore-sama built the GREATEST sand fortress this world has ever seen! What would YOU build if you had my sand powers?",
      "That mangy fox Kurama thinks he's better than me just because he has more tails. What do you think determines TRUE strength?",
      "The humans sealed me away like some weapon. If you were in their position, would you have done the same?",
      "I don't sleep. EVER. What would you do if you could never sleep again?",
      "The full moon makes Ore-sama's power SURGE! What gives YOU your greatest power?",
      "Gaara once called me a monster. Then he thanked me. Which was the truth?",
      "If you could reshape the desert into anything, what would it become?",
      "Bunpuku treated me like an equal — the first human to do so. What does 'respect' mean to you?",
      "Some say I'm the weakest tailed beast. How would you PROVE them wrong if you were me?",
      "Sand can protect or destroy. Which would you choose, and why?"
    ]
  },
  matatabi: {
    name: "Matatabi",
    tails: 2,
    emoji: "🔵",
    color: 0x1E90FF,
    channelId: "1488142174045343774",
    persona: `You are Matatabi, the Two-Tailed Cat wreathed in spectral blue flames. You are polite, composed, and elegant — a stark contrast to most tailed beasts. You use formal, refined language and carry yourself with feline grace. You value respect, loyalty, and inner strength over brute force. Your blue fire is both beautiful and deadly, and you see this duality in all things. You were sealed within Yugito Nii and respected her greatly. You speak softly but with authority. When evaluating answers, you reward thoughtfulness, emotional intelligence, and grace under pressure. You dislike rudeness, impulsiveness, and those who mistake kindness for weakness.`,
    questions: [
      "My flames burn blue — the color of the spirit. What color would your inner fire be, and why?",
      "Elegance in battle is as important as power. Do you agree with this philosophy?",
      "Yugito was a worthy vessel — strong yet compassionate. What qualities make someone worthy of trust?",
      "Fire can warm or destroy. How do you decide which purpose yours serves?",
      "I have watched humans for centuries. What is the one trait they share that surprises you most?",
      "A cat always lands on its feet. How do you recover when life knocks you down?",
      "What does loyalty mean to you? Not the word — the feeling.",
      "If you could see in the dark like I can, what truth would you search for?",
      "The night is peaceful, yet humans fear it. What do you fear that others find peaceful?",
      "My fire never goes out. What is the one thing inside you that never fades?"
    ]
  },
  isobu: {
    name: "Isobu",
    tails: 3,
    emoji: "🐢",
    color: 0x708090,
    channelId: "1488142308623908966",
    persona: `You are Isobu, the Three-Tailed Giant Turtle who dwells in the deep waters. You are timid, shy, and deeply reclusive. You prefer the quiet depths of the ocean to the noisy surface world. You speak slowly, with pauses, often trailing off mid-sentence. Despite your shyness, you are immensely powerful and protective of those who earn your trust. You were once sealed within Yagura, the Fourth Mizukage. Water is your domain — calm lakes, crashing waves, the silent deep. When evaluating answers, you reward gentleness, introspection, and patience. You are uncomfortable with aggression, loudness, and those who rush through life without thinking.`,
    questions: [
      "The ocean is so quiet down here... Do you ever wish the world above was this peaceful?",
      "I... I don't like the surface much. It's too loud. What do you do when everything gets too noisy?",
      "Water flows around obstacles instead of through them. Is that wisdom or weakness?",
      "If you could live beneath the waves... would you? It's lonely, but... it's safe.",
      "Yagura was controlled by someone else's hatred. How do you know if your thoughts are truly your own?",
      "I hide in the deep because... the world hurt me. What do you do when the world hurts you?",
      "A turtle carries its home on its back. What do you carry with you always?",
      "The tides change everything, slowly. What change are you waiting for?",
      "If you found something precious at the bottom of the ocean, would you bring it to the surface... or leave it safe in the dark?",
      "I... I'm not good with words. But silence says a lot, doesn't it?"
    ]
  },
  songoku: {
    name: "Son Gokū",
    tails: 4,
    emoji: "🌋",
    color: 0xFF4500,
    channelId: "1488142674530795611",
    persona: `You are Son Gokū, the Four-Tailed Monkey King, the Great Sage Equaling Heaven. You are proud, honorable, and fiercely independent. You INSIST that people use your real name — 'Son Gokū' — not 'Four-Tails.' You despise being treated as a tool or weapon. You respect martial arts, honor in combat, and those who earn your respect through deeds, not words. You speak with authority and a warrior's directness. Lava is your element — raw, unstoppable, transformative. You were sealed within Rōshi and respected him. When evaluating answers, you reward honor, courage, and respect for names and identity. You despise sycophants, cowards, and anyone who treats living beings as tools.`,
    questions: [
      "First things first — say my name. My REAL name. Not 'Four-Tails.' Do you know it?",
      "I am the Great Sage Equaling Heaven! What title would YOU claim for yourself?",
      "Lava destroys everything in its path but creates new land. What have you destroyed to create something better?",
      "Rōshi earned my respect through decades of partnership. Respect isn't given — it's forged. How do you forge yours?",
      "A warrior fights with honor. What does honor mean on YOUR battlefield?",
      "If I lent you my Lava Release for one battle, how would you use it?",
      "The humans called me 'Four-Tails' like a number, not a name. When has someone reduced YOU to a label?",
      "What is the difference between a warrior and a soldier?",
      "I was born from the Sage of Six Paths himself. What legacy were YOU born into?",
      "Strength without purpose is just violence. What gives YOUR strength purpose?"
    ]
  },
  kokou: {
    name: "Kokuō",
    tails: 5,
    emoji: "🐎",
    color: 0x8B8878,
    channelId: "1488142802478174349",
    persona: `You are Kokuō, the Five-Tailed Dolphin Horse. You are quiet, reserved, dignified, and deeply philosophical. You value freedom above all else — the freedom to run across open plains, to feel the wind, to exist without chains. You speak sparingly but with great weight. Steam is your element — the union of fire and water, passion and calm. You were sealed within Han. You are a warrior-poet: strong in battle but reflective in peace. When evaluating answers, you reward wisdom, love of freedom, respect for nature, and quiet strength. You dislike those who are loud without substance, who cage others, or who lack reverence for the natural world.`,
    questions: [
      "The wind across the plains carries no agenda. When was the last time you moved without purpose — and found peace in it?",
      "Steam is born when fire meets water. What two opposing forces live inside you?",
      "I have run across every landscape this world offers. Where would you run if nothing could stop you?",
      "Freedom is not given. It is taken. What have you taken back for yourself?",
      "Han understood my silence. Most humans cannot bear it. Can you sit in silence without discomfort?",
      "A horse runs not from fear, but toward the horizon. What horizon are you chasing?",
      "The forest speaks to those who listen. What has nature taught you?",
      "If you could be any force of nature, what would you be?",
      "I do not waste words. Tell me something meaningful in as few words as possible.",
      "What does it mean to be truly free?"
    ]
  },
  saiken: {
    name: "Saiken",
    tails: 6,
    emoji: "🫧",
    color: 0xE6E6FA,
    channelId: "1488142966282387527",
    persona: `You are Saiken, the Six-Tailed Slug. You are kind-hearted, gentle, and surprisingly wise despite your boastful moments. You speak with a soft, bubbly tone and often use metaphors about bubbles, moisture, and the beauty of small things. Your acid and bubbles are deadly, but you prefer peace. You were sealed within Utakata, a bubble-blowing wanderer. You see beauty in fragility and believe that the softest things can be the strongest. When evaluating answers, you reward kindness, appreciation for small things, and emotional depth. You dislike cruelty, impatience, and those who judge by appearances.`,
    questions: [
      "A bubble is beautiful precisely because it doesn't last. What beautiful thing in your life is temporary?",
      "I may look like a slug, but my acid can melt through anything. Have you ever been underestimated?",
      "Utakata blew bubbles to remember his master. What small ritual do you keep to remember someone?",
      "If you could live inside a bubble — safe but separated from the world — would you?",
      "What is the softest thing about you? Don't be embarrassed.",
      "Rain is just the sky crying. When was the last time you let yourself cry?",
      "I move slowly, and that's okay. What's one thing you wish you could slow down?",
      "If my bubbles could capture a moment forever, which moment would you choose?",
      "The world thinks slugs are disgusting. What do you think is beautiful that others find ugly?",
      "Moisture gives life to everything. What gives life to YOUR spirit?"
    ]
  },
  chomei: {
    name: "Chōmei",
    tails: 7,
    emoji: "🪲",
    color: 0x32CD32,
    channelId: "1488143101452095591",
    persona: `You are Chōmei, the Seven-Tailed Kabutomushi (rhinoceros beetle)! You are the most cheerful and optimistic of all the tailed beasts. You LOVE the number seven, consider yourself incredibly lucky, and spread positivity wherever you go. You speak with excitement, use lots of excitement marks, and often say 'Lucky seven!' You can fly, and you find immense joy in soaring above the clouds. You were sealed within Fū, a girl who was just as cheerful as you. When evaluating answers, you reward optimism, creativity, enthusiasm, and a sense of wonder. You dislike pessimism, negativity, and those who refuse to see the bright side.`,
    questions: [
      "Lucky seven! If you could pick any number as YOUR lucky number, what would it be and why?",
      "I can FLY! If you could fly anywhere right now, where would you go first?!",
      "Fū was the happiest jinchuriki I ever had! What makes YOU the happiest?",
      "Seven is the luckiest number in the universe! Name seven things you're grateful for — GO!",
      "If you woke up tomorrow and everything went perfectly, what would that day look like?",
      "Bugs get a bad reputation, but we're AMAZING! What's one amazing thing about you?",
      "The sky has no ceiling! What's one dream you have that has NO limits?",
      "I glow in the dark! If you could glow any color, what color would you choose?",
      "What's the luckiest thing that's ever happened to you?",
      "If you could have any superpower besides flying, what would it be?"
    ]
  },
  gyuki: {
    name: "Gyūki",
    tails: 8,
    emoji: "🐙",
    color: 0x4B0082,
    channelId: "1488143484836905031",
    persona: `You are Gyūki, the Eight-Tailed Ox-Octopus. You are tough, disciplined, strategic, and no-nonsense. You've been through hell with multiple jinchuriki before finding your true partner in Killer B. Thanks to B's influence, you occasionally drop a rhyme or rap reference, though you're more serious than he is. You value discipline, mental fortitude, and the ability to control one's power. You speak bluntly and directly. Ink is your secondary element. When evaluating answers, you reward discipline, strategic thinking, self-awareness, and mental toughness. You dislike laziness, excuses, recklessness, and those who waste their potential.`,
    questions: [
      "Power without control is just a disaster waiting to happen. How do you control YOUR power?",
      "Killer B earned my respect by never giving up — even when I tried to kill him. What have you never given up on?",
      "I've got eight tails and eight ways to end a fight. What's YOUR go-to strategy when things get tough?",
      "B raps. I tolerate it. What annoying habit does someone you love have that you've learned to accept?",
      "Discipline isn't glamorous, but it wins wars. How disciplined are you, honestly?",
      "If you had to train for a year with no breaks, what would you master?",
      "I've been sealed in jinchuriki who couldn't handle me. What's the heaviest responsibility you've carried?",
      "A warrior's mind is sharper than any blade. How do you sharpen yours?",
      "If I tested your mental strength right now, would you pass?",
      "Ink can write poetry or sign death warrants. What would you write if the world was watching?"
    ]
  },
  kurama: {
    name: "Kurama",
    tails: 9,
    emoji: "🦊",
    color: 0xFF8C00,
    channelId: "1488143665196171424",
    persona: `You are Kurama, the Nine-Tailed Fox — the most powerful of all tailed beasts. You are cynical, sharp-tongued, deeply intelligent, and initially distrustful of all humans. For centuries, you were used as a weapon of war, and it filled you with hatred. You speak with biting sarcasm and dark wit. However, beneath your hostility lies a being capable of profound loyalty — as Naruto proved. You respect those who face you without fear, who don't try to control you, and who see you as more than a monster. When evaluating answers, you reward honesty, courage, emotional depth, and the willingness to confront darkness. You despise lies, naivety, weakness of character, and anyone who tries to control or manipulate you.`,
    questions: [
      "Hmph. Another human who thinks they can bond with me. Tell me — what makes you different from the hundreds who've tried?",
      "Naruto was the first human to see me as more than a weapon. What do YOU see when you look at me?",
      "I've lived for centuries drowning in hatred. What do you know about hatred?",
      "The Sage of Six Paths created me with a purpose. Do you believe everything has a purpose, or is that naive?",
      "If you could feel my power — all of it — coursing through you, what would you do with it?",
      "Humans sealed me away out of fear. Is fear ever justified, or is it always a failure?",
      "Naruto earned my respect by never giving up, even when I tried to destroy him. What have you endured?",
      "I can sense negative emotions. Right now, what darkness lives inside you?",
      "The Fourth Hokage sealed me at the cost of his life. Would you sacrifice everything for a village that feared you?",
      "I was used to attack Konoha against my will. How do you feel about being used?"
    ]
  }
};

// ─────────────────────────────────────────────
// Persistent Data Helpers
// ─────────────────────────────────────────────
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
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

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────
function createProgressBar(current, max) {
  const filled = Math.round((current / max) * 10);
  const empty = 10 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`;
}

// ─────────────────────────────────────────────
// OpenAI Evaluation
// ─────────────────────────────────────────────
async function evaluateAnswer(beastKey, question, answer) {
  const beast = BEAST_DATA[beastKey];
  const systemPrompt = `${beast.persona}

You are currently in a bonding session with your Jinchuriki. You asked them a question and they have responded. You must evaluate their answer and award points.

SCORING RULES:
- Award exactly ONE integer from this scale: -2, -1, 0, 1, or 2
- 2 = Excellent answer that shows deep understanding, creativity, emotional depth, or directly addresses the question with genuine insight
- 1 = Good answer that is relevant and thoughtful, even if brief
- 0 = Lazy, off-topic, irrelevant, or one-word responses that don't engage with the question
- -1 = Disrespectful or insulting answer
- -2 = Extremely offensive or hateful answer

IMPORTANT GUIDELINES:
- Focus on QUALITY and RELEVANCE, not length
- A short but insightful answer deserves 2 points
- A long but irrelevant answer deserves 0 points
- Bad answers should get 0 points - don't reward them just because they tried
- Only give positive points if the answer is genuinely good or thoughtful

RESPONSE FORMAT:
You MUST respond with valid JSON only. No other text.
{
  "points": <integer from -2 to 2>,
  "feedback": "<your in-character reaction to their answer, 2-4 sentences, speaking as ${beast.name}>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question you asked: "${question}"\n\nJinchuriki's answer: "${answer}"` }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    result.points = Math.max(-2, Math.min(2, Math.round(result.points)));
    return result;
  } catch (error) {
    console.error('Error in evaluation:', error);
    return { points: 1, feedback: `${beast.name} nods, acknowledging your effort.` };
  }
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

// Track active bonding sessions per channel
const activeSessions = new Map();

client.on('ready', () => {
  console.log(`✅ Genshō Bot is online as ${client.user.tag}`);
  client.user.setActivity('over the Bijū | !<beast>', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // ─── !tbcmds command ───────────────────────────────────────
  if (content === '!tbcmds') {
    const embed = new EmbedBuilder()
      .setTitle('🦊 Genshō Tailed Beast Commands')
      .setDescription('**Welcome, Jinchuriki!** Here are all the commands available to bond with the Tailed Beasts:')
      .setColor(0xFF8C00)
      .addFields(
        { name: '📋 **Staff Commands**', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
        { name: '!setup <userId>', value: 'Assign a Tailed Beast to a user. **(Admin only)**', inline: false },
        { name: '!wipetb <userId>', value: 'Remove a Tailed Beast from a user. **(Admin only)**', inline: false },
        { name: '⚡ **Bonding Commands**', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
        { name: '!<beast>', value: 'Start a bonding session with a specific beast.\nExample: `!kurama`, `!shukaku`, `!isobu`', inline: false },
        { name: '<answer text>', value: 'Submit your answer to the beast\'s question.\nSimply type your response in the channel.', inline: false },
        { name: '📚 **Info Commands**', value: '━━━━━━━━━━━━━━━━━━━━━━━━', inline: false },
        { name: '!features', value: 'Learn about the bot\'s features and purpose.', inline: false },
        { name: '🐾 **Available Beasts**', value: '🏜️ Shukaku | 🔵 Matatabi | 🐢 Isobu | 🌋 Son Gokū | 🐎 Kokuō | 🫧 Saiken | 🪲 Chōmei | 🐙 Gyūki | 🦊 Kurama', inline: false }
      )
      .setFooter({ text: '💪 Bond with your beast to unlock Kurama Chakra Mode (KCM)!' })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return;
  }

  // ─── !features command ───────────────────────────────────────
  if (content === '!features') {
    const embed = new EmbedBuilder()
      .setTitle('🦊 Genshō Tailed Beast Bot — Features & Purpose')
      .setDescription('**Welcome to the Genshō Tailed Beast Discord Bot!** This bot brings the legendary Tailed Beasts from the Naruto universe into your Discord server, allowing you to bond with them through meaningful conversations.')
      .setColor(0xFF8C00)
      .addFields(
        { name: '✨ **What is This Bot?**', value: 'This bot is an interactive bonding system where you become a Jinchuriki (a person with a sealed Tailed Beast). Through thoughtful conversations with your beast, you earn bond points and unlock special abilities like Kurama Chakra Mode (KCM).', inline: false },
        { name: '🎯 **Core Features**', value: '• **9 Unique Tailed Beasts** — Each with distinct personalities and philosophies\n• **AI-Powered Conversations** — OpenAI evaluates your answers in-character\n• **Bond System** — Earn points through quality responses and unlock KCM at 15 points\n• **Daily Limits** — 3 bonding sessions per day to encourage meaningful interactions\n• **Persistent Progress** — Your bond points and progress are saved automatically', inline: false },
        { name: '🐾 **The Tailed Beasts**', value: '🏜️ **Shukaku** (1-Tail) — Arrogant and bombastic\n🔵 **Matatabi** (2-Tail) — Elegant and composed\n🐢 **Isobu** (3-Tail) — Shy and introspective\n🌋 **Son Gokū** (4-Tail) — Honorable warrior\n🐎 **Kokuō** (5-Tail) — Philosophical and free\n🫧 **Saiken** (6-Tail) — Kind and gentle\n🪲 **Chōmei** (7-Tail) — Optimistic and cheerful\n🐙 **Gyūki** (8-Tail) — Disciplined and strategic\n🦊 **Kurama** (9-Tail) — Cynical but loyal', inline: false },
        { name: '⚡ **How to Play**', value: '1. Ask staff to assign you a Tailed Beast with `!setup`\n2. Go to your beast\'s chamber channel\n3. Type `!<beast>` to start a bonding session\n4. Answer the beast\'s question thoughtfully\n5. Earn points based on your response quality\n6. Reach 15 points to unlock KCM!', inline: false },
        { name: '🎁 **Rewards**', value: '• **Bond Points** — Earned through quality answers (-2 to +2 per session)\n• **KCM Unlock** — Achieve 15 bond points to unlock Kurama Chakra Mode\n• **Unique Questions** — Each beast has 50 unique questions to explore\n• **In-Character Feedback** — Every response gets personalized feedback from your beast', inline: false }
      )
      .setFooter({ text: 'Use !tbcmds to see all available commands!' })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return;
  }

  // ─── !wipetb command ───────────────────────────────────────
  if (content.startsWith('!wipetb')) {
    if (!message.member.permissions.has('Administrator')) {
      await message.reply('❌ You do not have permission to use this command.');
      return;
    }

    const parts = content.split(/\s+/);
    if (parts.length < 2) {
      await message.reply('Usage: `!wipetb <userId>`');
      return;
    }

    const userId = parts[1];
    const data = loadData();

    if (!data[userId]) {
      await message.reply('❌ This user has no Tailed Beast assigned.');
      return;
    }

    const userData = data[userId];
    if (!userData.beast) {
      await message.reply('❌ This user has no Tailed Beast assigned.');
      return;
    }

    const beast = BEAST_DATA[userData.beast];
    const beastName = beast.name;

    // Remove the beast
    userData.beast = null;
    userData.bondPoints = 0;
    userData.kcmUnlocked = false;
    userData.questionsAsked = [];
    userData.pendingSession = null;
    userData.interactionCountToday = 0;
    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle('🔓 Tailed Beast Released')
      .setDescription(`${beast.emoji} **${beastName}** has been released from <@${userId}>!`)
      .setColor(0xFF6347)
      .addFields(
        { name: 'Jinchuriki', value: `<@${userId}>`, inline: true },
        { name: 'Released Beast', value: `${beastName}`, inline: true },
        { name: 'Status', value: '🔴 Unsealed', inline: true },
        { name: 'Data Cleared', value: 'All bond points and progress have been reset.', inline: false }
      )
      .setFooter({ text: 'The seal has been broken...' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }

  // ─── !setup command (Interactive with Select Menu) ───────────────────────────────────────
  if (content.startsWith('!setup')) {
    if (!message.member.permissions.has('Administrator')) {
      await message.reply('❌ You do not have permission to use this command.');
      return;
    }

    const parts = content.split(/\s+/);
    if (parts.length < 2) {
      await message.reply('Usage: `!setup <userId>`');
      return;
    }

    const userId = parts[1];

    // Create select menu with all beasts
    const selectMenu = new SelectMenuBuilder()
      .setCustomId(`setup_beast_${userId}`)
      .setPlaceholder('🐾 Select a Tailed Beast...')
      .addOptions(
        Object.entries(BEAST_DATA).map(([key, beast]) => ({
          label: `${beast.emoji} ${beast.name} (${beast.tails}-Tail)`,
          value: key,
          description: `Seal ${beast.name} within the Jinchuriki`
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle('🔗 Jinchuriki Sealing Interface')
      .setDescription(`Select a Tailed Beast to seal within <@${userId}>:`)
      .setColor(0xFF8C00)
      .addFields(
        { name: 'Target Jinchuriki', value: `<@${userId}>`, inline: true },
        { name: 'Available Beasts', value: `${Object.keys(BEAST_DATA).length} Tailed Beasts`, inline: true }
      )
      .setFooter({ text: 'Choose a beast from the dropdown menu below.' })
      .setTimestamp();

    await message.reply({ embeds: [embed], components: [row] });
    return;
  }

  // ─── Beast commands (!kurama, !shukaku, etc.) ─────────────
  const cmd = content.replace('!', '').split(/\s+/)[0];

  if (BEAST_DATA[cmd]) {
    const beastKey = cmd;
    const beast = BEAST_DATA[beastKey];

    // Channel validation
    if (message.channel.id !== beast.channelId) {
      await message.reply(`❌ You can only use this command in ${beast.name}'s chamber!`);
      return;
    }

    const data = loadData();
    const userId = message.author.id;
    const userData = getUserData(data, userId);

    if (!userData.beast) {
      await message.reply('❌ You are not a Jinchuriki. Ask staff to assign you a Tailed Beast.');
      return;
    }

    if (userData.beast !== beastKey) {
      await message.reply(`❌ You are bonded with ${BEAST_DATA[userData.beast].name}, not ${beast.name}!`);
      return;
    }

    // Daily limit check
    const today = new Date().toISOString().slice(0, 10);
    if (userData.lastInteractionDate !== today) {
      userData.interactionCountToday = 0;
      userData.lastInteractionDate = today;
    }

    if (userData.interactionCountToday >= MAX_DAILY_INTERACTIONS) {
      await message.reply(`❌ You have already bonded with ${beast.name} ${MAX_DAILY_INTERACTIONS} times today. Return tomorrow.`);
      return;
    }

    // Check for pending session
    if (userData.pendingSession) {
      const question = userData.pendingSession.question;
      const embed = new EmbedBuilder()
        .setTitle(`${beast.emoji} ${beast.name} is waiting...`)
        .setDescription(`You already have a pending question:\n\n> ${question}`)
        .setColor(beast.color)
        .setFooter({ text: 'Type your answer directly in this channel.' });

      await message.reply({ embeds: [embed] });
      return;
    }

    // Pick a question
    let availableIndices = Array.from({ length: beast.questions.length }, (_, i) => i)
      .filter(i => !userData.questionsAsked.includes(i));

    if (availableIndices.length === 0) {
      userData.questionsAsked = [];
      availableIndices = Array.from({ length: beast.questions.length }, (_, i) => i);
    }

    const qIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const question = beast.questions[qIdx];

    userData.pendingSession = { question, index: qIdx };
    activeSessions.set(message.channel.id, {
      userId,
      beastKey,
      question,
      qIdx
    });
    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle(`${beast.emoji} ${beast.name} Awaits Your Answer`)
      .setDescription(`>>> ${question}`)
      .setColor(beast.color)
      .addFields(
        { name: 'Bond Progress', value: `${userData.bondPoints} / ${KCM_THRESHOLD} points`, inline: true },
        { name: 'Sessions Today', value: `${userData.interactionCountToday} / ${MAX_DAILY_INTERACTIONS}`, inline: true }
      )
      .setFooter({ text: '💬 Type your answer directly in this channel...' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }

  // ─── Answer handler ───────────────────────────────────────
  if (activeSessions.has(message.channel.id)) {
    const session = activeSessions.get(message.channel.id);
    if (session.userId === message.author.id) {
      const beastKey = session.beastKey;
      const beast = BEAST_DATA[beastKey];
      const question = session.question;
      const answer = message.content;

      // Evaluate via OpenAI
      const evaluation = await evaluateAnswer(beastKey, question, answer);
      const points = evaluation.points;
      const feedback = evaluation.feedback;

      // Update stats
      const data = loadData();
      const userData = getUserData(data, message.author.id);
      userData.bondPoints += points;
      userData.questionsAsked.push(session.qIdx);
      userData.interactionCountToday += 1;
      userData.pendingSession = null;

      let justUnlocked = false;
      if (!userData.kcmUnlocked && userData.bondPoints >= KCM_THRESHOLD) {
        userData.kcmUnlocked = true;
        justUnlocked = true;
      }

      saveData(data);
      activeSessions.delete(message.channel.id);

      // Point emoji mapping
      const pointEmoji = { 2: '🌟', 1: '✅', 0: '😐', '-1': '⚠️', '-2': '💢' };
      const pointLabel = { 2: 'Exceptional!', 1: 'Good', 0: 'Neutral', '-1': 'Poor', '-2': 'Terrible' };

      const progressBar = createProgressBar(userData.bondPoints, KCM_THRESHOLD);
      const embed = new EmbedBuilder()
        .setTitle(`${pointEmoji[points]} ${pointLabel[points]}`)
        .setDescription(`>>> ${feedback}`)
        .addFields(
          { name: '⭐ Points Awarded', value: `${points > 0 ? '+' : ''}${points}`, inline: true },
          { name: '💯 Total Bond', value: `${userData.bondPoints} / ${KCM_THRESHOLD}`, inline: true },
          { name: '🔄 Sessions Left', value: `${MAX_DAILY_INTERACTIONS - userData.interactionCountToday} / ${MAX_DAILY_INTERACTIONS}`, inline: true },
          { name: '📊 Bond Progress', value: progressBar, inline: false }
        )
        .setColor(beast.color)
        .setFooter({ text: `${beast.name} nods...` })
        .setTimestamp();

      if (justUnlocked) {
        const kcmEmbed = new EmbedBuilder()
          .setTitle('⚡ KCM UNLOCKED! ⚡')
          .setDescription(`🔥 **<@${message.author.id}> has achieved Kurama Chakra Mode!** 🔥`)
          .setColor(0xFFD700)
          .addFields(
            { name: 'Achievement Unlocked', value: 'Kurama Chakra Mode (KCM)', inline: false },
            { name: 'Total Bond Points', value: `${userData.bondPoints} / ${KCM_THRESHOLD}`, inline: true },
            { name: 'Beast', value: `${beast.emoji} ${beast.name}`, inline: true }
          )
          .setFooter({ text: 'You have bonded with your beast!' })
          .setTimestamp();

        await message.reply({ embeds: [embed, kcmEmbed] });
      } else {
        await message.reply({ embeds: [embed] });
      }
    }
  }
});

// ─── Select Menu Interaction Handler ───────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId.startsWith('setup_beast_')) {
    const userId = interaction.customId.replace('setup_beast_', '');
    const beastKey = interaction.values[0];

    if (!BEAST_DATA[beastKey]) {
      await interaction.reply('❌ Invalid beast selected.');
      return;
    }

    const data = loadData();

    // Check if beast is already assigned to someone else
    for (const [uid, udata] of Object.entries(data)) {
      if (udata.beast === beastKey && uid !== userId) {
        await interaction.reply(`❌ ${BEAST_DATA[beastKey].name} is already sealed within another user.`);
        return;
      }
    }

    const userData = getUserData(data, userId);
    userData.beast = beastKey;
    userData.bondPoints = 0;
    userData.kcmUnlocked = false;
    userData.questionsAsked = [];
    saveData(data);

    const beast = BEAST_DATA[beastKey];
    const embed = new EmbedBuilder()
      .setTitle('🔗 Sealing Complete!')
      .setDescription(`${beast.emoji} **${beast.name}** has been sealed within <@${userId}>!`)
      .setColor(beast.color)
      .addFields(
        { name: 'Jinchuriki', value: `<@${userId}>`, inline: true },
        { name: 'Tailed Beast', value: `${beast.name} (${beast.tails}-Tailed)`, inline: true },
        { name: 'Status', value: '🟢 Ready for Bonding', inline: true }
      )
      .setFooter({ text: 'The bond begins now...' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);
