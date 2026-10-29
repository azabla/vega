// CV text is stored as light markup ("- " bullets, **bold**, *italic*, [label](https://…)) that
// backend/portfolio/cv/text.py turns into safe HTML. The rich editor works on HTML, so these
// convert both ways and only ever produce that markup.

const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same rules as text.py
const BULLET = /^\s*(?:[•·▪◦‣*-]|\d+[.)])\s+/;
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s()<>"']+)\)/g;
const BOLD = /\*\*(?!\s)(.+?)(?<!\s)\*\*/g;
const ITALIC = /(?<![*\w])\*(?![\s*])([^*\n]+?)(?<!\s)\*(?![*\w])/g;

const inlineHtml = (text) =>
    escapeHtml(text).replace(LINK, '<a href="$2">$1</a>').replace(BOLD, "<strong>$1</strong>").replace(ITALIC, "<em>$1</em>");

/** Stored markup → HTML for the editor (the same structure the PDF gets). */
export const markupToHtml = (text) => {
    const blocks = [];
    let paragraph = [];
    let bullets = [];
    const flush = () => {
        if (paragraph.length) blocks.push(`<p>${paragraph.map(inlineHtml).join("<br>")}</p>`);
        if (bullets.length) blocks.push(`<ul>${bullets.map((b) => `<li><p>${inlineHtml(b)}</p></li>`).join("")}</ul>`);
        paragraph = [];
        bullets = [];
    };
    for (const raw of (text ?? "").split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) flush();
        else if (BULLET.test(line)) {
            if (paragraph.length) flush();
            bullets.push(line.replace(BULLET, ""));
        } else {
            if (bullets.length) flush();
            paragraph.push(line);
        }
    }
    flush();
    return blocks.join("");
};

// Markers hug the text ("**word**", never "** word **"), or the markup wouldn't parse back
const wrap = (text, before, after) => {
    const [, lead, core, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return core ? `${lead}${before}${core}${after}${trail}` : text;
};

const inlineMarkup = (nodes = []) =>
    nodes
        .map((node) => {
            if (node.type === "hardBreak") return "\n";
            if (node.type !== "text") return "";
            let text = node.text;
            const marks = new Map((node.marks ?? []).map((m) => [m.type, m]));
            if (marks.has("italic")) text = wrap(text, "*", "*");
            if (marks.has("bold")) text = wrap(text, "**", "**");
            const href = marks.get("link")?.attrs?.href;
            if (href && /^https?:\/\//.test(href)) text = wrap(text, "[", `](${href})`);
            return text;
        })
        .join("");

/** The editor's document (editor.getJSON()) → stored markup. */
export const docToMarkup = (doc) =>
    (doc?.content ?? [])
        .map((block) => {
            if (block.type === "paragraph") return inlineMarkup(block.content).trim();
            if (block.type === "bulletList" || block.type === "orderedList") {
                return (block.content ?? [])
                    .map((item) => (item.content ?? []).map((p) => inlineMarkup(p.content).replace(/\n/g, " ").trim()).join(" "))
                    .filter(Boolean)
                    .map((line) => `- ${line}`)
                    .join("\n");
            }
            return "";
        })
        .filter(Boolean)
        .join("\n\n");
