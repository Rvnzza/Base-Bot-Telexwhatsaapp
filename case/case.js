const fs = require("fs");
const path = require("path");

async function caseHandler(command, m, { conn, args, text, q, mime, cmd, prefix, isOwner }) {
  switch (command) {
 case "bot":
      m.reply(`Halo kontol`);
      break;
     
  }
  return false;
}

fs.watchFile(__filename, async () => {
  fs.unwatchFile(__filename);
  console.log("\x1b[0;32m" + __filename + " \x1b[1;32mupdated!\x1b[0m");
});

module.exports = caseHandler;
