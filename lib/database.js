import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database", "db.json");
export default class Database {
  constructor() {
    this.path = DB_PATH;
    this._data = null;
  }
  get defaultData() {
    return {
      users: {},
      groups: {},
      chats: {}, 
      settings: {
        totalhit: 0,
        owner: [],
        premium: [],
        partner: [],
        banned: [],
        namaSaveContact: "Buyer",
        jedaPushkontak: 4000,
        bljpm: [],
        antiCall: false,
      },
    };
  }
  async read() {
    try {
      if (!fs.existsSync(path.dirname(this.path))) {
        fs.mkdirSync(path.dirname(this.path), { recursive: true });
      }
      if (!fs.existsSync(this.path)) {
        await this.write(this.defaultData);
        return this.defaultData;
      }
      const raw = fs.readFileSync(this.path, "utf-8");
      return JSON.parse(raw);
    } catch {
      return this.defaultData;
    }
  }

  async write(data) {
    try {
      if (!fs.existsSync(path.dirname(this.path))) {
        fs.mkdirSync(path.dirname(this.path), { recursive: true });
      }
      fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("DB write error:", e);
    }
  }
}
