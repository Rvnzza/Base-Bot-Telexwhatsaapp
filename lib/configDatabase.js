export default async function loadDatabase(sock, m) {
  if (!m || !m.chat) return;

  if (!global.db.settings) global.db.settings = {};
  if (!global.db.settings.totalhit) global.db.settings.totalhit = 0;
  if (!global.db.settings.owner) global.db.settings.owner = [];
  if (!global.db.settings.premium) global.db.settings.premium = [];
  if (!global.db.settings.partner) global.db.settings.partner = [];
  if (!global.db.settings.banned) global.db.settings.banned = [];
  if (!global.db.settings.namaSaveContact) global.db.settings.namaSaveContact = "Buyer";
  if (!global.db.settings.jedaPushkontak) global.db.settings.jedaPushkontak = 4000;
  if (!global.db.settings.bljpm) global.db.settings.bljpm = [];

  if (m.sender) {
    if (!global.db.users) global.db.users = {};
    
    const settings = global.db.settings;
    const senderClean = (m.sender || "").split("@")[0];
    
    let dbIsPrem = (settings.premium || []).some((p) => {
      const c = typeof p === "string" ? p : p.id;
      return (c || "").split("@")[0] === senderClean;
    }) || (settings.partner || []).some((p) => {
      const c = typeof p === "string" ? p : p.id;
      return (c || "").split("@")[0] === senderClean;
    }) || false;

    let maxLimit = dbIsPrem ? (global.limitPremium || 500) : (global.limitDefault || 50);

    if (!global.db.users[m.sender]) {
      global.db.users[m.sender] = {
        id: m.sender,
        name: m.pushName || "",
        registered: false,
        koin: 0,
        exp: 0,
        limit: maxLimit,
        lastReset: Date.now(),
        isPremium: dbIsPrem,

        money: 0,
        bank: 0,
        level: 1,
        stamina: 100,
        bensin: 100,
        health: 100,
        potion: 0,
        diamond: 0,
        rubi: 0,
        gold: 0,
        iron: 0,
        stone: 0,
        wood: 0,
        string: 0,
        trash: 0,
        emerald: 0,

        role: "Adventurer",
        weapon: "Bronze Sword",
        armor: "Leather Armor",
        pickaxe: "Wooden Pickaxe",
        fishingrod: "Wooden Fishingrod",

        common: 0,
        uncommon: 0,
        mythic: 0,
        legendary: 0,

        horse: 0,
        pet: 0,
        petfood: 0,

        lastadventure: 0,
        lastclaim: 0,
        lastcooldown: 0,
        lastcrime: 0,
        lastdungeon: 0,
        lastfishing: 0,
        lastheal: 0,
        lasthourly: 0,
        lasthunt: 0,
        lastjudi: 0,
        lastkill: 0,
        lastmining: 0,
        lastmonthly: 0,
        lastngojek: 0,
        lastrampok: 0,
        lastrob: 0,
        lastsupirtaksi: 0,
        lastweekly: 0,
        lastwork: 0
      };
    }

    global.db.users[m.sender].isPremium = dbIsPrem;

    if (m.pushName) global.db.users[m.sender].name = m.pushName;
    
    const user = global.db.users[m.sender];

    if (user.money === undefined) user.money = 0;
    if (user.bank === undefined) user.bank = 0;
    if (user.level === undefined) user.level = 1;
    if (user.stamina === undefined) user.stamina = 100;
    if (user.bensin === undefined) user.bensin = 100;
    if (user.health === undefined) user.health = 100;
    if (user.potion === undefined) user.potion = 0;
    if (user.diamond === undefined) user.diamond = 0;
    if (user.rubi === undefined) user.rubi = 0;
    if (user.gold === undefined) user.gold = 0;
    if (user.iron === undefined) user.iron = 0;
    if (user.stone === undefined) user.stone = 0;
    if (user.wood === undefined) user.wood = 0;
    if (user.string === undefined) user.string = 0;
    if (user.trash === undefined) user.trash = 0;
    if (user.emerald === undefined) user.emerald = 0;
    if (user.role === undefined) user.role = "Adventurer";
    if (user.weapon === undefined) user.weapon = "Bronze Sword";
    if (user.armor === undefined) user.armor = "Leather Armor";
    if (user.pickaxe === undefined) user.pickaxe = "Wooden Pickaxe";
    if (user.fishingrod === undefined) user.fishingrod = "Wooden Fishingrod";
    if (user.common === undefined) user.common = 0;
    if (user.uncommon === undefined) user.uncommon = 0;
    if (user.mythic === undefined) user.mythic = 0;
    if (user.legendary === undefined) user.legendary = 0;
    if (user.horse === undefined) user.horse = 0;
    if (user.pet === undefined) user.pet = 0;
    if (user.petfood === undefined) user.petfood = 0;

    if (user.lastadventure === undefined) user.lastadventure = 0;
    if (user.lastclaim === undefined) user.lastclaim = 0;
    if (user.lastcooldown === undefined) user.lastcooldown = 0;
    if (user.lastcrime === undefined) user.lastcrime = 0;
    if (user.lastdungeon === undefined) user.lastdungeon = 0;
    if (user.lastfishing === undefined) user.lastfishing = 0;
    if (user.lastheal === undefined) user.lastheal = 0;
    if (user.lasthourly === undefined) user.lasthourly = 0;
    if (user.lasthunt === undefined) user.lasthunt = 0;
    if (user.lastjudi === undefined) user.lastjudi = 0;
    if (user.lastkill === undefined) user.lastkill = 0;
    if (user.lastmining === undefined) user.lastmining = 0;
    if (user.lastmonthly === undefined) user.lastmonthly = 0;
    if (user.lastngojek === undefined) user.lastngojek = 0;
    if (user.lastrampok === undefined) user.lastrampok = 0;
    if (user.lastrob === undefined) user.lastrob = 0;
    if (user.lastsupirtaksi === undefined) user.lastsupirtaksi = 0;
    if (user.lastweekly === undefined) user.lastweekly = 0;
    if (user.lastwork === undefined) user.lastwork = 0;

    const now = Date.now();
    const lastReset = user.lastReset || 0;
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastReset >= oneDayMs) {
      let currentMax = user.isPremium ? (global.limitPremium || 500) : (global.limitDefault || 50);
      user.limit = currentMax;
      user.lastReset = now;
    }
  }

  if (m.isGroup && m.chat) {
    if (!global.db.groups) global.db.groups = {};
    if (!global.db.groups[m.chat]) {
      global.db.groups[m.chat] = {
        id: m.chat,
        welcome: global.welcomeDefault ?? true,
        goodbye: global.goodbyeDefault ?? true,
        antilinkgc: false,
        antilinkall: false,
        antitagsw: false,
        antitoxic: false,
        antidocument: false,
        antisticker: false,
        antimedia: false,
        antibot: false,
        autodl: false,
        hidetag: false,
        detect: false,
        sewa: false,
        sewaExpiry: 0
      };
    }
  }

  if (m.chat) {
    if (!global.db.chats) global.db.chats = {};
    if (!global.db.chats[m.chat]) {
      global.db.chats[m.chat] = {
        id: m.chat,
        afkUsers: {},
        lastChat: Date.now(),
        mute: false
      };
    } else {
      global.db.chats[m.chat].lastChat = Date.now();
    }
  }
}
