import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
global.teleToken    = "TokenBotLu";  
global.teleOwner    = "idTeleLu"; 
global.botname       = "RevinzaBotz"
global.versibot      = "1.0.0"
global.ownername     = "Revinza" 
global.owner = "6283167006954";
global.botNumber = "";
global.thumbnail    = "https://files.catbox.moe/26gjci.jpg"
global.prefix       = "." 
global.mode         = "public" 
global.packname     = "RevinzaBotz"
global.author       = "RevinzA" 
global.dana         = "083167006954"
global.ovo          = "08xxxxxxxxxx"
global.gopay        = "08xxxxxxxxxx"
global.qris         = "" 
global.domain       = "https://" 
global.apikey       = "plta_" 
global.capikey      = "pltc" 
global.egg          = "15"
global.nestid       = "5"
global.loc          = "1" 
global.autoTyping    = false
global.dbPath = "./data"

fs.watchFile(__filename, async () => {
  fs.unwatchFile(__filename);
  console.log("\x1b[0;32m" + __filename + " \x1b[1;32mupdated!\x1b[0m");
  await import(`${import.meta.url}?update=${Date.now()}`);
});

