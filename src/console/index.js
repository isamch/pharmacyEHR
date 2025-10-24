#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, "templates");

const args = process.argv.slice(2);
const command = args[0];
const name = args[1];

const generateFile = (type, name, subfolder = "") => {
  const templatePath = path.join(templatesDir, type + ".js");
  if (!fs.existsSync(templatePath)) {
    console.log("❌ Template for " + type + " not found.");
    process.exit(1);
  }
  let content = fs.readFileSync(templatePath, "utf-8");
  content = content.replace(/__NAME__/g, name);
  const destDir = path.join(process.cwd(), "src", subfolder);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  let fileName;
  switch (type) {
    case "controller": fileName = name[0].toUpperCase() + name.slice(1) + "Controller.js"; break;
    case "model": fileName = name[0].toUpperCase() + name.slice(1) + ".js"; break;
    case "route": fileName = name[0].toUpperCase() + name.slice(1) + "Routes.js"; break;
    case "middleware": fileName = name[0].toUpperCase() + name.slice(1) + ".js"; break;
    case "factory": fileName = name[0].toUpperCase() + name.slice(1) + "Factory.js"; break;
    default: fileName = name + ".js";
  }
  const destPath = path.join(destDir, fileName);
  fs.writeFileSync(destPath, content);
  console.log("✅ " + type + " created: " + destPath);
};

switch (command) {
  case "make:controller": {
    if (!name) { console.log("❌ Usage: icmern make:controller <Name>"); process.exit(1); }
    generateFile("controller", name, "controllers");
    break;
  }
  case "make:model": {
    if (!name) { console.log("❌ Usage: icmern make:model <Name>"); process.exit(1); }
    generateFile("model", name, "models");
    break;
  }
  case "make:route": {
    if (!name) { console.log("❌ Usage: icmern make:route <Name>"); process.exit(1); }
    generateFile("route", name, "routes/api");
    break;
  }
  case "make:middleware": {
    if (!name) { console.log("❌ Usage: icmern make:middleware <Name>"); process.exit(1); }
    generateFile("middleware", name, "middleware");
    break;
  }
  case "make:factory": {
    if (!name) { console.log("❌ Usage: icmern make:factory <Name>"); process.exit(1); }
    generateFile("factory", name, "factories");
    break;
  }
  default:
    console.log("❌ Unknown command");
}
