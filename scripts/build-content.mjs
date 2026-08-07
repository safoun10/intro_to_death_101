import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadConfig() {
  const configPath = join(root, "content.config.json");
  if (!existsSync(configPath)) {
    return {
      title: "INTRODUCTION TO DEATH 101",
      description: "",
      sectionOverrides: {},
      defaultThemeCycle: ["dawn", "dusk", "midnight", "void", "flicker", "stillness"],
    };
  }
  return JSON.parse(readFileSync(configPath, "utf-8"));
}

function findOverride(text, overrides) {
  const lower = text.toLowerCase();
  for (const [marker, meta] of Object.entries(overrides)) {
    if (lower.includes(marker.toLowerCase())) {
      return meta;
    }
  }
  return null;
}

function parseMarkdown(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    if (lines[i].trim().startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i++;
      }
      blocks.push({ type: "questions", items });
      continue;
    }

    const paragraphLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("- ")
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }
    if (paragraphLines.length) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    }
  }

  return blocks;
}

function groupIntoSections(blocks, config) {
  const { sectionOverrides, defaultThemeCycle } = config;
  const sections = [];
  let current = null;
  let themeIndex = 0;
  let autoIndex = 0;
  const usedIds = new Set();

  function startSection(block, override) {
    if (current && current.blocks.length) {
      sections.push(current);
    }

    autoIndex++;
    const theme =
      override?.theme ??
      defaultThemeCycle[themeIndex % defaultThemeCycle.length];
    themeIndex++;

    let id = override?.id ?? `section-${String(autoIndex).padStart(2, "0")}`;
    if (usedIds.has(id)) {
      id = `${id}-${autoIndex}`;
    }
    usedIds.add(id);

    current = {
      id,
      theme,
      headline: override?.headline ?? null,
      blocks: [],
    };
  }

  for (const block of blocks) {
    const searchText =
      block.type === "paragraph" ? block.text : block.items.join(" ");
    const override = findOverride(searchText, sectionOverrides);

    if (override || !current) {
      startSection(block, override);
    }

    current.blocks.push(block);

    if (
      block.type === "paragraph" &&
      override?.headline &&
      !current.headline
    ) {
      current.headline = override.headline;
    }
  }

  if (current && current.blocks.length) {
    sections.push(current);
  }

  return sections.map((section, index) => {
    if (!section.headline) {
      const firstParagraph = section.blocks.find((b) => b.type === "paragraph");
      if (firstParagraph) {
        const snippet = firstParagraph.text.slice(0, 60);
        section.headline =
          snippet.length < firstParagraph.text.length
            ? `${snippet}…`
            : snippet;
      } else {
        section.headline = `Chapter ${index + 1}`;
      }
    }
    return section;
  });
}

function build() {
  const config = loadConfig();
  const mdPath = join(root, "death.md");

  if (!existsSync(mdPath)) {
    console.warn("Warning: death.md not found — writing empty content.");
  }

  const raw = existsSync(mdPath) ? readFileSync(mdPath, "utf-8") : "";
  const blocks = parseMarkdown(raw);
  const sections = groupIntoSections(blocks, config);

  if (sections.length === 0) {
    console.warn("Warning: no sections parsed from death.md");
  } else {
  }

  const content = {
    title: config.title,
    description: config.description ?? "",
    sections,
  };

  const outDir = join(root, "src", "data");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "content.json"),
    JSON.stringify(content, null, 2),
    "utf-8"
  );

}

build();
