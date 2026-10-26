// Generates the profile README cards in ./cards from live GitHub data.
// Usage: GITHUB_TOKEN=... node scripts/generate.mjs
import { mkdir, writeFile } from "node:fs/promises";

const USER = "punhe";
const OUT = new URL("../cards/", import.meta.url);
const ICONS_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@11.0.0/icons/";

const profile = {
  firstName: "Hùng",
  role: "Frontend-focused Web Developer",
  focus: "React · Next.js · TypeScript",
  about: [
    "I build modern web apps with a focus on clean frontend",
    "experience, responsive UI, and practical product delivery.",
  ],
  chips: [
    { label: "TypeScript", slug: "typescript", color: "#3178C6" },
    { label: "Next.js", slug: "nextdotjs", color: "#FFFFFF" },
    { label: "React", slug: "react", color: "#61DAFB" },
    { label: "Vue", slug: "vuedotjs", color: "#4FC08D" },
    { label: "Node.js", slug: "nodedotjs", color: "#5FA04E" },
    { label: "Docker", slug: "docker", color: "#2496ED" },
  ],
  projects: [
    { name: "Academix", text: ["AI-powered training and", "marketplace platform."], tags: "AI · Marketplace" },
    { name: "EcoFit", text: ["Full-stack ecommerce project", "built independently."], tags: "Full-stack · Ecommerce" },
    { name: "Client projects", text: ["LMS portal and U.S.", "real estate website."], tags: "Client work" },
  ],
  stack: [
    { label: "HTML", slug: "html5", color: "#E34F26" },
    { label: "CSS", slug: "css3", color: "#1572B6" },
    { label: "JavaScript", slug: "javascript", color: "#F7DF1E" },
    { label: "TypeScript", slug: "typescript", color: "#3178C6" },
    { label: "React", slug: "react", color: "#61DAFB" },
    { label: "Next.js", slug: "nextdotjs", color: "#FFFFFF" },
    { label: "Vue", slug: "vuedotjs", color: "#4FC08D" },
    { label: "Nuxt", slug: "nuxtdotjs", color: "#00DC82" },
    { label: "Node.js", slug: "nodedotjs", color: "#5FA04E" },
    { label: "MongoDB", slug: "mongodb", color: "#47A248" },
    { label: "MySQL", slug: "mysql", color: "#6FA8DC" },
    { label: "Docker", slug: "docker", color: "#2496ED" },
  ],
  quote: "Building clean and practical web products.",
};

const C = {
  bg: "#0d1117",
  panel: "#0f141a",
  border: "#232b35",
  text: "#e6edf3",
  muted: "#8b949e",
  green: "#7ee787",
  greenDeep: "#3fb950",
  levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};
const FONT = `font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"`;
const W = 840;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => n.toLocaleString("en-US");
const svg = (h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" ${FONT}>\n${body}\n</svg>\n`;
const panel = (x, y, w, h) =>
  `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="14" fill="${C.panel}" stroke="${C.border}"/>`;
// Rough width of a label so chips fit their text.
const textWidth = (s, size) => [...s].length * size * 0.56;

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function loadStats() {
  const base = await gql(
    `query($login:String!){ user(login:$login){ followers{totalCount}
      contributionsCollection{ contributionCalendar{ totalContributions
        weeks{ contributionDays{ date contributionCount contributionLevel } } } } } }`,
    { login: USER },
  );
  let stars = 0, repos = 0, cursor = null;
  do {
    const page = await gql(
      `query($login:String!,$after:String){ user(login:$login){
        repositories(ownerAffiliations:OWNER, privacy:PUBLIC, first:100, after:$after){
          totalCount pageInfo{hasNextPage endCursor} nodes{ stargazerCount isFork } } } }`,
      { login: USER, after: cursor },
    );
    const r = page.user.repositories;
    repos = r.totalCount;
    stars += r.nodes.filter((n) => !n.isFork).reduce((sum, n) => sum + n.stargazerCount, 0);
    cursor = r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null;
  } while (cursor);
  const cal = base.user.contributionsCollection.contributionCalendar;
  return { stars, repos, followers: base.user.followers.totalCount, total: cal.totalContributions, weeks: cal.weeks };
}

const iconCache = new Map();
async function icon(slug) {
  if (!iconCache.has(slug)) {
    const res = await fetch(ICONS_CDN + slug + ".svg");
    if (!res.ok) throw new Error(`icon ${slug}: ${res.status}`);
    const path = (await res.text()).match(/<path d="([^"]+)"/)[1];
    iconCache.set(slug, path);
  }
  return iconCache.get(slug);
}
// Brand icon drawn from a 24x24 simple-icons path, scaled to `size`.
const brand = async (slug, color, x, y, size) =>
  `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${await icon(slug)}" fill="${color}"/>`;

