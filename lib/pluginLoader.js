import fs from "fs";
import path from "path";
import chalk from "chalk";
import vm from "vm";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginFolder = path.join(__dirname, "../plugins");

function getAllPlugins(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);

  for (let file of list) {
    const fullPath = path.join(dir, file);

    if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
      results = results.concat(getAllPlugins(fullPath));
    } else if (file.endsWith(".js") || file.endsWith(".mjs")) {
      results.push(fullPath);
    }
  }

  return results;
}

async function compilePlugin(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const filename = path.basename(filePath);
  const fileDir = path.dirname(filePath);

  if (fileContent.includes("import ") || fileContent.includes("export default")) {
    const fileUrl = pathToFileURL(filePath).href;
    const module = await import(`${fileUrl}?update=${Date.now()}`);
    return module.default || module;
  } else {
    const customRequire = createRequire(filePath);
    const scriptContext = {
      module: { exports: {} },
      exports: {},
      require: customRequire,
      __filename: filePath,
      __dirname: fileDir,
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
    vm.runInContext(fileContent, scriptContext, { filename });

    return scriptContext.module.exports;
  }
}

export async function loadPlugins() {
  let plugins = {};
  const files = getAllPlugins(pluginFolder);

  for (let filePath of files) {
    try {
      if (!fs.existsSync(filePath)) continue;

      const pluginName = path.relative(pluginFolder, filePath);
      const compiled = await compilePlugin(filePath);
      
      plugins[pluginName] = compiled;
    } catch (e) {
      console.log(chalk.redBright("Plugin Error:"), path.relative(pluginFolder, filePath));
      console.error(e);
    }
  }
  console.log(chalk.greenBright(`Berhasil memuat ${Object.keys(plugins).length} plugins`));

  return plugins;
}


let debounce = {};

export function watchPlugins(dir) {
  if (!fs.existsSync(dir)) return;

  fs.watch(dir, (eventType, filename) => {
    if (!filename) return;
    if (!filename.endsWith(".js") && !filename.endsWith(".mjs")) return;

    const fullPath = path.join(dir, filename);
    const pluginName = path.relative(pluginFolder, fullPath);

    if (debounce[fullPath]) clearTimeout(debounce[fullPath]);

    debounce[fullPath] = setTimeout(async () => {
      if (!fs.existsSync(fullPath)) {
        console.log(chalk.redBright(`Plugin Deleted: ${pluginName}`));
        delete global.plugins[pluginName];
        return;
      }

      console.log(chalk.yellowBright(`Plugin Updated: ${pluginName}`));

      try {
        const compiled = await compilePlugin(fullPath);
        global.plugins[pluginName] = compiled;

        console.log(chalk.greenBright(`Plugin Reloaded: ${pluginName}`));
      } catch (err) {
        console.log(chalk.redBright(`Error Reload Plugin: ${pluginName}`));
        console.error(err);
      }
    }, 200);
  });

  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);

    if (fs.existsSync(full) && fs.lstatSync(full).isDirectory()) {
      watchPlugins(full);
    }
  });
}
