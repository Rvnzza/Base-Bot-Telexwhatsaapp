import util from "util";
import { exec } from "child_process";
import fs from 'fs'; 
let handler = async (m) => m;

handler.before = async function (m, { conn, isAccess }) {
  let body = m.body || "";
   
  if (body.toLowerCase().startsWith("x ")) {
    if (!isAccess) return m.reply("*Owner Only!*");
    try {
      let code = body.slice(2);
      let r = await eval(code);
      await conn.sendMessage(
        m.chat,
        { text: util.format(typeof r === "string" ? r : util.inspect(r)) },
        { quoted: m }
      );
    } catch (e) {
      await conn.sendMessage(
        m.chat,
        { text: util.format(e) },
        { quoted: m }
      );
    }
    return true;
  }
  if (body.startsWith("$ ")) {
    if (!isAccess) return m.reply("*Owner Only!*");
    exec(body.slice(2), async (e, out) => {
      await conn.sendMessage(
        m.chat,
        { text: util.format(e ? e : out) },
        { quoted: m }
      );
    });
    return true;
  }

  return false;
};

export default handler;