async function header() {
  const h = 272;
  let chips = "", cx = 32;
  for (const c of profile.chips) {
    const w = 34 + textWidth(c.label, 12);
    chips += `<g><rect x="${cx}" y="216" width="${w}" height="28" rx="7" fill="#151b23" stroke="${C.border}"/>
      ${await brand(c.slug, c.color, cx + 9, 223, 14)}
      <text x="${cx + 28}" y="234.5" font-size="12" fill="${C.text}">${esc(c.label)}</text></g>`;
    cx += w + 8;
  }
  const art = illustration(640, 136);
  return svg(h, `
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${C.greenDeep}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${C.greenDeep}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="card"><rect x="0" y="0" width="${W}" height="${h}" rx="14"/></clipPath>
  </defs>
  ${panel(0, 0, W, h)}
  <g clip-path="url(#card)">${art}</g>
  <g>
    <rect x="32" y="30" width="96" height="24" rx="6" fill="#132018" stroke="#1f3a28"/>
    <circle cx="45" cy="42" r="3.5" fill="${C.green}"/>
    <text x="55" y="46.5" font-size="12" fill="${C.green}">README.md</text>
  </g>
  <text x="32" y="106" font-size="40" font-weight="700" fill="${C.text}">Hi, I'm <tspan fill="${C.green}">${esc(profile.firstName)}</tspan> 👋</text>
  <text x="32" y="140" font-size="16" font-weight="600" fill="${C.text}">${esc(profile.role)} <tspan fill="${C.muted}" font-weight="400">•</tspan> <tspan fill="${C.green}">${esc(profile.focus)}</tspan></text>
  ${profile.about.map((l, i) => `<text x="32" y="${174 + i * 21}" font-size="14" fill="${C.muted}">${esc(l)}</text>`).join("\n  ")}
  ${chips}`);
}

