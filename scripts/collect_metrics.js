const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const css = require("css");
const { execSync } = require("child_process");

const squadPath = process.argv[2];
const outFile = process.argv[3];

const result = { pages: {} };
const pagesPath = path.join(squadPath, "pages");
const stylesPath = path.join(squadPath, "styles");

function analyzeHTML(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);

  return {
    file_size_html: html.length,
    num_elements: $("*").length,
    dom_depth_max: Math.max(...$("*").map((_, el) => $(el).parents().length).get()),
    imgs_sem_alt: $("img:not([alt])").length
  };
}

function analyzeCSS(filePath) {
  const cssText = fs.readFileSync(filePath, "utf8");
  const ast = css.parse(cssText);

  let selectors = [];
  let specificity = [];

  ast.stylesheet.rules.forEach(rule => {
    if (rule.selectors) {
      selectors.push(...rule.selectors);
      rule.selectors.forEach(sel => specificity.push(sel.split(" ").length));
    }
  });

  return {
    file_size_css: cssText.length,
    num_selectors: selectors.length,
    max_specificity: specificity.length ? Math.max(...specificity) : 0,
    duplicated_selectors: selectors.length - new Set(selectors).size
  };
}

fs.readdirSync(pagesPath).forEach(htmlFile => {
  if (!htmlFile.endsWith(".html")) return;

  const page = path.basename(htmlFile, ".html");
  const pageMetrics = {};
  Object.assign(pageMetrics, analyzeHTML(path.join(pagesPath, htmlFile)));

  const cssFile = `${page}.css`;
  if (fs.existsSync(path.join(stylesPath, cssFile))) {
    Object.assign(pageMetrics, analyzeCSS(path.join(stylesPath, cssFile)));
  }

  result.pages[page] = pageMetrics;
});

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
