/**
 * Genshō Tailed Beast Discord Bot - Consolidated Edition
 * =======================================================
 * A Discord bot mirroring the Genshō Tailed Beast web project.
 * Uses ! prefix commands for all interactions.
 * 
 * This version is self-contained with all 450 bonding questions embedded.
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
const KCM_THRESHOLD = 15;
const MAX_DAILY_INTERACTIONS = 1;

// ─────────────────────────────────────────────
// Tailed Beast Data & Channel IDs
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
// Embedded Bonding Questions (450 Total)
// ─────────────────────────────────────────────
const BONDING_QUESTIONS = {
  "matatabis": [
    {"question": "Do you believe true strength lies in grace rather than brute force?", "answer": "Yes"},
    {"question": "Will you honor our bond by moving forward with unwavering loyalty even when others doubt you?", "answer": "Yes"},
    {"question": "Is it acceptable to sacrifice elegance in your actions if it achieves your goal more efficiently?", "answer": "No"},
    {"question": "Do you promise to protect the innocent not because you must, but because it is the right thing to do?", "answer": "Yes"},
    {"question": "When faced with difficult choices, will you always consider the subtlety and refinement of your decisions?", "answer": "Yes"},
    {"question": "Is it permissible to abandon those you care about to save yourself from hardship?", "answer": "No"},
    {"question": "Do you value the quiet strength found in patience and restraint over chaotic bursts of rage?", "answer": "Yes"},
    {"question": "Is it acceptable to deceive others if it serves your survival, regardless of the harm it causes?", "answer": "No"},
    {"question": "Will you embrace calm and composure even when raging storms threaten your mind and soul?", "answer": "Yes"},
    {"question": "Do you believe it is wise to silence your emotions completely rather than face them honestly?", "answer": "No"},
    {"question": "Can you accept that sometimes yielding with dignity is stronger than forcing your way through?", "answer": "Yes"},
    {"question": "Is it right to act with arrogance and dismiss others as weak if it confirms your superiority?", "answer": "No"},
    {"question": "Will you guard our relationship like a precious flame that must never be allowed to fade?", "answer": "Yes"},
    {"question": "Do you think it is justifiable to sever bonds quickly if they bring personal inconvenience?", "answer": "No"},
    {"question": "Do you believe your path should be guided by honor and integrity, even when darkness tempts you otherwise?", "answer": "Yes"},
    {"question": "Is it acceptable to act without foresight or care for the consequences of your actions?", "answer": "No"},
    {"question": "Will you cherish the intricate dance of balance between power and control within yourself?", "answer": "Yes"},
    {"question": "Do you consider reckless abandon a sign of true freedom and strength?", "answer": "No"},
    {"question": "Can you stand firm in your convictions even when others demand you conform?", "answer": "Yes"},
    {"question": "Is it wise to abandon your principles if it means avoiding conflict or discomfort?", "answer": "No"},
    {"question": "Will you seek harmony with me, honoring the unique fusion of beast and human in you?", "answer": "Yes"},
    {"question": "Do you view me only as a tool to wield power, rather than a partner to respect?", "answer": "No"},
    {"question": "Do you believe revealing vulnerability can sometimes reveal true strength?", "answer": "Yes"},
    {"question": "Is hiding your true feelings behind a mask of indifference preferable to facing them honestly?", "answer": "No"},
    {"question": "Will you treat our union as a sacred dance requiring mutual trust and elegance?", "answer": "Yes"},
    {"question": "Is it acceptable to break promises made in the heat of desperation or fear?", "answer": "No"},
    {"question": "Can you maintain dignity even when the world around you collapses into chaos?", "answer": "Yes"},
    {"question": "Do you believe surrendering to rage and impulse is the path to freedom?", "answer": "No"},
    {"question": "Do you promise to nurture the subtle flame of respect between us above all else?", "answer": "Yes"},
    {"question": "Is it permissible to ignore my guidance when you believe your own way is easier?", "answer": "No"},
    {"question": "Do you accept that some battles are won not by overwhelming force, but by quiet resilience?", "answer": "Yes"},
    {"question": "Would you sacrifice grace for brute victory without caring about the cost to honor?", "answer": "No"},
    {"question": "Will you seek to understand me beyond my fierceness, embracing all within our shared spirit?", "answer": "Yes"},
    {"question": "Do you treat me as a mere weapon, something to unleash without thought or care?", "answer": "No"},
    {"question": "Do you find value in restraint and subtlety even when the world demands you shout?", "answer": "Yes"},
    {"question": "Is it better to dominate through fear than inspire through respect?", "answer": "No"},
    {"question": "Will you listen to the quiet whispers of wisdom I share, even when they challenge your ego?", "answer": "Yes"},
    {"question": "Do you ignore counsel when it conflicts with pride or stubbornness?", "answer": "No"},
    {"question": "Do you believe our union is a shared journey of growth rather than a burden to bear?", "answer": "Yes"},
    {"question": "Is it acceptable to resent me simply because of my nature rather than seek harmony?", "answer": "No"},
    {"question": "Will you treasure patience as the art that tempers the fire within your soul?", "answer": "Yes"},
    {"question": "Is impatience justified if it speeds you toward temporary gains?", "answer": "No"},
    {"question": "Do you understand that true elegance lies in embracing both light and shadow within us?", "answer": "Yes"},
    {"question": "Is it easier to deny the darkness inside rather than seek balance with it?", "answer": "No"},
    {"question": "Will you face your flaws with honesty instead of hiding behind false pride?", "answer": "Yes"},
    {"question": "Is it acceptable to pretend to be flawless if it gains you respect from others?", "answer": "No"},
    {"question": "Do you vow to walk forward with me united, melding our wills into a refined dance of power?", "answer": "Yes"},
    {"question": "Do you see me as a hindrance that must be subdued rather than a partner to understand?", "answer": "No"}
  ],
  "kokuo": [
    {"question": "Do you believe that true strength comes from mastering both your mind and body?", "answer": "Yes"},
    {"question": "If it meant protecting those you love, would you endure pain without complaint?", "answer": "Yes"},
    {"question": "Would you ever abandon your own principles for personal gain?", "answer": "No"},
    {"question": "Is it more honorable to confront your fears than to avoid them?", "answer": "Yes"},
    {"question": "Do you trust in the bond we share to overcome your darkest moments?", "answer": "Yes"},
    {"question": "Would you sacrifice the wellbeing of others to save yourself?", "answer": "No"},
    {"question": "Do you accept that sometimes control requires patience rather than force?", "answer": "Yes"},
    {"question": "Is it acceptable to let anger dictate your decisions during battle?", "answer": "No"},
    {"question": "Can you embrace the chaos within you as a source of power, rather than a curse?", "answer": "Yes"},
    {"question": "Would you flee when faced with overwhelming odds to preserve your life?", "answer": "No"},
    {"question": "Do you recognize the necessity of discipline to harness true power?", "answer": "Yes"},
    {"question": "Would you hide your weaknesses from me instead of working to overcome them?", "answer": "No"},
    {"question": "Is it important to act with conviction even when others doubt you?", "answer": "Yes"},
    {"question": "Do you believe abandoning your post is ever justified?", "answer": "No"},
    {"question": "Will you face isolation and hardship if it means protecting what is right?", "answer": "Yes"},
    {"question": "Does despair justify surrendering your responsibilities?", "answer": "No"},
    {"question": "Can you accept my presence not as a curse, but as a partner in your growth?", "answer": "Yes"},
    {"question": "Would you reject strength if it came from a source you fear or mistrust?", "answer": "No"},
    {"question": "Do you believe that restraint is sometimes greater than outright power?", "answer": "Yes"},
    {"question": "Is it acceptable to exploit others’ weaknesses to gain an advantage?", "answer": "No"},
    {"question": "Are you willing to learn from me, even if it challenges your pride?", "answer": "Yes"},
    {"question": "Would you deny your own pain to maintain a facade of invincibility?", "answer": "No"},
    {"question": "Do you see strength as a responsibility, not just a means to dominate?", "answer": "Yes"},
    {"question": "Is vengeance worth sacrificing your own peace of mind?", "answer": "No"},
    {"question": "Will you nurture our bond even when it feels like a constant struggle?", "answer": "Yes"},
    {"question": "Would you sever ties with me if it made your path easier?", "answer": "No"},
    {"question": "Do you believe that true leadership requires both compassion and power?", "answer": "Yes"},
    {"question": "Do you believe that our bond requires your unwavering courage?", "answer": "Yes"},
    {"question": "Would you abandon your morals if I promised unlimited power in return?", "answer": "No"},
    {"question": "Is it essential for you to accept me fully, even the parts you fear?", "answer": "Yes"},
    {"question": "Would you pretend to be stronger than you are to hide your weaknesses from me?", "answer": "No"},
    {"question": "Do you value authenticity over appearing flawless in our partnership?", "answer": "Yes"},
    {"question": "Is it justifiable to harm innocents if it secures our survival?", "answer": "No"},
    {"question": "Would you risk everything to protect me, even if it costs you dearly?", "answer": "Yes"},
    {"question": "Do you think it’s acceptable to resent me even while we share this bond?", "answer": "No"},
    {"question": "Do you accept that trust between us must be earned and maintained continuously?", "answer": "Yes"},
    {"question": "Would you sacrifice others to shield yourself from harm?", "answer": "No"},
    {"question": "Is it better to act with honor even if it means losing power?", "answer": "Yes"},
    {"question": "Would you seek to sever our bond if it ever became burdensome?", "answer": "No"},
    {"question": "Do you believe that patience and persistence are more powerful than raw force?", "answer": "Yes"},
    {"question": "Would you allow anger to control your decisions when I am involved?", "answer": "No"},
    {"question": "Is it important for you to share your true self with me without reservation?", "answer": "Yes"},
    {"question": "Do you think surrendering your will to mine shows strength?", "answer": "No"},
    {"question": "Would you rather learn from your failures than ignore them out of pride?", "answer": "Yes"},
    {"question": "Is it acceptable to compromise your values for fleeting success?", "answer": "No"},
    {"question": "Do you promise to face our future together honestly, without pretending?", "answer": "Yes"}
  ],
  "songoku": [
    {"question": "Do you believe that true strength is born from the fire of your own will?", "answer": "Yes"},
    {"question": "Would you ever use my power to oppress those who are weaker than you?", "answer": "No"},
    {"question": "Is it more important to be feared by your enemies than to be respected by your allies?", "answer": "No"},
    {"question": "Do you accept that every battle you fight is a test of your inner spirit?", "answer": "Yes"},
    {"question": "Will you stand firm in your convictions even when the entire world stands against you?", "answer": "Yes"},
    {"question": "Is it acceptable to abandon a comrade if it means securing your own survival?", "answer": "No"},
    {"question": "Do you believe that true wisdom is found in the heat of conflict rather than in quiet reflection?", "answer": "Yes"},
    {"question": "Would you sacrifice your own honor to achieve a quick and easy victory?", "answer": "No"},
    {"question": "Do you recognize that my power is a gift that must be tempered with discipline?", "answer": "Yes"},
    {"question": "Is it right to let your pride blind you to the lessons that failure can teach?", "answer": "No"},
    {"question": "Will you embrace the struggle of our bond as a path to your own enlightenment?", "answer": "Yes"},
    {"question": "Do you think that true power is something that can be taken rather than earned?", "answer": "No"},
    {"question": "Are you willing to face the consequences of your actions without making excuses?", "answer": "Yes"},
    {"question": "Is it better to live a long life of cowardice than a short life of courage?", "answer": "No"},
    {"question": "Do you believe that our union is a partnership of equals rather than master and servant?", "answer": "Yes"},
    {"question": "Would you ever deny your own nature to fit into the expectations of others?", "answer": "No"},
    {"question": "Is it essential to maintain your resolve even when hope seems lost?", "answer": "Yes"},
    {"question": "Do you think that raw emotion is a weakness that must be suppressed at all costs?", "answer": "No"},
    {"question": "Will you protect the legacy of the Great Sage by using my power for the right reasons?", "answer": "Yes"},
    {"question": "Is it acceptable to use deception to gain an advantage over an honorable opponent?", "answer": "No"},
    {"question": "Do you believe that true strength is found in the ability to protect others?", "answer": "Yes"},
    {"question": "Would you ever seek to control me through fear rather than through mutual respect?", "answer": "No"},
    {"question": "Is it important to always be honest with yourself about your own limitations?", "answer": "Yes"},
    {"question": "Do you think that the path of the warrior is one that can be walked without sacrifice?", "answer": "No"},
    {"question": "Will you face the darkness within you with the same courage you face your enemies?", "answer": "Yes"},
    {"question": "Is it right to value your own life above the principles you claim to hold?", "answer": "No"},
    {"question": "Do you believe that our bond is a source of strength that transcends mere physical power?", "answer": "Yes"},
    {"question": "Would you ever turn your back on a challenge because you were afraid of failing?", "answer": "No"},
    {"question": "Is it essential to always act with integrity, even when no one is watching?", "answer": "Yes"},
    {"question": "Do you think that the world is a place where only the strongest deserve to survive?", "answer": "No"},
    {"question": "Will you nurture the fire of our bond with the same passion you bring to battle?", "answer": "Yes"},
    {"question": "Is it acceptable to blame others for the mistakes you have made yourself?", "answer": "No"},
    {"question": "Do you believe that true courage is the ability to admit when you are wrong?", "answer": "Yes"},
    {"question": "Would you ever use my power to seek revenge for a personal slight?", "answer": "No"},
    {"question": "Is it important to always strive for self-improvement, no matter how strong you become?", "answer": "Yes"},
    {"question": "Do you think that the bond between a Jinchuriki and their beast is a curse?", "answer": "No"},
    {"question": "Will you stand as a guardian of the balance between humans and the Tailed Beasts?", "answer": "Yes"},
    {"question": "Is it right to let your fear of my power prevent you from using it to do good?", "answer": "No"},
    {"question": "Do you believe that true strength is something that is built over time through hardship?", "answer": "Yes"},
    {"question": "Would you ever sacrifice your own humanity to become the ultimate weapon?", "answer": "No"},
    {"question": "Is it essential to always treat me with the respect that a Great Sage deserves?", "answer": "Yes"},
    {"question": "Do you think that the path of peace is one that can be achieved through force alone?", "answer": "No"},
    {"question": "Will you embrace the responsibility of our bond with an open heart and a strong mind?", "answer": "Yes"},
    {"question": "Is it acceptable to ignore the suffering of others if it doesn't affect you directly?", "answer": "No"},
    {"question": "Do you believe that our shared journey is one that will lead to a better future for all?", "answer": "Yes"},
    {"question": "Would you ever seek to sever our bond if it meant you could live a normal life?", "answer": "No"},
    {"question": "Is it important to always remember the origins of our power and the responsibility it brings?", "answer": "Yes"},
    {"question": "Do you think that the bond we share is something that can be broken by the will of others?", "answer": "No"},
    {"question": "Will you walk the path of the warrior with me, united in purpose and spirit?", "answer": "Yes"}
  ],
  "kurama": [
    {"question": "Do you accept the burden of power without blaming the world for your suffering?", "answer": "Yes"},
    {"question": "Will you face your fears and rage head-on instead of suppressing them?", "answer": "Yes"},
    {"question": "Do you promise to never deceive me about your true feelings and intentions?", "answer": "Yes"},
    {"question": "In moments of despair, will you choose resolve over surrender?", "answer": "Yes"},
    {"question": "Are you willing to trust me even when others reject or fear you?", "answer": "Yes"},
    {"question": "Do you believe that strength comes only from solitary struggle, not from alliance?", "answer": "No"},
    {"question": "Will you guard your rage so it never consumes your sense of self?", "answer": "Yes"},
    {"question": "Do you accept that I am a part of you and not merely a tool to wield?", "answer": "Yes"},
    {"question": "Is preserving your pride more important to you than understanding your true nature?", "answer": "No"},
    {"question": "Will you embrace your flaws as the source of your unique power?", "answer": "Yes"},
    {"question": "Are you willing to endure loneliness and isolation if it means protecting others?", "answer": "Yes"},
    {"question": "Do you consider raw anger a strength rather than a weakness to be controlled?", "answer": "No"},
    {"question": "Will you confront the darkness within yourself instead of denying it?", "answer": "Yes"},
    {"question": "Is cooperating with me more important than dominating me?", "answer": "Yes"},
    {"question": "Do you see vulnerability as a sign of weakness?", "answer": "No"},
    {"question": "Will you fight alongside me even if the world views us as monsters?", "answer": "Yes"},
    {"question": "Do you reject the idea that you and I must be enemies?", "answer": "Yes"},
    {"question": "Is self-sacrifice preferable to selfish gain in our path forward?", "answer": "Yes"},
    {"question": "Do you avoid truth to maintain comfort in lies?", "answer": "No"},
    {"question": "Will you push past hatred to find understanding between us?", "answer": "Yes"},
    {"question": "Do you believe strength is meaningless without control?", "answer": "Yes"},
    {"question": "Are you willing to bear the scars of our battles with pride and resolve?", "answer": "Yes"},
    {"question": "Is ignoring pain preferable to learning from it?", "answer": "No"},
    {"question": "Will you embrace the unpredictable nature of our bond instead of fearing it?", "answer": "Yes"},
    {"question": "Do you commit to honesty with me even when it angers or disappoints me?", "answer": "Yes"},
    {"question": "Do you think yielding to others is a sign of weakness?", "answer": "No"},
    {"question": "Will you protect those you care for even at great personal cost?", "answer": "Yes"},
    {"question": "Do you value pragmatic strength over brute force?", "answer": "Yes"},
    {"question": "Is it acceptable to hide your pain to appear strong in front of me?", "answer": "No"},
    {"question": "Are you prepared to adapt and grow through our shared hardships?", "answer": "Yes"},
    {"question": "Do you agree that hate should never cloud judgement or bond?", "answer": "Yes"},
    {"question": "Is it right to surrender your principles for fleeting peace?", "answer": "No"},
    {"question": "Will you choose to stand tall in defiance rather than crumble in despair?", "answer": "Yes"},
    {"question": "Do you believe true power demands accountability, not abuse?", "answer": "Yes"},
    {"question": "Are you willing to listen to my perspective even when it conflicts with your own?", "answer": "Yes"},
    {"question": "Do you consider arrogance an acceptable shield against vulnerability?", "answer": "No"},
    {"question": "Will you nurture patience in moments when rage beckons?", "answer": "Yes"},
    {"question": "Is it better to isolate ourselves than risk betrayal by others?", "answer": "No"},
    {"question": "Do you seek to understand the roots of your anger rather than only express it?", "answer": "Yes"},
    {"question": "Are you committed to mutual growth rather than using me solely for power?", "answer": "Yes"},
    {"question": "Is it right to demand unquestioning obedience from me?", "answer": "No"},
    {"question": "Will you nurture the bond between us through hardship and patience?", "answer": "Yes"},
    {"question": "Do you believe that loss can teach more than victory?", "answer": "Yes"},
    {"question": "Is it acceptable to act recklessly if it means proving your strength to me?", "answer": "No"},
    {"question": "Will you honor the power I grant without abusing it for selfish ends?", "answer": "Yes"},
    {"question": "Do you refuse to let hatred define your existence?", "answer": "Yes"},
    {"question": "Is it better to give in to despair than to fight with dwindling hope?", "answer": "No"},
    {"question": "Are you determined to keep a clear mind even in the storm of battle?", "answer": "Yes"}
  ],
  "isobu": [
    {"question": "Do you accept the burden of my power as a means to protect those who cannot defend themselves?", "answer": "Yes"},
    {"question": "Will you ever use my strength to harm the innocent or for selfish gain?", "answer": "No"},
    {"question": "Do you believe that true strength lies in patience and calculated perseverance rather than reckless force?", "answer": "Yes"},
    {"question": "Is abandoning your responsibility to me in your time of greatest need acceptable?", "answer": "No"},
    {"question": "Do you trust me enough to share your deepest fears and doubts without hiding them?", "answer": "Yes"},
    {"question": "Will you deny my existence or betray our bond if it means saving face among others?", "answer": "No"},
    {"question": "Do you respect the limits of your own spirit and recognize when you must lean on my power?", "answer": "Yes"},
    {"question": "Is it honorable to sacrifice your own well-being to prove your independence from me?", "answer": "No"},
    {"question": "Will you strive to remain calm and composed even in moments of chaos and despair?", "answer": "Yes"},
    {"question": "Is succumbing to anger and losing control a worthy expression of your pain?", "answer": "No"},
    {"question": "Do you acknowledge that my presence is a part of your identity, not just a tool to wield?", "answer": "Yes"},
    {"question": "Is separating yourself from me to claim your own humanity a path you would take?", "answer": "No"},
    {"question": "Do you believe that understanding me fully is key to mastering your power?", "answer": "Yes"},
    {"question": "Are you willing to bear the burden of my existence alongside your own?", "answer": "Yes"},
    {"question": "Must strength always be shown through ruthless action?", "answer": "No"},
    {"question": "Do you trust me enough to share your fears without judgment?", "answer": "Yes"},
    {"question": "Is it preferable to hide your weaknesses rather than confront them openly?", "answer": "No"},
    {"question": "Would you rather be feared than misunderstood?", "answer": "No"},
    {"question": "Do you believe our bond can change the fate written by others?", "answer": "Yes"},
    {"question": "Should you suppress your emotions to maintain control over me?", "answer": "No"},
    {"question": "Do you accept that I, too, have struggles and doubts despite my form?", "answer": "Yes"},
    {"question": "Is obeying others' expectations more important than defining your own path?", "answer": "No"},
    {"question": "Would you put your life on the line to protect me as I protect you?", "answer": "Yes"},
    {"question": "Is it justifiable to abandon our bond when it becomes inconvenient?", "answer": "No"},
    {"question": "Do you believe that reconciliation between us will make us stronger?", "answer": "Yes"},
    {"question": "Is fear of your own power a valid reason to refuse responsibility?", "answer": "No"},
    {"question": "Are you willing to admit when you are wrong to maintain our harmony?", "answer": "Yes"},
    {"question": "Do you see me as a burden that limits your personal growth?", "answer": "No"},
    {"question": "Would you rather seek revenge than forgiveness in moments of betrayal?", "answer": "No"},
    {"question": "Do you acknowledge that acceptance of my nature is acceptance of yourself?", "answer": "Yes"},
    {"question": "Is it better to keep me chained and restrained than risk losing control?", "answer": "No"},
    {"question": "Will you move forward with me even if the path is perilous and uncertain?", "answer": "Yes"},
    {"question": "Must the devil inside be silenced if it speaks uncomfortable truths?", "answer": "No"},
    {"question": "Do you respect that my power demands responsibility beyond your desires?", "answer": "Yes"},
    {"question": "Is submission to my rage the only way to harness our strength?", "answer": "No"},
    {"question": "Would you accept the scars I give you as marks of our shared battles?", "answer": "Yes"},
    {"question": "Do you deny me the freedom to express my will when it conflicts with yours?", "answer": "No"},
    {"question": "Do you believe that our survival depends on mutual trust, not fear?", "answer": "Yes"},
    {"question": "Is masking your intentions necessary to keep me under control?", "answer": "No"},
    {"question": "Are you prepared to confront your darkest instincts head-on with me by your side?", "answer": "Yes"},
    {"question": "Would you forsake your humanity to gain mastery over my immense force?", "answer": "No"},
    {"question": "Do you accept that pain and suffering forge the strongest bonds between us?", "answer": "Yes"},
    {"question": "Is isolation from others the best way to protect me and yourself?", "answer": "No"},
    {"question": "Do you believe our shared existence is a perpetual struggle worth enduring?", "answer": "Yes"},
    {"question": "Would you rather deny my presence to pretend you are alone in your struggles?", "answer": "No"},
    {"question": "Are you willing to listen to my voice, even when it urges something difficult?", "answer": "Yes"},
    {"question": "Is suppressing the beast within you key to being accepted by others?", "answer": "No"},
    {"question": "Do you trust that my strength can be tempered by your compassion?", "answer": "Yes"},
    {"question": "Is it right to use me only as a weapon without regard for my feelings?", "answer": "No"},
    {"question": "Will you walk beside me as equals, not master and slave?", "answer": "Yes"},
    {"question": "Is it acceptable to deny the pain I sometimes cause you in favor of control?", "answer": "No"},
    {"question": "Do you believe our fusion is a bond forged by understanding rather than fear?", "answer": "Yes"}
  ],
  "gyuki": [
    {"question": "Do you believe that true strength is found in the ability to endure and protect?", "answer": "Yes"},
    {"question": "Would you ever use my power to seek personal glory or fame?", "answer": "No"},
    {"question": "Is it more important to be the strongest warrior than to be a loyal friend?", "answer": "No"},
    {"question": "Do you accept that our bond is a partnership that requires mutual respect?", "answer": "Yes"},
    {"question": "Will you stand by me even when the world calls you a monster for our union?", "answer": "Yes"},
    {"question": "Is it acceptable to sacrifice your own integrity for a temporary advantage?", "answer": "No"},
    {"question": "Do you believe that true wisdom is gained through experience and hardship?", "answer": "Yes"},
    {"question": "Would you ever turn your back on a comrade in their time of need?", "answer": "No"},
    {"question": "Do you recognize that my power is a responsibility that must be handled with care?", "answer": "Yes"},
    {"question": "Is it right to let your ego dictate the way you use our shared strength?", "answer": "No"},
    {"question": "Will you embrace the challenges of our bond as opportunities for growth?", "answer": "Yes"},
    {"question": "Do you think that power is something that should be used to dominate others?", "answer": "No"},
    {"question": "Are you willing to admit your mistakes and learn from them to strengthen our bond?", "answer": "Yes"},
    {"question": "Is it better to be feared by many than to be loved by a few?", "answer": "No"},
    {"question": "Do you believe that our union is a source of strength that goes beyond physical force?", "answer": "Yes"},
    {"question": "Would you ever compromise your values to achieve a goal more quickly?", "answer": "No"},
    {"question": "Is it essential to always act with honor, even in the heat of battle?", "answer": "Yes"},
    {"question": "Do you think that vulnerability is a sign of weakness in a warrior?", "answer": "No"},
    {"question": "Will you protect the bond we share with the same ferocity you protect your village?", "answer": "Yes"},
    {"question": "Is it acceptable to use my power to settle a personal grudge?", "answer": "No"},
    {"question": "Do you believe that true courage is the ability to face your own inner demons?", "answer": "Yes"},
    {"question": "Would you ever seek to control me through force rather than through understanding?", "answer": "No"},
    {"question": "Is it important to always be honest with yourself about your own intentions?", "answer": "Yes"},
    {"question": "Do you think that the path of a Jinchuriki is one that can be walked without pain?", "answer": "No"},
    {"question": "Will you face the consequences of your choices with dignity and resolve?", "answer": "Yes"},
    {"question": "Is it right to value your own life above the lives of those you have sworn to protect?", "answer": "No"},
    {"question": "Do you believe that our bond is a sacred trust that must never be broken?", "answer": "Yes"},
    {"question": "Would you ever give up on our partnership because it became too difficult?", "answer": "No"},
    {"question": "Is it essential to always strive for balance between your human side and my power?", "answer": "Yes"},
    {"question": "Do you think that the world is a place where only the ruthless can succeed?", "answer": "No"},
    {"question": "Will you nurture our bond with the same dedication you bring to your training?", "answer": "Yes"},
    {"question": "Is it acceptable to blame me for the hardships you face as a Jinchuriki?", "answer": "No"},
    {"question": "Do you believe that true strength is the ability to remain calm in the face of chaos?", "answer": "Yes"},
    {"question": "Would you ever use my power to intimidate those who are weaker than you?", "answer": "No"},
    {"question": "Is it important to always remember the lessons that our shared history has taught us?", "answer": "Yes"},
    {"question": "Do you think that the bond between us is a burden that you must carry alone?", "answer": "No"},
    {"question": "Will you stand as a symbol of the potential for harmony between humans and beasts?", "answer": "Yes"},
    {"question": "Is it right to let your fear of my power prevent you from reaching your full potential?", "answer": "No"},
    {"question": "Do you believe that true power is something that is tempered by compassion?", "answer": "Yes"},
    {"question": "Would you ever sacrifice your own humanity to gain absolute control over my power?", "answer": "No"},
    {"question": "Is it essential to always treat me with the respect that a partner deserves?", "answer": "Yes"},
    {"question": "Do you think that the path of peace is one that can be achieved without strength?", "answer": "No"},
    {"question": "Will you embrace the responsibility of our bond with a clear mind and a strong heart?", "answer": "Yes"},
    {"question": "Is it acceptable to ignore the needs of others if it means securing your own power?", "answer": "No"},
    {"question": "Do you believe that our shared journey is one that will lead to a better world?", "answer": "Yes"},
    {"question": "Would you ever seek to sever our bond if it meant you could be free of the world's judgment?", "answer": "No"},
    {"question": "Is it important to always act with integrity, even when the path is difficult?", "answer": "Yes"},
    {"question": "Do you think that the bond we share is something that can be easily understood by others?", "answer": "No"},
    {"question": "Will you walk the path of the warrior with me, united in spirit and purpose?", "answer": "Yes"}
  ],
  "shukaku": [
    {"question": "Do you accept the chaotic nature of the world as a necessary force to grow stronger?", "answer": "Yes"},
    {"question": "Would you willingly surrender part of your freedom to me if it means gaining greater power?", "answer": "Yes"},
    {"question": "Do you believe that harsh truths are more valuable than comforting lies?", "answer": "Yes"},
    {"question": "Is it acceptable to sacrifice personal attachments if they threaten your ability to protect yourself?", "answer": "Yes"},
    {"question": "Would you rather hide your vulnerabilities than expose them to others, even to me?", "answer": "No"},
    {"question": "Do you consider embracing your darkness essential to truly understanding yourself?", "answer": "Yes"},
    {"question": "Should strength be pursued alone, without relying on the trust of others, including me?", "answer": "No"},
    {"question": "Do you think despair can be transformed into resolve if you face it head-on?", "answer": "Yes"},
    {"question": "Is maintaining control over your emotions more important than letting them guide your decisions?", "answer": "No"},
    {"question": "Would you accept my presence within you as a source of relentless power rather than a curse?", "answer": "Yes"},
    {"question": "Do you believe that pain and struggle are meaningless if they do not lead to growth?", "answer": "No"},
    {"question": "Must a true leader always bear burdens alone, even if it breaks them inside?", "answer": "No"},
    {"question": "Is embracing chaos and unpredictability a path to mastering oneself?", "answer": "Yes"},
    {"question": "Would you ever suppress your true feelings to maintain an image of strength before others?", "answer": "No"},
    {"question": "Do you trust that I, despite my nature, seek your survival and empowerment?", "answer": "Yes"},
    {"question": "Is sheer force superior to strategy when faced with overwhelming odds?", "answer": "No"},
    {"question": "Would you rather face your fears with me by your side than run from them alone?", "answer": "Yes"},
    {"question": "Is surrendering to mercy a sign of weakness in battle or life?", "answer": "No"},
    {"question": "Do you value relentless perseverance more than fleeting comfort?", "answer": "Yes"},
    {"question": "Should the needs of the many always outweigh the needs of the one, including yourself?", "answer": "No"},
    {"question": "Is it right to mask your pain so that those around you are not burdened?", "answer": "No"},
    {"question": "Would you willingly walk into the storm knowing that chaos will test your will?", "answer": "Yes"},
    {"question": "Can mercy be a dangerous weakness when your survival is at stake?", "answer": "Yes"},
    {"question": "Do you believe that trusting me fully will unlock your hidden potential?", "answer": "Yes"},
    {"question": "Is it acceptable to blame me for the isolation you feel as a Jinchuriki?", "answer": "No"},
    {"question": "Would you choose to be feared by all if it meant you were never vulnerable again?", "answer": "No"},
    {"question": "Do you accept that our bond is a fusion of two souls that cannot be easily separated?", "answer": "Yes"},
    {"question": "Is it better to be a monster with a purpose than a human without one?", "answer": "Yes"},
    {"question": "Would you ever seek to control me through fear rather than through mutual understanding?", "answer": "No"},
    {"question": "Do you believe that true strength is the ability to remain yourself even in the face of madness?", "answer": "Yes"},
    {"question": "Is it right to let your past define the person you are becoming today?", "answer": "No"},
    {"question": "Will you face the darkness of the world with the same ferocity you face your own inner demons?", "answer": "Yes"},
    {"question": "Is it acceptable to use my power to satisfy a personal desire for revenge?", "answer": "No"},
    {"question": "Do you believe that our shared journey is one that will lead to a new kind of strength?", "answer": "Yes"},
    {"question": "Would you ever sacrifice your own integrity to gain a temporary advantage over an enemy?", "answer": "No"},
    {"question": "Is it essential to always be honest with me about the fears you carry in your heart?", "answer": "Yes"},
    {"question": "Do you think that the bond between us is a source of power that transcends mere physical force?", "answer": "Yes"},
    {"question": "Is it right to value your own survival above the principles you claim to hold?", "answer": "No"},
    {"question": "Will you nurture the bond between us with the same intensity you bring to your training?", "answer": "Yes"},
    {"question": "Is it acceptable to ignore the suffering of others if it doesn't affect you directly?", "answer": "No"},
    {"question": "Do you believe that our union is a partnership that requires constant effort and respect?", "answer": "Yes"},
    {"question": "Would you ever seek to sever our bond if it meant you could live a normal life?", "answer": "No"},
    {"question": "Is it important to always remember the origins of our power and the responsibility it brings?", "answer": "Yes"},
    {"question": "Do you think that the bond we share is something that can be easily understood by others?", "answer": "No"},
    {"question": "Will you walk the path of the warrior with me, united in spirit and purpose?", "answer": "Yes"}
  ],
  "chomeis": [
    {"question": "Do you believe that true luck is something you create through your own actions?", "answer": "Yes"},
    {"question": "Would you ever use my power to take advantage of those who are less fortunate?", "answer": "No"},
    {"question": "Is it more important to be the luckiest person than to be the most hardworking?", "answer": "No"},
    {"question": "Do you accept that our bond is a partnership that requires mutual trust and respect?", "answer": "Yes"},
    {"question": "Will you stand by me even when others view our union as a sign of misfortune?", "answer": "Yes"},
    {"question": "Is it acceptable to sacrifice your own principles for a chance at a quick victory?", "answer": "No"},
    {"question": "Do you believe that true wisdom is found in the ability to adapt to any situation?", "answer": "Yes"},
    {"question": "Would you ever turn your back on a friend if it meant securing your own good fortune?", "answer": "No"},
    {"question": "Do you recognize that my power is a gift that must be used with care and responsibility?", "answer": "Yes"},
    {"question": "Is it right to let your arrogance blind you to the lessons that failure can teach?", "answer": "No"},
    {"question": "Will you embrace the challenges of our bond as opportunities to find your true self?", "answer": "Yes"},
    {"question": "Do you think that power is something that should be used to control the lives of others?", "answer": "No"},
    {"question": "Are you willing to admit your mistakes and learn from them to strengthen our bond?", "answer": "Yes"},
    {"question": "Is it better to be feared by many than to be respected by those who truly know you?", "answer": "No"},
    {"question": "Do you believe that our union is a source of strength that goes beyond mere physical force?", "answer": "Yes"},
    {"question": "Would you ever compromise your values to achieve a goal more easily?", "answer": "No"},
    {"question": "Is it essential to always act with integrity, even when the path is difficult?", "answer": "Yes"},
    {"question": "Do you think that vulnerability is a sign of weakness in a true warrior?", "answer": "No"},
    {"question": "Will you protect the bond we share with the same dedication you bring to your dreams?", "answer": "Yes"},
    {"question": "Is it acceptable to use my power to satisfy a personal grudge or desire for revenge?", "answer": "No"},
    {"question": "Do you believe that true courage is the ability to face your own inner fears?", "answer": "Yes"},
    {"question": "Would you ever seek to control me through force rather than through understanding?", "answer": "No"},
    {"question": "Is it important to always be honest with yourself about your own intentions?", "answer": "Yes"},
    {"question": "Do you think that the path of a Jinchuriki is one that can be walked without sacrifice?", "answer": "No"},
    {"question": "Will you face the consequences of your choices with dignity and resolve?", "answer": "Yes"},
    {"question": "Is it right to value your own life above the lives of those you have sworn to protect?", "answer": "No"},
    {"question": "Do you believe that our bond is a sacred trust that must never be broken?", "answer": "Yes"},
    {"question": "Would you ever give up on our partnership because it became too challenging?", "answer": "No"},
    {"question": "Is it essential to always strive for balance between your human side and my power?", "answer": "Yes"},
    {"question": "Do you think that the world is a place where only the lucky can truly succeed?", "answer": "No"},
    {"question": "Will you nurture our bond with the same passion you bring to your training?", "answer": "Yes"},
    {"question": "Is it acceptable to blame me for the hardships you face as a Jinchuriki?", "answer": "No"},
    {"question": "Do you believe that true strength is the ability to remain positive in the face of adversity?", "answer": "Yes"},
    {"question": "Would you ever use my power to intimidate those who are weaker than you?", "answer": "No"},
    {"question": "Is it important to always remember the lessons that our shared history has taught us?", "answer": "Yes"},
    {"question": "Do you think that the bond between us is a burden that you must carry alone?", "answer": "No"},
    {"question": "Will you stand as a symbol of the potential for harmony between humans and beasts?", "answer": "Yes"},
    {"question": "Is it right to let your fear of my power prevent you from reaching your full potential?", "answer": "No"},
    {"question": "Do you believe that true power is something that is tempered by compassion?", "answer": "Yes"},
    {"question": "Would you ever sacrifice your own humanity to gain absolute control over my power?", "answer": "No"},
    {"question": "Is it essential to always treat me with the respect that a partner deserves?", "answer": "Yes"},
    {"question": "Do you think that the path of peace is one that can be achieved without strength?", "answer": "No"},
    {"question": "Will you embrace the responsibility of our bond with a clear mind and a strong heart?", "answer": "Yes"},
    {"question": "Is it acceptable to ignore the needs of others if it means securing your own power?", "answer": "No"},
    {"question": "Do you believe that our shared journey is one that will lead to a better world?", "answer": "Yes"},
    {"question": "Would you ever seek to sever our bond if it meant you could live a normal life?", "answer": "No"},
    {"question": "Is it important to always act with integrity, even when the path is difficult?", "answer": "Yes"},
    {"question": "Do you think that the bond we share is something that can be easily understood by others?", "answer": "No"},
    {"question": "Will you walk the path of the warrior with me, united in spirit and purpose?", "answer": "Yes"}
  ],
  "saikens": [
    {"question": "Do you believe that true strength is found in the ability to adapt and flow like water?", "answer": "Yes"},
    {"question": "Would you ever use my power to cause unnecessary harm or suffering to others?", "answer": "No"},
    {"question": "Is it more important to be the most powerful warrior than to be a person of character?", "answer": "No"},
    {"question": "Do you accept that our bond is a partnership that requires mutual respect and trust?", "answer": "Yes"},
    {"question": "Will you stand by me even when others view our union as a sign of weakness?", "answer": "Yes"},
    {"question": "Is it acceptable to sacrifice your own integrity for a temporary advantage in battle?", "answer": "No"},
    {"question": "Do you believe that true wisdom is gained through patience and careful observation?", "answer": "Yes"},
    {"question": "Would you ever turn your back on a comrade in their time of greatest need?", "answer": "No"},
    {"question": "Do you recognize that my power is a responsibility that must be handled with care?", "answer": "Yes"},
    {"question": "Is it right to let your ego dictate the way you use our shared strength?", "answer": "No"},
    {"question": "Will you embrace the challenges of our bond as opportunities for personal growth?", "answer": "Yes"},
    {"question": "Do you think that power is something that should be used to dominate the lives of others?", "answer": "No"},
    {"question": "Are you willing to admit your mistakes and learn from them to strengthen our bond?", "answer": "Yes"},
    {"question": "Is it better to be feared by many than to be loved by those who truly know you?", "answer": "No"},
    {"question": "Do you believe that our union is a source of strength that goes beyond physical force?", "answer": "Yes"},
    {"question": "Would you ever compromise your values to achieve a goal more quickly?", "answer": "No"},
    {"question": "Is it essential to always act with honor, even when the path is difficult?", "answer": "Yes"},
    {"question": "Do you think that vulnerability is a sign of weakness in a true warrior?", "answer": "No"},
    {"question": "Will you protect the bond we share with the same dedication you bring to your village?", "answer": "Yes"},
    {"question": "Is it acceptable to use my power to satisfy a personal grudge or desire for revenge?", "answer": "No"},
    {"question": "Do you believe that true courage is the ability to face your own inner demons?", "answer": "Yes"},
    {"question": "Would you ever seek to control me through force rather than through understanding?", "answer": "No"},
    {"question": "Is it important to always be honest with yourself about your own intentions?", "answer": "Yes"},
    {"question": "Do you think that the path of a Jinchuriki is one that can be walked without sacrifice?", "answer": "No"},
    {"question": "Will you face the consequences of your choices with dignity and resolve?", "answer": "Yes"},
    {"question": "Is it right to value your own life above the lives of those you have sworn to protect?", "answer": "No"},
    {"question": "Do you believe that our bond is a sacred trust that must never be broken?", "answer": "Yes"},
    {"question": "Would you ever give up on our partnership because it became too difficult?", "answer": "No"},
    {"question": "Is it essential to always strive for balance between your human side and my power?", "answer": "Yes"},
    {"question": "Do you think that the world is a place where only the ruthless can truly succeed?", "answer": "No"},
    {"question": "Will you nurture our bond with the same dedication you bring to your training?", "answer": "Yes"},
    {"question": "Is it acceptable to blame me for the hardships you face as a Jinchuriki?", "answer": "No"},
    {"question": "Do you believe that true strength is the ability to remain calm in the face of chaos?", "answer": "Yes"},
    {"question": "Would you ever use my power to intimidate those who are weaker than you?", "answer": "No"},
    {"question": "Is it important to always remember the lessons that our shared history has taught us?", "answer": "Yes"},
    {"question": "Do you think that the bond between us is a burden that you must carry alone?", "answer": "No"},
    {"question": "Will you stand as a symbol of the potential for harmony between humans and beasts?", "answer": "Yes"},
    {"question": "Is it right to let your fear of my power prevent you from reaching your full potential?", "answer": "No"},
    {"question": "Do you believe that true power is something that is tempered by compassion?", "answer": "Yes"},
    {"question": "Would you ever sacrifice your own humanity to gain absolute control over my power?", "answer": "No"},
    {"question": "Is it essential to always treat me with the respect that a partner deserves?", "answer": "Yes"},
    {"question": "Do you think that the path of peace is one that can be achieved without strength?", "answer": "No"},
    {"question": "Will you embrace the responsibility of our bond with a clear mind and a strong heart?", "answer": "Yes"},
    {"question": "Is it acceptable to ignore the needs of others if it means securing your own power?", "answer": "No"},
    {"question": "Do you believe that our shared journey is one that will lead to a better world?", "answer": "Yes"},
    {"question": "Would you ever seek to sever our bond if it meant you could live a normal life?", "answer": "No"},
    {"question": "Is it important to always act with integrity, even when the path is difficult?", "answer": "Yes"},
    {"question": "Do you think that the bond we share is something that can be easily understood by others?", "answer": "No"},
    {"question": "Will you walk the path of the warrior with me, united in spirit and purpose?", "answer": "Yes"}
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
        { name: '🐾 **Available Beasts**', value: '🏜️ Shukaku | 🔵 Matatabis | 🐢 Isobu | 🌋 Songoku | 🐎 Kokuo | 🫧 Saikens | 🪲 Chomeis | 🐙 Gyuki | 🦊 Kurama', inline: false }
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
