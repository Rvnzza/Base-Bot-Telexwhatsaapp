 import fs from "fs";
import util from "util";
import chalk from "chalk";
import vm from "vm";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

function decodeJid(jid) {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    let decode = jid.match(/^(\d+):(\d+)@/gi);
    if (decode) {
      let parts = decode[0].split(":");
      return `${parts[0]}@s.whatsapp.net`;
    }
  }
  return jid.split("@")[0] + "@s.whatsapp.net";
}
export default async function handler(conn, m) {
  try {
    if (m.sender) m.sender = decodeJid(m.sender);
    if (m.key?.participant) m.key.participant = decodeJid(m.key.participant);

    let plugins = global.plugins;
    await global.loadDatabase(conn, m);
    const prefix = m.prefix || global.prefix || ".";
    const isCmd = m?.body?.startsWith(prefix);
    const args = isCmd ? m.body.trim().split(/ +/).slice(1) : [];
    const text = args.join(" ");
    const q = text;
    const command = isCmd
      ? m.body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
      : "";
    const cmd = prefix + command;
    const quoted = m.quoted ? m.quoted : m;
    const mime = quoted?.msg?.mimetype || quoted?.mimetype || null;
    const qmsg = m.quoted || m;
    const botNumber = conn.decodeJid(conn.user.id)
    
    let premuser = [];
    try {
      if (fs.existsSync("./data/premium.json")) {
        const data = JSON.parse(fs.readFileSync("./data/premium.json"));
        premuser = data.premium || [];
      }
    } catch (e) {
    }

    const isAccess = [
      botNumber,
      global.owner + "@s.whatsapp.net",
      ...premuser.map(u => u.id.replace(/\D/g, "") + "@s.whatsapp.net")
    ].includes(m.sender);
    m.cmd = cmd;
    m.mime = mime;
    m.qmsg = qmsg;
    m.args = args;
    m.text = text;
    m.isGroup = m.chat.endsWith("g.us");
    m.metadata = {};
    m.isAdmin = false;
    m.isBotAdmin = false;
    m.example = (teks, cmds = cmd) => m.reply(`*Contoh Penggunaan:*\n${cmds} ${teks}`);

    m.react = async (emoji) => {
      await conn.sendMessage(m.chat, {
        react: { text: emoji, key: m.key },
      }).catch(() => {});
    };

    const settings = global.db?.settings || {};
    const userData = global.db?.users?.[m.sender] || {};
    const senderClean = (m.sender || "").split("@")[0].split(":")[0];

    let dbIsPrem = (settings.premium || []).some((p) => {
      const c = typeof p === "string" ? p : p.id;
      return (c || "").split("@")[0] === senderClean;
    }); 

    m.isPremium = isAccess || dbIsPrem || userData.isPremium === true;

    if (!conn.public && !isAccess) return;
    if (!m.isPremium && !isAccess) {
      if (global.onlygc && !m.isGroup) return; 
      if (global.onlypc && m.isGroup) return;
    }
    if (m.isGroup) {
      let meta = global.groupMetadataCache?.get(m.chat);
      if (!meta || !meta.participants) {
        meta = await conn.groupMetadata(m.chat).catch(() => null);
      }
      m.metadata = meta || {};
      const p = m.metadata.participants || [];
      const botClean = (botNumber || "").split("@")[0].split(":")[0];
      const groupAdmins = p
        .filter(participant => participant.admin === "admin" || participant.admin === "superadmin")
        .map(participant => (participant.id || participant.jid || "").split("@")[0].split(":")[0]);

      m.isAdmin = isAccess || groupAdmins.includes(senderClean);
      m.isBotAdmin = groupAdmins.includes(botClean);
    }
    for (let name in plugins) {
      let plugin = plugins[name];
      if (typeof plugin?.before !== "function") continue;
      let stop = await plugin.before(m, {
        conn, isAccess,
        isAdmin: m.isAdmin,
        isBotAdmin: m.isBotAdmin,
        metadata: m.metadata,
      });
      if (stop) return;
    }
    for (let name in plugins) {
      let plugin = plugins[name];
      if (typeof plugin?.all !== "function") continue;
      await plugin.all(m, {
        conn, isAccess,
        isAdmin: m.isAdmin,
        isBotAdmin: m.isBotAdmin,
        metadata: m.metadata,
      });
    }

    if (!isCmd) return;

    const time = new Date().toLocaleTimeString("id-ID");

console.log(
`${chalk.bgHex("#7B2CBF").black(" REVINZA BOT ")} ${chalk.gray("•")} ${chalk.cyan(time)}
${chalk.green("➜")} ${chalk.bold.white(m.pushName || "Unknown")} ${chalk.gray(`(${senderClean})`)}
${chalk.yellow("➜")} ${m.isGroup ? chalk.yellow(m.metadata.subject) : chalk.cyan("Private Chat")}
${chalk.magenta("➜")} ${chalk.bold(cmd)} ${text ? chalk.gray(text) : ""}
${chalk.gray("────────────────────────────────────────────────────────────")}`
);

    if (global.autoTyping) {
      await conn.sendPresenceUpdate("composing", m.chat).catch(() => {});
    }
    if (global.autoRead) {
      await conn.readMessages([m.key]).catch(() => {});
    }
        const casePath = "./case/case.js";
    let caseHandler;
    const caseContent = fs.readFileSync(casePath, "utf8");
    if (caseContent.includes("module.exports") || caseContent.includes("exports.")) {
      const customRequire = createRequire(import.meta.url);
      const scriptContext = {
        module: { exports: {} },
        exports: {},
        require: customRequire,
        __filename: fileURLToPath(new URL(casePath, import.meta.url)),
        __dirname: fileURLToPath(new URL(".", import.meta.url)),
        process: process,
        console: console,
        Buffer: Buffer,
        global: global,
        setTimeout: setTimeout,
        setInterval: setInterval,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval,
        URL: URL
      };
      scriptContext.exports = scriptContext.module.exports;
      vm.createContext(scriptContext);
      vm.runInContext(caseContent, scriptContext, { filename: "case.js" });
      caseHandler = scriptContext.module.exports;
    } else {
      const { default: rawCaseHandler } = await import(`./case/case.js?update=${Date.now()}`);
      caseHandler = rawCaseHandler.default || rawCaseHandler;
    }


    let isCaseExecuted = await caseHandler(command, m, {
      conn, args, text, q, mime, cmd, prefix, isAccess
    }).catch(e => console.error(chalk.red("[Error Case.js]:"), e));

    if (isCaseExecuted) {
      if (global.autoTyping) {
        await conn.sendPresenceUpdate("paused", m.chat).catch(() => {});
      }
      return;
    }
    for (let name in plugins) {
      let modulePlugin = plugins[name];
      if (!modulePlugin) continue;
      
      let plugin = modulePlugin.default?.default || modulePlugin.default || modulePlugin;
      if (!plugin || !plugin.command) continue;
      
      const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
      if (!cmds.includes(command)) continue;

      if (plugin.owner && !isAccess) {
        return m.reply("*KhususOwner!*");
      }
      if (plugin.premium && !m.isPremium) {
        return m.reply("*khususPremium!*");
      }
      if (plugin.group && !m.isGroup) {
        return m.reply("*KhususGroup!");
      }
      if (plugin.private && m.isGroup) {
        return m.reply("*KhususPrivateChat!*");
      }
      if (plugin.admin && !m.isAdmin) {
        return m.reply("*KhususAdmin!*");
      }
      if (plugin.botAdmin && !m.isBotAdmin) {
        return m.reply("*Bot Belum Jdi Admin!*");
      }

      global.db.settings.totalhit = (global.db.settings.totalhit || 0) + 1;

      try {
        await plugin(m, {
          conn, args, text, q,
          quoted: m.quoted || m,
          mime, command, cmd, prefix,
          isAccess,
          isAdmin: m.isAdmin,
          isBotAdmin: m.isBotAdmin,
          metadata: m.metadata,
        });

      } catch (err) {
        console.error(chalk.red(`[Error] Plugin ${name}:`), err);
        m.reply(`Error\n*Command:* \`${cmd}\`\n*Kendala:* \`${err.message}\``);
      }
    }
    if (global.autoTyping) {
      await conn.sendPresenceUpdate("paused", m.chat).catch(() => {});
    }
  } catch (err) {
    console.log(util.format(err));
  }
}

fs.watchFile(__filename, async () => {
  fs.unwatchFile(__filename);
  console.log("\x1b[0;32m" + __filename + " \x1b[1;32mupdated!\x1b[0m");
  await import(`${import.meta.url}?update=${Date.now()}`);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = handler;
}
