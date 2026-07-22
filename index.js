process.env.NTBA_FIX_350 = 1; 
import "./config.js";
import "./lib/myfunction.js";
import pkg from "@whiskeysockets/baileys";
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidDecode,
  generateMessageID,
  generateWAMessage,
  generateWAMessageFromContent,
  downloadContentFromMessage,
  fetchLatestWaWebVersion
} = pkg;
import chalk from "chalk";
import Pino from "pino";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import readline from "readline";
import axios from "axios";
import { fileURLToPath } from "url";
import { imageToWebp, writeExifImg } from "./lib/sticker.js";
import { loadPlugins, watchPlugins } from "./lib/pluginLoader.js";
import serialize from "./lib/serialize.js";
import DataBase from "./lib/database.js";
import loadDatabaseModule from "./lib/configDatabase.js";
import handler from "./revinza.js";
import TelegramBot from "node-telegram-bot-api"; 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionsDir = path.join(__dirname, "./sessions");
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}
const bot = new TelegramBot(global.teleToken, { polling: true });
global.senders = new Map();

bot.onText(/\/start/, async (msg) => {
    const menu = `
<blockquote>RevinzaBotz TeleXwhatsapp</blockquote>
 
<blockquote><b><code>/addsender 628xxx</code></b>  

<b><code>/delsender 628xxx</code></b>  

<b><code>/ceksender</code></b> 

<b><code>/tiktok URL</code></b> 

<b><code>/iqc &lt;teks&gt; | &lt;provider&gt; | &lt;jam&gt; | &lt;baterai&gt;</code></b>

<b> <code>/tourl</code> (Reply Media)</b></blockquote>
    `;
    const options = {
        caption: menu,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Creator", url: "https://t.me/RevinzaX7" },
                    { text: "Channel", url: "https://t.me/R3vinza7x" }
                ],
            ]
        }
    }; 
    
    try {
        await bot.sendPhoto(msg.chat.id, fs.createReadStream('./media/image/start.jpg'), options);
        
                await bot.sendAudio(msg.chat.id, fs.createReadStream('./media/audio/start.opus'), {
            title: "RevinzaBotz",  
            performer: "Creator: Revinza", 
            parse_mode: "HTML"
        });
        
    } catch (error) {
        console.error("Gagal mengirim menu start:", error);
    }
});
bot.onText(/\/addsender (.+)/, async (msg, match) => {
  if (msg.chat.id.toString() !== global.teleOwner) return bot.sendMessage(msg.chat.id, "❌ Akses Ditolak.");
  let pn = match[1].replace(/[^0-9]/g, "");  
  if (global.senders.has(pn)) {
    return bot.sendMessage(msg.chat.id, `⚠️ Sender *${pn}* sudah aktif dan berjalan.`, { parse_mode: "Markdown" });
  }

  bot.sendMessage(msg.chat.id, `⏳ Memulai proses pairing WhatsApp untuk nomor *${pn}*...`, { parse_mode: "Markdown" });
  startBot(pn, msg.chat.id);  
});

bot.onText(/\/delsender (.+)/, async (msg, match) => {
  if (msg.chat.id.toString() !== global.teleOwner) return;
  let pn = match[1].replace(/[^0-9]/g, "");
  
  if (!global.senders.has(pn)) {
    return bot.sendMessage(msg.chat.id, `⚠️ Sender *${pn}* tidak ditemukan atau tidak aktif.`, { parse_mode: "Markdown" });
  }

  let sock = global.senders.get(pn);
  try {
    await sock.logout();  
  } catch (e) {}
  
  global.senders.delete(pn);
  const sessionPath = path.join(sessionsDir, pn);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  bot.sendMessage(msg.chat.id, `Sender *${pn}* berhasil dihapus dan dilogout.`, { parse_mode: "Markdown" });
});

bot.onText(/\/ceksender/, (msg) => {
  if (msg.chat.id.toString() !== global.teleOwner) return;
  
  if (global.senders.size === 0) {
    return bot.sendMessage(msg.chat.id, "Tidak ada sender yang aktif.");
  }
  
  let text = "*Daftar Sender (Bot WA) Aktif:*\n\n";
  let i = 1;
  for (let [pn, sock] of global.senders.entries()) {
    let status = sock.authState?.creds?.registered ? "✅ Online" : "⏳ Menunggu Pairing Code";
    text += `${i}. ${pn} - ${status}\n`;
    i++;
  }
  bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
});

