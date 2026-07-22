import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseCases = () => {
  try {
    const casePath = path.join(__dirname, "../case.js");
    if (!fs.existsSync(casePath)) return { total: 0, commands: {}, tags: [] };

    const content = fs.readFileSync(casePath, "utf8");
    const lines = content.split("\n");
  
    let currentTag = "main";
    let totalCases = 0;
    let extractedCommands = {};
    let detectedTags = new Set();

    for (let line of lines) {
      let tagMatch = line.match(/\/\/\s*──\s*\[\s*([\w-]+)\s*\]\s*──/);
      if (tagMatch) {
        currentTag = tagMatch[1].toLowerCase().trim();
        continue;
      }

      let caseMatch = line.match(/case\s+["']([^"']+)["']\s*:/);
      if (caseMatch) {
        let cmdName = caseMatch[1];
        if (["menu", "allmenu", "help", "test", "${cleanCmd}", "${cleancmd}"].includes(cmdName)) continue;
        
        totalCases++;
        detectedTags.add(currentTag);
        if (!extractedCommands[currentTag]) extractedCommands[currentTag] = [];
        extractedCommands[currentTag].push({ help: cmdName });
      }
    }
    return { total: totalCases, commands: extractedCommands, tags: Array.from(detectedTags) };
  } catch (e) {
    console.error(e);
    return { total: 0, commands: {}, tags: [] };
  }
};

let handler = async (m, { conn, prefix, command, text }) => {
  let autoTags = new Set();
  Object.values(global.plugins).forEach(p => {
    if (p.tags) {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => t && autoTags.add(t.toLowerCase().trim()));
      } else {
        autoTags.add(p.tags.toLowerCase().trim());
      }
    }
  });

  const caseData = parseCases();
  caseData.tags.forEach(t => autoTags.add(t));
  autoTags.delete("owner");
  const sortedTags = Array.from(autoTags).sort();
  const totalPlugins = Object.values(global.plugins).reduce((a, p) => a + (p.help ? (Array.isArray(p.help) ? p.help.length : 1) : 0), 0);
  const totalFitur = totalPlugins + caseData.total;
  
  let user = global.db.users[m.sender] || {};
  let name = m.pushName || m.pushname || "User";
  let uptimeRuntime = process.uptime();
  let days = Math.floor(uptimeRuntime / 86400);
  let hours = Math.floor((uptimeRuntime % 86400) / 3600);
  let minutes = Math.floor((uptimeRuntime % 3600) / 60);
  let seconds = Math.floor(uptimeRuntime % 60);
  let ping = Date.now() - (Number(m.messageTimestamp) * 1000);
  let mode = conn.public ? "Public" : "Self";
  let isUserPremium = global.db.users[m.sender]?.isPremium || false;
  let status = m.isAccess ? "Owner" : (isUserPremium ? "Premium" : "Free User");
  let limitMax = isUserPremium ? (global.limitPremium || 500) : (global.limitDefault || 50);
  let userLimit = m.isAccess ? "Unlimited" : (user.limit ?? limitMax);

  let bodyText = `*こんにちは、${name} さん。私はWhatsAppアシスタントボットの${global.botname}防です。何かお手伝いできることはありますか？次のメニューページを表示するには、ボタンを押してください。*`;

  let footerText = `- Developer : *Revinza*\n` +
                         `- Type : *Plugins*\n` +
                         `- Mode : *${mode}*\n` +
                         `- Ping : *${Math.floor(ping)} ms*\n` +
                         `- Runtime : *${days}D ${hours}H ${minutes}M ${seconds}S*\n\n`;

  const formatCategory = (tagName, list) => {
    let spacedTitle = (tagName.toUpperCase() + " MENU").split("").join(" ");
    let res = `[ ${spacedTitle} ]\n ${tagName.charAt(0).toUpperCase() + tagName.slice(1)} Menu\n \n`;
    for (let p of list) {
      let helps = Array.isArray(p.help) ? p.help : [p.help];
      for (let h of helps) {
        if (h) res += `${prefix}${h}\n`;
      }
    }
    res += `───\n\n`;
    return res;
  };
  if (text || command === "allmenu") {
    let targetTag = text?.toLowerCase().trim();
    if (command === "allmenu" || targetTag === "all") {
      let fullTagsList = ["owner", ...sortedTags];
      for (let tagKey of fullTagsList) {
        let filteredPlugin = Object.values(global.plugins).filter(p => p.tags && (Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()).includes(tagKey) : p.tags.toLowerCase() === tagKey));
        let filteredCase = caseData.commands[tagKey] || [];
        let combined = [...filteredPlugin, ...filteredCase];
        if (combined.length > 0) footerText += formatCategory(tagKey, combined);
      }
    } else if (targetTag === "owner" || sortedTags.includes(targetTag)) {
      let filteredPlugin = Object.values(global.plugins).filter(p => p.tags && (Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()).includes(targetTag) : p.tags.toLowerCase() === targetTag));
      let filteredCase = caseData.commands[targetTag] || [];
      let combined = [...filteredPlugin, ...filteredCase];
      footerText += combined.length > 0 ? formatCategory(targetTag, combined) : `*fitur ${targetTag} kosong.*`;
    }
  }
  let sections = [
    {
      title: "",
      highlight_label: "Revinza",
      rows: [
        { header: "", title: "All Features", id: `${prefix}allmenu`, highlight_label: "Revinza" },
      ]
    },
    { title: "Other Features", rows: [] }
  ];

  for (let tag of sortedTags) {
    sections[1].rows.push({
      header: "",
      title: `MENU ${tag.toUpperCase()}`,
      highlight_label: "Revinza",
      id: `${prefix}menu ${tag}`
    });
  }
  const thumbnailPath = path.join(__dirname, "../media/image/thumbnail.jpg");
  const audioPath = path.join(__dirname, "../media/audio/start.opus"); 
  try {
    await conn.sendMessage(m.chat, {
    buttonsMessage: {
      locationMessage: {
        degreesLatitude: 0,
        degreesLongitude: 0,
        jpegThumbnail: ("./media/image/thumbnail.jpg")
      },
      contentText: bodyText.trim(),
      footerText: footerText.trim(),
      buttons: [
        {
          buttonId: "CLICK TO MENU",
          buttonText: { displayText: "CLICK TO MENU" },
          type: 1,
          nativeFlowInfo: {
            name: "single_select",
            paramsJson: JSON.stringify({ title: "CLICK TO MENU", sections: sections })
          }
        }
      ],
      headerType: 6
    }
  }, { quoted: m.qkontak || m });
    if (fs.existsSync(audioPath)) {
      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(audioPath), 
          mimetype: 'audio/mpeg',  
          ptt: true,
          contextInfo: {
            isForwarded: true,
            mentionedJid: [m.sender],
            forwardedNewsletterMessageInfo: {
              newsletterName: global.botname,
              newsletterJid: '120363399189153374@newsletter',
            }
          }
        },
        { quoted: m }
      );
    } else {
       console.log("File audio tidak ditemukan di: " + audioPath);
    }

  } catch (err) {
    console.error(err);
  }
  let delay = time => new Promise(res => setTimeout(res, time));
  await delay(1000);
};

handler.help = ["menu", "allmenu"];
handler.command = ["menu", "allmenu", "help"];

export default handler;
