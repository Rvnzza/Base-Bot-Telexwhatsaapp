let handler = async (m, { conn }) => {
    let status = conn.public ? "🟢 Public" : "🔴 Self";
    let caption = `
  *Bot Name :* ${global.botname}
  *Mode :* ${status}
  `;
    await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
};

handler.command = ["status", "cekmode", "mode"];
handler.owner = true; 
handler.help = ["mode"];
handler.tags = ["tools"];

export default handler;