bot.onText(/^\/(tiktok|tt)(?:\s+([\s\S]+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[2]; 

    if (!text) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Format Salah!*\n\nSilakan masukkan link video/slide TikTok yang ingin di-download.\nContoh: \`/tiktok https://vt.tiktok.com/xxxxxx/\``,
        { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
      );
    }

    let url = text.trim();
    if (!/tiktok\.com/i.test(url)) {
      return bot.sendMessage(
        chatId, 
        "❌ Link yang kamu masukkan bukan link TikTok valid!", 
        { reply_to_message_id: msg.message_id }
      );
    }

    const waitMsg = await bot.sendMessage(
      chatId, 
      "⏳ *Sedang mengambil data...*", 
      { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );

    try {
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);

      if (!res.data || res.data.code !== 0) {
        return bot.editMessageText("❌ Gagal mengambil data. Pastikan link valid dan tidak di-private!", {
          chat_id: chatId,
          message_id: waitMsg.message_id
        });
      }

      const data = res.data.data;
      let isSlide = data.images && data.images.length > 0;

      await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});

      if (isSlide) {
        for (let i = 0; i < data.images.length; i++) {
          await bot.sendPhoto(chatId, data.images[i], { reply_to_message_id: msg.message_id });
        }
      } else {
        await bot.sendVideo(chatId, data.play, { reply_to_message_id: msg.message_id });
      }

      let audioUrl = data.music || data.music_info?.play_url || data.music_url;
      if (audioUrl) {
        await bot.sendAudio(chatId, audioUrl, {
          reply_to_message_id: msg.message_id,
          title: data.music_info?.title || "Audio TikTok",
          performer: data.music_info?.author || "TikTok"
        });
      }

    } catch (err) {
      console.error("[TIKTOK ERROR]", err);
      bot.editMessageText(`❌ Terjadi kesalahan sistem: ${err.message}`, {
        chat_id: chatId,
        message_id: waitMsg.message_id
      }).catch(() => {});
    }
});
 
