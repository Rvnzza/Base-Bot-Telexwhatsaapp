async function handler(m, { conn, command }) {
    if (command === 'self') {
        conn.public = false;
        m.reply("✅ *done mengubah ke mode SELF!*");
    } else if (command === 'public') {
        conn.public = true;
        m.reply("✅ *done mengubah ke mode PUBLIC!*");
    }
}
handler.command = ['self', 'public'];
handler.owner = true; 
handler.help = ["public", "self"];
handler.tags = ["tools"];

export default handler;