// Laptop on an orbit, centered on (cx, cy). The orbit dots drift slowly.
function illustration(cx, cy) {
  const rings = [
    [150, 52, -12], [120, 40, -12], [175, 66, 8],
  ].map(([rx, ry, rot]) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${C.green}" stroke-opacity="0.18"/>`).join("");
  const stars = [[-150, -95, 1.4], [120, -110, 1.1], [165, 60, 1.3], [-120, 95, 1], [60, -60, 0.9], [-60, 70, 1], [175, -40, 0.8]]
    .map(([dx, dy, r]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="${C.text}" opacity="0.55"/>`).join("");
  const code = [[0, 46, C.green], [10, 30, C.muted], [10, 52, "#79c0ff"], [20, 24, C.muted], [10, 40, "#d2a8ff"], [0, 18, C.green]]
    .map(([indent, w, col], i) => `<rect x="${cx - 52 + indent}" y="${cy - 40 + i * 10}" width="${w}" height="4" rx="2" fill="${col}" opacity="0.85"/>`).join("");
  const orbiter = (r, ry, dur, delay, col) => `
    <g transform="translate(${cx} ${cy}) rotate(-12) scale(1 ${ry / r})">
      <circle r="3.2" fill="${col}" cx="${r}" cy="0">
        <animateTransform attributeName="transform" type="rotate" from="${delay} 0 0" to="${delay + 360} 0 0" dur="${dur}s" repeatCount="indefinite"/>
      </circle>
    </g>`;
  return `
  <circle cx="${cx}" cy="${cy}" r="170" fill="url(#glow)"/>
  ${rings}${stars}
  <g>
    <rect x="${cx - 66}" y="${cy - 56}" width="132" height="86" rx="8" fill="#0b1016" stroke="${C.green}" stroke-opacity="0.55" stroke-width="1.5"/>
    <rect x="${cx - 60}" y="${cy - 50}" width="120" height="74" rx="4" fill="#0f1a14"/>
    ${code}
    <rect x="${cx + 8}" y="${cy + 10}" width="7" height="3" rx="1.5" fill="${C.green}">
      <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite"/>
    </rect>
    <path d="M${cx - 84} ${cy + 32} h168 l-10 12 h-148 z" fill="#121a22" stroke="${C.green}" stroke-opacity="0.45"/>
  </g>
  ${orbiter(150, 52, 18, 0, C.green)}
  ${orbiter(175, 66, 26, 140, "#79c0ff")}`;
}

function stats(s) {
  const h = 96;
  const items = [
    ["star", fmt(s.stars), "Total Stars"],
    ["repo", fmt(s.repos), "Repositories"],
    ["pulse", fmt(s.total), "Contributions (last year)"],
    ["people", fmt(s.followers), "Followers"],
  ];
  const col = W / items.length;
  const glyph = (kind, x, y) => {
    const st = `fill="none" stroke="${C.green}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
    if (kind === "star") {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 4.6 : 10.5, a = (Math.PI / 5) * i - Math.PI / 2;
        return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${pts}" ${st}/>`;
    }
    if (kind === "repo") return `<path d="M${x - 8} ${y + 9} V${y - 7} a3 3 0 0 1 3 -3 H${x + 8} V${y + 6} H${x - 5} a3 3 0 0 0 -3 3 a3 3 0 0 0 3 3 H${x + 8}" ${st}/>`;
    if (kind === "pulse") return `<polyline points="${x - 10},${y} ${x - 5},${y} ${x - 2},${y - 8} ${x + 2},${y + 8} ${x + 5},${y} ${x + 10},${y}" ${st}/>`;
    return `<circle cx="${x - 3}" cy="${y - 4}" r="4" ${st}/><path d="M${x - 10} ${y + 9} a7 6 0 0 1 14 0" ${st}/><circle cx="${x + 6}" cy="${y - 3}" r="3" ${st}/><path d="M${x + 6} ${y + 3} a5 5 0 0 1 5 6" ${st}/>`;
  };
  const body = items.map(([kind, value, label], i) => {
    const x = i * col;
    return `${i ? `<line x1="${x}" y1="22" x2="${x}" y2="${h - 22}" stroke="${C.border}"/>` : ""}
    <circle cx="${x + 46}" cy="${h / 2}" r="19" fill="#132018"/>
    ${glyph(kind, x + 46, h / 2)}
    <text x="${x + 76}" y="${h / 2 - 1}" font-size="24" font-weight="700" fill="${C.text}">${value}</text>
    <text x="${x + 77}" y="${h / 2 + 18}" font-size="12" fill="${C.muted}">${esc(label)}</text>`;
  }).join("\n");
  return svg(h, `${panel(0, 0, W, h)}\n${body}`);
}

function activity(s) {
  const h = 214, cell = 11, gap = 3, step = cell + gap;
  const weeks = s.weeks.slice(-53);
  const gx = (W - weeks.length * step + gap) / 2, gy = 84;
  const levelIdx = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  let cells = "", months = "", lastMonth = -1;
  weeks.forEach((w, wi) => {
    w.contributionDays.forEach((d) => {
      const dow = new Date(d.date + "T00:00:00Z").getUTCDay();
      cells += `<rect x="${gx + wi * step}" y="${gy + dow * step}" width="${cell}" height="${cell}" rx="2.5" fill="${C.levels[levelIdx[d.contributionLevel]]}"><title>${d.date}: ${d.contributionCount}</title></rect>`;
    });
    const m = new Date(w.contributionDays[0].date + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth && wi < weeks.length - 2) {
      if (lastMonth !== -1 || w.contributionDays[0].date.slice(8) <= "07")
        months += `<text x="${gx + wi * step}" y="${gy - 8}" font-size="11" fill="${C.muted}">${new Date(Date.UTC(2000, m, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`;
      lastMonth = m;
    }
  });
  const legendX = W - 32 - (5 * 14 + 70);
  const legend = `<text x="${legendX}" y="${h - 20}" font-size="11" fill="${C.muted}">Less</text>` +
    C.levels.map((c, i) => `<rect x="${legendX + 32 + i * 14}" y="${h - 29}" width="11" height="11" rx="2.5" fill="${c}"/>`).join("") +
    `<text x="${legendX + 32 + 5 * 14 + 4}" y="${h - 20}" font-size="11" fill="${C.muted}">More</text>`;
  return svg(h, `${panel(0, 0, W, h)}
  <text x="32" y="38" font-size="15" font-weight="600" fill="${C.green}">Contribution Activity</text>
  <text x="32" y="58" font-size="12" fill="${C.muted}">🔥 ${fmt(s.total)} contributions in the last year</text>
  ${months}${cells}${legend}`);
}

function projects() {
  const h = 212, pad = 20, gap = 14;
  const cw = (W - pad * 2 - gap * 2) / 3;
  const cards = profile.projects.map((p, i) => {
    const x = pad + i * (cw + gap), y = 58;
    return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${h - y - pad - 1}" rx="10" fill="#121820" stroke="${C.border}"/>
    <rect x="${x + 16}" y="${y + 16}" width="30" height="30" rx="8" fill="#132018" stroke="#1f3a28"/>
    <text x="${x + 31}" y="${y + 36}" font-size="14" font-weight="700" fill="${C.green}" text-anchor="middle">${esc(p.name[0])}</text>
    <text x="${x + 58}" y="${y + 36}" font-size="15" font-weight="600" fill="${C.text}">${esc(p.name)}</text>
    ${p.text.map((l, j) => `<text x="${x + 16}" y="${y + 70 + j * 18}" font-size="12.5" fill="${C.muted}">${esc(l)}</text>`).join("")}
    <circle cx="${x + 20}" cy="${h - pad - 18}" r="4" fill="${C.greenDeep}"/>
    <text x="${x + 30}" y="${h - pad - 14}" font-size="11.5" fill="${C.muted}">${esc(p.tags)}</text>`;
  }).join("\n");
  return svg(h, `${panel(0, 0, W, h)}
  <text x="32" y="38" font-size="15" font-weight="600" fill="${C.green}">Featured Projects</text>
  ${cards}`);
}

async function stack() {
  const h = 132, n = profile.stack.length;
  const slot = (W - 40) / n;
  let tiles = "";
  for (const [i, t] of profile.stack.entries()) {
    const cx = 20 + slot * i + slot / 2;
    tiles += `<rect x="${cx - 21}" y="52" width="42" height="42" rx="10" fill="#121820" stroke="${C.border}"/>
    ${await brand(t.slug, t.color, cx - 11, 62, 22)}
    <text x="${cx}" y="114" font-size="11" fill="${C.muted}" text-anchor="middle">${esc(t.label)}</text>`;
  }
  return svg(h, `${panel(0, 0, W, h)}
  <text x="32" y="38" font-size="15" font-weight="600" fill="${C.green}">Tech Stack</text>
  ${tiles}`);
}

function quote() {
  const h = 64;
  return svg(h, `${panel(0, 0, W, h)}
  <text x="${W / 2}" y="${h / 2 + 5}" font-size="14" font-style="italic" fill="${C.muted}" text-anchor="middle"><tspan fill="${C.green}" font-size="18">❝</tspan><tspan dx="8">${esc(profile.quote)}</tspan><tspan dx="8" fill="${C.green}" font-size="18">❞</tspan></text>`);
}

const s = await loadStats();
await mkdir(OUT, { recursive: true });
const files = {
  "header.svg": await header(),
  "stats.svg": stats(s),
  "activity.svg": activity(s),
  "projects.svg": projects(),
  "stack.svg": await stack(),
  "quote.svg": quote(),
};
for (const [name, content] of Object.entries(files)) await writeFile(new URL(name, OUT), content);
console.log(`cards written: ${Object.keys(files).join(", ")} (stars ${s.stars}, repos ${s.repos}, contributions ${s.total})`);