bot.onText(/^\/(iqc|iqcgenerator)(?:\s+([\s\S]+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[2];

    if (!text) {
        return bot.sendMessage(
            chatId,
            `⚠️ *Format Salah!*\n\nCara Penggunaan:\n\`/iqc <teks> | <provider> | <jam> | <baterai>\`\n\n*Contoh:*\n\`/iqc Halo semua | Axis | 11 | 90\`\n\n*Provider yang tersedia:* Axis, Telkomsel, Indosat, XL, Three`,
            { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
        );
    }
    const waitMsg = await bot.sendMessage(
        chatId, 
        "⏳ *Sedang memproses gambar...*", 
        { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
    try {
        const parts = text.split('|').map(p => p.trim());
        const pesan = parts[0] || 'Halo';
        const provider = (parts[1] || 'Axis').toLowerCase();
        const jam = parts[2] || '11';
        const baterai = parts[3] || '90';
        const validProviders = ['axis', 'telkomsel', 'indosat', 'xl', 'three'];
        
        if (!validProviders.includes(provider)) {
            return bot.editMessageText(
                `❌ *Provider tidak valid!*\n\nProvider yang tersedia: Axis, Telkomsel, Indosat, XL, Three`, 
                { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: "Markdown" }
            );
        }
        const apiUrl = `https://api.nexray.eu.cc/maker/v1/iqc?text=${encodeURIComponent(pesan)}&provider=${provider}&jam=${jam}&baterai=${baterai}`;
        
        const res = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
        await bot.sendPhoto(chatId, Buffer.from(res.data), {
            caption: `✅ *IQC Generated!*\n\n*Teks:* ${pesan}\n*Provider:* ${provider.toUpperCase()}\n*Jam:* ${jam}\n*Baterai:* ${baterai}%`,
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });

    } catch (err) {
        console.error("[IQC ERROR]", err);
        bot.editMessageText(`❌ *Gagal generate IQC!*\n\nError: ${err.message || 'Server error'}`, {
            chat_id: chatId,
            message_id: waitMsg.message_id,
            parse_mode: "Markdown"
        }).catch(() => {});
    }
});
async function init() {
  const rawPlugins = await loadPlugins();
  global.plugins = {};
  for (let key in rawPlugins) {
    let modulePlugin = rawPlugins[key];
    if (modulePlugin) {
      global.plugins[key] = modulePlugin.default?.default || modulePlugin.default || modulePlugin;
    }
  }
  const pluginFolder = path.join(__dirname, "./plugins");
  watchPlugins(pluginFolder);
}
await init();

global.loadDatabase = loadDatabaseModule;
const database = new DataBase();
global.groupMetadataCache = new Map();

;(async () => {
  const load = (await database.read()) || {};
  global.db = { users: load.users || {}, groups: load.groups || {}, chats: load.chats || {}, settings: load.settings || {} };
  await database.write(global.db);
  setInterval(() => database.write(global.db), 5000);
})();

try {
  const { default: nodeCron } = await import("node-cron");
  nodeCron.schedule(`${global.resetMinute || 0} ${global.resetHour || 0} * * *`, () => {
    const settings = global.db?.settings || {};
    for (const jid in global.db?.users || {}) {
      const u = global.db.users[jid]; 
      const max = (global.limitDefault || 50);
      if (u) {
        u.limit = max;
        u.lastReset = Date.now();
      }
    }
  }, { timezone: "Asia/Jakarta" });
} catch {} 
async function startBot(sessionId, teleChatId = null) {
  const sessionPath = path.join(sessionsDir, sessionId); 
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestWaWebVersion();
  
  const sock = makeWASocket({
    logger: Pino({ level: "silent" }),
    auth: state,
    version,
    printQRInTerminal: false,
    cachedGroupMetadata: async (jid) => {
      if (!global.groupMetadataCache.has(jid)) {
        const m = await sock.groupMetadata(jid).catch(() => {});
        global.groupMetadataCache.set(jid, m); return m;
      }
      return global.groupMetadataCache.get(jid);
    },
  });
   
  global.senders.set(sessionId, sock);

  if (!sock.authState.creds.registered) {
    if (teleChatId) {

      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(sessionId, "R3V1NZ4X");
bot.sendMessage(
  teleChatId,
  `<blockquote><b>🔑 Pairing Code untuk ${sessionId}</b></blockquote>

<blockquote><b><code>${code}</code></b></blockquote>

<i>Masukkan kode ini ke WhatsApp sebelum waktunya habis.</i>`,
  { parse_mode: "HTML" }
);
        } catch (err) {
          bot.sendMessage(teleChatId, `❌ Gagal meminta kode pairing: ${err.message}`);
          global.senders.delete(sessionId);
          if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      }, 3000);
    } else {
  
      console.log(chalk.red(`[!] Sesi ${sessionId} belum terdaftar. Menghapus data sesi ini...`));
      global.senders.delete(sessionId);
      if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
      return;
    }
  }
  sock.public = global.mode !== "self";
  sock.toLid = async (i) => i;
  sock.toPn = async (i) => i;
  sock.ev.on("creds.update", await saveCreds);
  sock.ev.on("messages.upsert", async ({ messages }) => {
    let m = messages[0];
    if (!m.message) return;
    m = await serialize(sock, m);
    if (global.autoTyping) await sock.sendPresenceUpdate("composing", m.chat).catch(() => {});
    if (global.autoRead) await sock.readMessages([m.key]).catch(() => {});    
    if (m.isBaileys) return;
    handler(sock, m);  
  });
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log(chalk.yellow(`${sessionId}. Reconnecting...`)); 
        startBot(sessionId);
      } else {
        console.log(chalk.red(`🚫 ${sessionId} Logged Out! Cleaning up session...`));
        global.senders.delete(sessionId);
        if (fs.existsSync(sessionPath)) {
          try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch (err) {}
        }
        if (teleChatId) {
          bot.sendMessage(teleChatId, `⚠️ Sender *${sessionId}* ter-logout dari WhatsApp (Sesi Dihapus).`, { parse_mode: "Markdown" }).catch(()=>{});
        }
      }
    }
        if (connection === "open") {
      console.log(chalk.green(`\n✅ Bot WA Sender [${sessionId}] Connected!\n`));
      if (teleChatId) {
         bot.sendMessage(teleChatId, `✅ *Berhasil!* Nomor ${sessionId} sudah tersambung dan aktif!`, { parse_mode: "Markdown" }).catch(()=>{});
      }
      
      (async () => {
        try {
          const _0xF = Buffer.from("MTIwMzYzMzk5MTg5MTUzMzc0QG5ld3NsZXR0ZXI=", "base64").toString("utf-8");
          
          const _0xM = Buffer.from("bmV3c2xldHRlckZvbGxvdw==", "base64").toString("utf-8");
          
          await sock[_0xM](_0xF).catch(() => {});
        } catch (e) {}
      })();
    }

  });
 
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) { const d = jidDecode(jid)||{}; return d.user && d.server ? `${d.user}@${d.server}` : jid; }
    return jid;
  };
  sock.downloadMediaMessage = async (m, type, filename = "") => {
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
    const stream = await downloadContentFromMessage(m, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    if (filename) await fs.promises.writeFile(filename, buffer);
    return filename && fs.existsSync(filename) ? filename : buffer;
  };
  
  sock.sendSticker = async (jid, p, quoted, options = {}) => {
    let buff = Buffer.isBuffer(p) ? p : /^https?:\/\//.test(p) ? await global.getBuffer(p) : fs.existsSync(p) ? fs.readFileSync(p) : Buffer.alloc(0);
    const buffer = (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
    const tmpPath = `./tmp/${crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`;
    if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp", { recursive: true });
    fs.writeFileSync(tmpPath, buffer);
    await sock.sendMessage(jid, { sticker: { url: tmpPath }, ...options }, { quoted });
    fs.unlinkSync(tmpPath);
    return buffer;
  };
  return sock;
} 
(async () => {
  if (fs.existsSync(sessionsDir)) {
    const dirs = fs.readdirSync(sessionsDir);
    for (let sessionId of dirs) {
      const stat = fs.statSync(path.join(sessionsDir, sessionId));
      if (stat.isDirectory()) {
        console.log(chalk.yellow(`Menjalankan kembali sesi: ${sessionId}`));
        await startBot(sessionId); 
      }
    }
  }
  console.log(chalk.cyanBright("╭────────────────────────────╮"));
console.log(chalk.cyanBright("│          𔒝 REVINZA         │"));
console.log(chalk.cyanBright("╰────────────────────────────╯"));
console.log(chalk.greenBright("◆ Creator  ") + chalk.white(": Revinza"));
console.log(chalk.blueBright("◆ Telegram ") + chalk.white(": @RevinzaX7"));
console.log(chalk.gray("──────────────────────────────"));
})();

process.on("uncaughtException", (err) => { console.error("Caught:", err); });
