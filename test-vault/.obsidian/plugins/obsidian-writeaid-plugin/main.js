"use strict";
var Lc = Object.defineProperty;
var ho = (r) => {
  throw TypeError(r);
};
var Mc = (r, t, e) =>
  t in r ? Lc(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : (r[t] = e);
var ye = (r, t, e) => Mc(r, typeof t != "symbol" ? t + "" : t, e),
  Ka = (r, t, e) => t.has(r) || ho("Cannot " + e);
var tt = (r, t, e) => (Ka(r, t, "read from private field"), e ? e.call(r) : t.get(r)),
  It = (r, t, e) =>
    t.has(r)
      ? ho("Cannot add the same private member more than once")
      : t instanceof WeakSet
        ? t.add(r)
        : t.set(r, e),
  bt = (r, t, e, n) => (Ka(r, t, "write to private field"), n ? n.call(r, e) : t.set(r, e), e),
  fe = (r, t, e) => (Ka(r, t, "access private method"), e);
const j = require("obsidian"),
  ba = { DRAFTS: "drafts", MANUSCRIPTS: "manuscripts", BACKUPS: ".writeaid-backups" },
  Ds = { META: "meta.md", OUTLINE: "outline.md" },
  ss = { COMPACT: "compact", KEBAB: "kebab" },
  rn = { SINGLE: "single-file", MULTI: "multi-file" },
  Wc = Object.values(rn),
  Kt = "WriteAid",
  H = `${Kt} debug:`;
function oe(r) {
  return (r == null ? void 0 : r.draftsFolderName) || ba.DRAFTS;
}
function Ns(r) {
  return (r == null ? void 0 : r.manuscriptsFolderName) || ba.MANUSCRIPTS;
}
function Vn(r) {
  return (r == null ? void 0 : r.backupsFolderName) || ba.BACKUPS;
}
function Gn(r) {
  return (r == null ? void 0 : r.metaFileName) || Ds.META;
}
function Zo(r) {
  return (r == null ? void 0 : r.outlineFileName) || Ds.OUTLINE;
}
function Ke(r, t = ss.COMPACT) {
  if (!r) return "";
  const e = r.trim();
  return t === ss.KEBAB
    ? e.replace(/\s+/g, "-").toLowerCase()
    : e.replace(/\s+/g, "").toLowerCase();
}
async function Yn(r, t) {
  const e = await Promise.all(r.map((n) => Promise.resolve(t(n))));
  return r.filter((n, i) => e[i]);
}
function Lt(r, ...t) {
  try {
    return r();
  } catch (e) {
    if ((t.length > 0 && t.some((n) => e instanceof n)) || t.length === 0) return;
    throw e;
  }
}
async function ge(r, ...t) {
  try {
    return await r();
  } catch (e) {
    if ((t.length > 0 && t.some((n) => e instanceof n)) || t.length === 0) return;
    throw e;
  }
}
function Z(...r) {
  Lt(() => {
    window.__WRITEAID_DEBUG__ && (console.debug || console.log).apply(console, r);
  });
}
const Uc = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      APP_NAME: Kt,
      DEBUG_PREFIX: H,
      FILES: Ds,
      FOLDERS: ba,
      PROJECT_TYPE: rn,
      SLUG_STYLE: ss,
      VALID_PROJECT_TYPES: Wc,
      asyncFilter: Yn,
      debug: Z,
      getBackupsFolderName: Vn,
      getDraftsFolderName: oe,
      getManuscriptsFolderName: Ns,
      getMetaFileName: Gn,
      getOutlineFileName: Zo,
      slugifyDraftName: Ke,
      suppress: Lt,
      suppressAsync: ge,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
function Vc(r) {
  return async () => {
    const t = r.activeProject,
      e = r.activeDraft;
    if (
      (Z(`${H} Clear old backups command called`),
      Z(`${H} Active project: ${t}, active draft: ${e}`),
      !t || !e)
    ) {
      new j.Notice("No active project or draft found.");
      return;
    }
    const n = oe(r.settings),
      i = `${t}/${n}/${e}`,
      a = r.projectFileService.backups.maxBackupAgeDays;
    (await r.projectFileService.backups.clearOldBackups(i, r.settings),
      new j.Notice(`Old backups cleared (older than ${a} days).`));
  };
}
async function An(r, t) {
  const e = r.vault.getAbstractFileByPath(t);
  if (!e || !(e instanceof j.TFile)) return null;
  try {
    const n = await r.vault.read(e);
    return Hc(n);
  } catch (n) {
    return (Z(`${H} Error reading meta file:`, n), null);
  }
}
async function js(r, t, e) {
  const n = Zc(e),
    i = r.vault.getAbstractFileByPath(t);
  i && i instanceof j.TFile ? await r.vault.modify(i, n) : await r.vault.create(t, n);
}
async function Hn(r, t, e, n, i) {
  const a = `${t}/meta.md`;
  let o = await An(r, a);
  o || (o = { total_drafts: 0 });
  const s = oe(i),
    l = r.vault.getAbstractFileByPath(`${t}/${s}`);
  if (l && l instanceof j.TFolder) {
    const c = l.children.filter((p) => p instanceof j.TFolder);
    o.total_drafts = c.length;
  }
  (e !== void 0 &&
    ((o.current_active_draft = e), (o.active_draft_last_modified = new Date().toISOString())),
    n && Object.assign(o, n),
    o.total_drafts > 0 &&
      o.total_word_count &&
      (o.average_draft_word_count = Math.round(o.total_word_count / o.total_drafts)),
    await js(r, a, o));
}
function Hc(r) {
  const t = r.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!t) return null;
  const e = t[1],
    n = {},
    i = e.split(`
`);
  for (const a of i) {
    const o = a.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (o) {
      const s = o[1];
      let l = o[2].trim();
      (/^-?\d+(\.\d+)?$/.test(l)
        ? (l = Number(l))
        : ((l.startsWith('"') && l.endsWith('"')) || (l.startsWith("'") && l.endsWith("'"))) &&
          (l = l.slice(1, -1)),
        (n[s] = l));
    }
  }
  return n;
}
function Zc(r) {
  const t = ["---"];
  if (
    (r.current_active_draft !== void 0 &&
      t.push(`current_active_draft: "${r.current_active_draft}"`),
    t.push(`total_drafts: ${r.total_drafts}`),
    r.target_word_count !== void 0 && t.push(`target_word_count: ${r.target_word_count}`),
    r.active_draft_last_modified !== void 0 &&
      t.push(`active_draft_last_modified: "${r.active_draft_last_modified}"`),
    r.total_word_count !== void 0 && t.push(`total_word_count: ${r.total_word_count}`),
    r.average_draft_word_count !== void 0 &&
      t.push(`average_draft_word_count: ${r.average_draft_word_count}`),
    r.project_type !== void 0 && t.push(`project_type: ${r.project_type}`),
    t.push("---"),
    t.push(""),
    t.push("# Project Statistics"),
    t.push(""),
    r.current_active_draft && t.push(`**Active Draft:** ${r.current_active_draft}`),
    t.push(`**Total Drafts:** ${r.total_drafts}`),
    r.target_word_count && t.push(`**Target Word Count:** ${r.target_word_count.toLocaleString()}`),
    r.active_draft_last_modified)
  ) {
    const e = new Date(r.active_draft_last_modified);
    t.push(`**Last Modified:** ${e.toLocaleString()}`);
  }
  return (
    r.total_word_count && t.push(`**Total Word Count:** ${r.total_word_count.toLocaleString()}`),
    r.average_draft_word_count &&
      t.push(`**Average Draft Word Count:** ${r.average_draft_word_count.toLocaleString()}`),
    t.push(""),
    t.join(`
`)
  );
}
const os = Object.freeze(
  Object.defineProperty(
    { __proto__: null, readMetaFile: An, updateMetaStats: Hn, writeMetaFile: js },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
async function qc(r, t, e) {
  const n = `${t}/meta.md`,
    i = await An(r, n);
  if (!i || i.project_type !== rn.SINGLE)
    return (new j.Notice(`Project is not a ${rn.SINGLE} project.`), !1);
  ((i.project_type = rn.MULTI), await js(r, n, i));
  const a = oe(e),
    o = r.vault.getAbstractFileByPath(`${t}/${a}`);
  if (!o || !(o instanceof j.TFolder)) return (new j.Notice("Drafts folder not found."), !1);
  let s = !1;
  for (const l of o.children)
    if (l instanceof j.TFolder) {
      const c = Ke(l.name),
        p = l.children.find((d) => d instanceof j.TFile && d.name === `${c}.md`);
      if (p) {
        const d = `${l.path}/Chapter 1.md`;
        if (p.path !== d) {
          const v = await r.vault.read(p);
          (await r.vault.create(d, v), await r.vault.delete(p), (s = !0));
        }
      }
    }
  return (
    s
      ? new j.Notice('Converted to multi-file project. Draft files renamed to "Chapter 1.md".')
      : new j.Notice("Converted to multi-file project. No draft files needed renaming."),
    !0
  );
}
async function Gc(r, t, e) {
  if (!t) {
    new j.Notice("No active project selected.");
    return;
  }
  await qc(r, t, e);
}
function Yc(r) {
  return async () => {
    const t = r.activeProject,
      e = r.activeDraft;
    if (
      (Z(`${H} Create backup command called`),
      Z(`${H} Active project: ${t}, active draft: ${e}`),
      !t || !e)
    ) {
      new j.Notice("No active project or draft found.");
      return;
    }
    const n = oe(r.settings),
      i = `${t}/${n}/${e}`;
    (await r.projectFileService.backups.createBackup(i, r.settings))
      ? new j.Notice("Backup created successfully.")
      : new j.Notice("Failed to create backup.");
  };
}
function Kc(r) {
  return () => r.createNewDraftPrompt();
}
function Xc(r) {
  return () => r.createNewProjectPrompt();
}
function Jc(r) {
  return async () => {
    const t = r.activeProject,
      e = r.activeDraft;
    if (
      (Z(`${H} Delete backup command called`),
      Z(`${H} Active project: ${t}, active draft: ${e}`),
      !t || !e)
    ) {
      new j.Notice("No active project or draft found.");
      return;
    }
    const n = oe(r.settings),
      i = `${t}/${n}/${e}`,
      a = await r.projectFileService.backups.listBackups(i, r.settings);
    if (a.length === 0) {
      new j.Notice("No backups found for the current draft.");
      return;
    }
    const o = a[a.length - 1];
    (await r.projectFileService.backups.deleteBackup(i, o, r.settings))
      ? new j.Notice(`Backup deleted successfully: ${o}.`)
      : new j.Notice("Failed to delete backup.");
  };
}
function Qc(r) {
  return async () => {
    var a;
    const t = r.projectFileService.drafts,
      e = r.activeProject,
      n = r.activeDraft;
    if (
      (Z(`${H} Generate manuscript command called`),
      Z(`${H} Active project: ${e}, active draft: ${n}`),
      Z(
        `${H} Manager settings manuscript template: ${(a = r.settings) == null ? void 0 : a.manuscriptNameTemplate}`,
      ),
      !e || !n)
    ) {
      new j.Notice("No active project or draft found.");
      return;
    }
    (await t.generateManuscript(e, n, r.settings))
      ? new j.Notice("Manuscript generated successfully.")
      : new j.Notice("Failed to generate manuscript.");
  };
}
class qo extends j.Modal {
  constructor(t, e, n = !1) {
    (super(t), (this.path = e), (this.isDraft = n), this.setTitle("Confirm Overwrite"));
  }
  onOpen() {
    const { contentEl: t } = this,
      e = this.isDraft ? "draft folder" : "manuscript file";
    t.createEl("p", {
      text: `The ${e} "${this.path}" already exists. Do you want to overwrite it?`,
    });
    const n = t.createDiv({ cls: "modal-button-container" });
    (new j.ButtonComponent(n).setButtonText("Cancel").onClick(() => {
      (this.resolve(!1), this.close());
    }),
      new j.ButtonComponent(n)
        .setButtonText("Overwrite")
        .setCta()
        .onClick(() => {
          (this.resolve(!0), this.close());
        }));
  }
  onClose() {
    const { contentEl: t } = this;
    t.empty();
  }
  open() {
    return new Promise((t) => {
      ((this.resolve = t), super.open());
    });
  }
}
class tu extends j.SuggestModal {
  constructor(t, e) {
    (super(t),
      (this.manager = e),
      (this.backups = []),
      (this.draftFolder = ""),
      (this.draftName = ""),
      this.setPlaceholder("Select a backup to restore..."),
      this.setInstructions([
        { command: "↑↓", purpose: "to navigate" },
        { command: "↵", purpose: "to restore" },
        { command: "esc", purpose: "to cancel" },
      ]));
  }
  async onOpen() {
    const t = this.manager.activeProject;
    if (!t) {
      (new j.Notice("No active project found."), this.close());
      return;
    }
    const e = oe(this.manager.settings);
    if (
      ((this.draftFolder = `${t}/${e}`),
      (this.draftName = t),
      (this.backups = await this.getBackupDetails()),
      this.backups.length === 0)
    ) {
      (new j.Notice("No backups found for the current project."), this.close());
      return;
    }
    (this.setTitle(`Restore Backup for Project "${t}"`), super.onOpen());
  }
  async getBackupDetails() {
    const t = this.draftFolder.split("/")[0] || "unknown",
      e = `${Vn(this.manager.settings)}/${t}`;
    try {
      const n = await this.app.vault.adapter.list(e),
        i = [],
        a = oe(this.manager.settings),
        o = `${e}/${a}`,
        s = await this.app.vault.adapter.list(o);
      for (const l of s.folders) {
        const c = l.split("/").pop() || l,
          p = `${o}/${c}`,
          d = await this.app.vault.adapter.list(p),
          v = `${t}/${a}/${c}`;
        for (const u of d.files) {
          const f = u.split("/").pop() || u,
            h = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            b = new RegExp(`^${h}_(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2})\\.zip$`),
            g = f.match(b);
          if (g) {
            const _ = await this.app.vault.adapter.stat(u),
              y = (_ == null ? void 0 : _.size) || 0,
              k = g[1],
              P = k.replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3"),
              T = new Date(P).toLocaleString(),
              S = this.formatFileSize(y);
            i.push({
              timestamp: k,
              size: y,
              displayText: `${c}: ${T} (${S})`,
              draftName: c,
              draftFolder: v,
            });
          }
        }
      }
      return i.sort((l, c) => c.timestamp.localeCompare(l.timestamp));
    } catch (n) {
      return (Z(`${H} Failed to list backup directory '${e}': ${n}`), []);
    }
  }
  formatFileSize(t) {
    if (t === 0) return "0 B";
    const e = 1024,
      n = ["B", "KB", "MB", "GB"],
      i = Math.floor(Math.log(t) / Math.log(e));
    return parseFloat((t / Math.pow(e, i)).toFixed(1)) + " " + n[i];
  }
  getSuggestions(t) {
    return this.backups.filter((e) => e.displayText.toLowerCase().includes(t.toLowerCase()));
  }
  renderSuggestion(t, e) {
    e.createEl("div", { text: t.displayText });
  }
  async onChooseSuggestion(t, e) {
    const n = this.app.vault.getAbstractFileByPath(t.draftFolder);
    if (n && n instanceof j.TFolder && !(await new qo(this.app, t.draftFolder, !0).open())) return;
    (await this.manager.projectFileService.backups.restoreBackup(
      t.draftFolder,
      t.timestamp,
      this.manager.settings,
    ))
      ? new j.Notice(
          `Backup restored successfully for "${t.draftName}" from ${t.displayText.split(": ")[1].split(" (")[0]}.`,
        )
      : new j.Notice("Failed to restore backup.");
  }
}
function eu(r) {
  return async () => {
    (Z(`${H} List backups command called`), new tu(r.app, r).open());
  };
}
function ru(r) {
  return async () => {
    const t = r.app.workspace.getActiveFile();
    if (!t) {
      new j.Notice("No file is currently open.");
      return;
    }
    const e = t.path,
      n = oe(r.settings),
      i = e.match(new RegExp(`^(.+)/${n}/(.+)/(.+)\\.md$`));
    if (!i) {
      new j.Notice("The current file is not a chapter.");
      return;
    }
    const a = i[1],
      o = i[2],
      s = i[3];
    try {
      const l = await r.projectFileService.chapters.listChapters(a, o),
        c = l.findIndex((d) => d.name === s);
      if (c === -1) {
        new j.Notice("Unable to find the current chapter in the draft.");
        return;
      }
      if (c >= l.length - 1) return;
      const p = l[c + 1];
      await r.openChapter(a, o, p.name);
    } catch (l) {
      (Z(`${H} Failed to navigate to next chapter:`, l),
        new j.Notice("Failed to navigate to next chapter."));
    }
  };
}
function nu(r) {
  return async () => {
    const t = r.app.workspace.getActiveFile();
    if (!t) {
      new j.Notice("No file is currently open.");
      return;
    }
    const e = t.path,
      n = oe(r.settings),
      i = e.match(new RegExp(`^(.+)/${n}/(.+)/(.+)\\.md$`));
    if (!i) {
      new j.Notice("The current file is not a chapter.");
      return;
    }
    const a = i[1],
      o = i[2],
      s = i[3];
    try {
      const l = await r.projectFileService.chapters.listChapters(a, o),
        c = l.findIndex((d) => d.name === s);
      if (c === -1) {
        new j.Notice("Unable to find the current chapter in the draft.");
        return;
      }
      if (c <= 0) return;
      const p = l[c - 1];
      await r.openChapter(a, o, p.name);
    } catch (l) {
      (Z(`${H} Failed to navigate to previous chapter:`, l),
        new j.Notice("Failed to navigate to previous chapter."));
    }
  };
}
function iu(r) {
  return () => r.selectActiveProjectPrompt();
}
function au(r) {
  return () => r.switchDraftPrompt();
}
class Go {
  constructor(t) {
    ((this.app = t), Z(`${H} TemplateService created`));
  }
  async render(t, e = {}) {
    let n = t || "";
    return (
      Z(
        `${H} TemplateService.render called with template: "${n.substring(0, 100)}${n.length > 100 ? "..." : ""}", vars:`,
        Object.keys(e),
      ),
      !n.includes("{{") && !n.includes("}}")
        ? (Z(`${H} Template doesn't contain template syntax, checking if it's a file path`),
          await ge(async () => {
            const i = this.app.vault.getAbstractFileByPath(n);
            i && i instanceof j.TFile
              ? (Z(`${H} Reading template from file: ${n}`),
                (n = await this.app.vault.read(i)),
                Z(`${H} Template loaded from file, length: ${n.length} chars`))
              : Z(`${H} Template path "${n}" is not a valid file, treating as inline template`);
          }))
        : Z(`${H} Template contains template syntax, treating as inline template`),
      Z(`${H} Performing template variable substitution`),
      (n = n.replace(/{{\s*(\w+(?:[-:]\w+)*)\s*}}/g, (i, a) => {
        if (e[a] !== void 0)
          return (Z(`${H} Substituting variable {{${a}}} with provided value: "${e[a]}"`), e[a]);
        try {
          const o = window.moment().format(a);
          return (Z(`${H} Substituting {{${a}}} with moment.js format: "${o}"`), o);
        } catch {
          return (
            Z(`${H} Neither variable nor moment.js format found for {{${a}}}, returning as-is`),
            a
          );
        }
      })),
      Z(`${H} Template rendering complete, result length: ${n.length} chars`),
      n
    );
  }
}
var Wi =
  typeof globalThis < "u"
    ? globalThis
    : typeof window < "u"
      ? window
      : typeof global < "u"
        ? global
        : typeof self < "u"
          ? self
          : {};
function su(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
function Ui(r) {
  throw new Error(
    'Could not dynamically require "' +
      r +
      '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.',
  );
}
var Yo = { exports: {} };
/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/ (function (r, t) {
  (function (e) {
    r.exports = e();
  })(function () {
    return (function e(n, i, a) {
      function o(c, p) {
        if (!i[c]) {
          if (!n[c]) {
            var d = typeof Ui == "function" && Ui;
            if (!p && d) return d(c, !0);
            if (s) return s(c, !0);
            var v = new Error("Cannot find module '" + c + "'");
            throw ((v.code = "MODULE_NOT_FOUND"), v);
          }
          var u = (i[c] = { exports: {} });
          n[c][0].call(
            u.exports,
            function (f) {
              var h = n[c][1][f];
              return o(h || f);
            },
            u,
            u.exports,
            e,
            n,
            i,
            a,
          );
        }
        return i[c].exports;
      }
      for (var s = typeof Ui == "function" && Ui, l = 0; l < a.length; l++) o(a[l]);
      return o;
    })(
      {
        1: [
          function (e, n, i) {
            var a = e("./utils"),
              o = e("./support"),
              s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            ((i.encode = function (l) {
              for (
                var c,
                  p,
                  d,
                  v,
                  u,
                  f,
                  h,
                  b = [],
                  g = 0,
                  _ = l.length,
                  y = _,
                  k = a.getTypeOf(l) !== "string";
                g < l.length;

              )
                ((y = _ - g),
                  (d = k
                    ? ((c = l[g++]), (p = g < _ ? l[g++] : 0), g < _ ? l[g++] : 0)
                    : ((c = l.charCodeAt(g++)),
                      (p = g < _ ? l.charCodeAt(g++) : 0),
                      g < _ ? l.charCodeAt(g++) : 0)),
                  (v = c >> 2),
                  (u = ((3 & c) << 4) | (p >> 4)),
                  (f = 1 < y ? ((15 & p) << 2) | (d >> 6) : 64),
                  (h = 2 < y ? 63 & d : 64),
                  b.push(s.charAt(v) + s.charAt(u) + s.charAt(f) + s.charAt(h)));
              return b.join("");
            }),
              (i.decode = function (l) {
                var c,
                  p,
                  d,
                  v,
                  u,
                  f,
                  h = 0,
                  b = 0,
                  g = "data:";
                if (l.substr(0, g.length) === g)
                  throw new Error("Invalid base64 input, it looks like a data url.");
                var _,
                  y = (3 * (l = l.replace(/[^A-Za-z0-9+/=]/g, "")).length) / 4;
                if (
                  (l.charAt(l.length - 1) === s.charAt(64) && y--,
                  l.charAt(l.length - 2) === s.charAt(64) && y--,
                  y % 1 != 0)
                )
                  throw new Error("Invalid base64 input, bad content length.");
                for (_ = o.uint8array ? new Uint8Array(0 | y) : new Array(0 | y); h < l.length; )
                  ((c = (s.indexOf(l.charAt(h++)) << 2) | ((v = s.indexOf(l.charAt(h++))) >> 4)),
                    (p = ((15 & v) << 4) | ((u = s.indexOf(l.charAt(h++))) >> 2)),
                    (d = ((3 & u) << 6) | (f = s.indexOf(l.charAt(h++)))),
                    (_[b++] = c),
                    u !== 64 && (_[b++] = p),
                    f !== 64 && (_[b++] = d));
                return _;
              }));
          },
          { "./support": 30, "./utils": 32 },
        ],
        2: [
          function (e, n, i) {
            var a = e("./external"),
              o = e("./stream/DataWorker"),
              s = e("./stream/Crc32Probe"),
              l = e("./stream/DataLengthProbe");
            function c(p, d, v, u, f) {
              ((this.compressedSize = p),
                (this.uncompressedSize = d),
                (this.crc32 = v),
                (this.compression = u),
                (this.compressedContent = f));
            }
            ((c.prototype = {
              getContentWorker: function () {
                var p = new o(a.Promise.resolve(this.compressedContent))
                    .pipe(this.compression.uncompressWorker())
                    .pipe(new l("data_length")),
                  d = this;
                return (
                  p.on("end", function () {
                    if (this.streamInfo.data_length !== d.uncompressedSize)
                      throw new Error("Bug : uncompressed data size mismatch");
                  }),
                  p
                );
              },
              getCompressedWorker: function () {
                return new o(a.Promise.resolve(this.compressedContent))
                  .withStreamInfo("compressedSize", this.compressedSize)
                  .withStreamInfo("uncompressedSize", this.uncompressedSize)
                  .withStreamInfo("crc32", this.crc32)
                  .withStreamInfo("compression", this.compression);
              },
            }),
              (c.createWorkerFrom = function (p, d, v) {
                return p
                  .pipe(new s())
                  .pipe(new l("uncompressedSize"))
                  .pipe(d.compressWorker(v))
                  .pipe(new l("compressedSize"))
                  .withStreamInfo("compression", d);
              }),
              (n.exports = c));
          },
          {
            "./external": 6,
            "./stream/Crc32Probe": 25,
            "./stream/DataLengthProbe": 26,
            "./stream/DataWorker": 27,
          },
        ],
        3: [
          function (e, n, i) {
            var a = e("./stream/GenericWorker");
            ((i.STORE = {
              magic: "\0\0",
              compressWorker: function () {
                return new a("STORE compression");
              },
              uncompressWorker: function () {
                return new a("STORE decompression");
              },
            }),
              (i.DEFLATE = e("./flate")));
          },
          { "./flate": 7, "./stream/GenericWorker": 28 },
        ],
        4: [
          function (e, n, i) {
            var a = e("./utils"),
              o = (function () {
                for (var s, l = [], c = 0; c < 256; c++) {
                  s = c;
                  for (var p = 0; p < 8; p++) s = 1 & s ? 3988292384 ^ (s >>> 1) : s >>> 1;
                  l[c] = s;
                }
                return l;
              })();
            n.exports = function (s, l) {
              return s !== void 0 && s.length
                ? a.getTypeOf(s) !== "string"
                  ? (function (c, p, d, v) {
                      var u = o,
                        f = v + d;
                      c ^= -1;
                      for (var h = v; h < f; h++) c = (c >>> 8) ^ u[255 & (c ^ p[h])];
                      return -1 ^ c;
                    })(0 | l, s, s.length, 0)
                  : (function (c, p, d, v) {
                      var u = o,
                        f = v + d;
                      c ^= -1;
                      for (var h = v; h < f; h++) c = (c >>> 8) ^ u[255 & (c ^ p.charCodeAt(h))];
                      return -1 ^ c;
                    })(0 | l, s, s.length, 0)
                : 0;
            };
          },
          { "./utils": 32 },
        ],
        5: [
          function (e, n, i) {
            ((i.base64 = !1),
              (i.binary = !1),
              (i.dir = !1),
              (i.createFolders = !0),
              (i.date = null),
              (i.compression = null),
              (i.compressionOptions = null),
              (i.comment = null),
              (i.unixPermissions = null),
              (i.dosPermissions = null));
          },
          {},
        ],
        6: [
          function (e, n, i) {
            var a = null;
            ((a = typeof Promise < "u" ? Promise : e("lie")), (n.exports = { Promise: a }));
          },
          { lie: 37 },
        ],
        7: [
          function (e, n, i) {
            var a = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u",
              o = e("pako"),
              s = e("./utils"),
              l = e("./stream/GenericWorker"),
              c = a ? "uint8array" : "array";
            function p(d, v) {
              (l.call(this, "FlateWorker/" + d),
                (this._pako = null),
                (this._pakoAction = d),
                (this._pakoOptions = v),
                (this.meta = {}));
            }
            ((i.magic = "\b\0"),
              s.inherits(p, l),
              (p.prototype.processChunk = function (d) {
                ((this.meta = d.meta),
                  this._pako === null && this._createPako(),
                  this._pako.push(s.transformTo(c, d.data), !1));
              }),
              (p.prototype.flush = function () {
                (l.prototype.flush.call(this),
                  this._pako === null && this._createPako(),
                  this._pako.push([], !0));
              }),
              (p.prototype.cleanUp = function () {
                (l.prototype.cleanUp.call(this), (this._pako = null));
              }),
              (p.prototype._createPako = function () {
                this._pako = new o[this._pakoAction]({
                  raw: !0,
                  level: this._pakoOptions.level || -1,
                });
                var d = this;
                this._pako.onData = function (v) {
                  d.push({ data: v, meta: d.meta });
                };
              }),
              (i.compressWorker = function (d) {
                return new p("Deflate", d);
              }),
              (i.uncompressWorker = function () {
                return new p("Inflate", {});
              }));
          },
          { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 },
        ],
        8: [
          function (e, n, i) {
            function a(u, f) {
              var h,
                b = "";
              for (h = 0; h < f; h++) ((b += String.fromCharCode(255 & u)), (u >>>= 8));
              return b;
            }
            function o(u, f, h, b, g, _) {
              var y,
                k,
                P = u.file,
                D = u.compression,
                T = _ !== c.utf8encode,
                S = s.transformTo("string", _(P.name)),
                O = s.transformTo("string", c.utf8encode(P.name)),
                V = P.comment,
                at = s.transformTo("string", _(V)),
                E = s.transformTo("string", c.utf8encode(V)),
                B = O.length !== P.name.length,
                w = E.length !== V.length,
                U = "",
                ft = "",
                J = "",
                rt = P.dir,
                Y = P.date,
                dt = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
              (f && !h) ||
                ((dt.crc32 = u.crc32),
                (dt.compressedSize = u.compressedSize),
                (dt.uncompressedSize = u.uncompressedSize));
              var R = 0;
              (f && (R |= 8), T || (!B && !w) || (R |= 2048));
              var I = 0,
                ut = 0;
              (rt && (I |= 16),
                g === "UNIX"
                  ? ((ut = 798),
                    (I |= (function (et, zt) {
                      var te = et;
                      return (et || (te = zt ? 16893 : 33204), (65535 & te) << 16);
                    })(P.unixPermissions, rt)))
                  : ((ut = 20),
                    (I |= (function (et) {
                      return 63 & (et || 0);
                    })(P.dosPermissions))),
                (y = Y.getUTCHours()),
                (y <<= 6),
                (y |= Y.getUTCMinutes()),
                (y <<= 5),
                (y |= Y.getUTCSeconds() / 2),
                (k = Y.getUTCFullYear() - 1980),
                (k <<= 4),
                (k |= Y.getUTCMonth() + 1),
                (k <<= 5),
                (k |= Y.getUTCDate()),
                B && ((ft = a(1, 1) + a(p(S), 4) + O), (U += "up" + a(ft.length, 2) + ft)),
                w && ((J = a(1, 1) + a(p(at), 4) + E), (U += "uc" + a(J.length, 2) + J)));
              var st = "";
              return (
                (st += `
\0`),
                (st += a(R, 2)),
                (st += D.magic),
                (st += a(y, 2)),
                (st += a(k, 2)),
                (st += a(dt.crc32, 4)),
                (st += a(dt.compressedSize, 4)),
                (st += a(dt.uncompressedSize, 4)),
                (st += a(S.length, 2)),
                (st += a(U.length, 2)),
                {
                  fileRecord: d.LOCAL_FILE_HEADER + st + S + U,
                  dirRecord:
                    d.CENTRAL_FILE_HEADER +
                    a(ut, 2) +
                    st +
                    a(at.length, 2) +
                    "\0\0\0\0" +
                    a(I, 4) +
                    a(b, 4) +
                    S +
                    U +
                    at,
                }
              );
            }
            var s = e("../utils"),
              l = e("../stream/GenericWorker"),
              c = e("../utf8"),
              p = e("../crc32"),
              d = e("../signature");
            function v(u, f, h, b) {
              (l.call(this, "ZipFileWorker"),
                (this.bytesWritten = 0),
                (this.zipComment = f),
                (this.zipPlatform = h),
                (this.encodeFileName = b),
                (this.streamFiles = u),
                (this.accumulate = !1),
                (this.contentBuffer = []),
                (this.dirRecords = []),
                (this.currentSourceOffset = 0),
                (this.entriesCount = 0),
                (this.currentFile = null),
                (this._sources = []));
            }
            (s.inherits(v, l),
              (v.prototype.push = function (u) {
                var f = u.meta.percent || 0,
                  h = this.entriesCount,
                  b = this._sources.length;
                this.accumulate
                  ? this.contentBuffer.push(u)
                  : ((this.bytesWritten += u.data.length),
                    l.prototype.push.call(this, {
                      data: u.data,
                      meta: {
                        currentFile: this.currentFile,
                        percent: h ? (f + 100 * (h - b - 1)) / h : 100,
                      },
                    }));
              }),
              (v.prototype.openedSource = function (u) {
                ((this.currentSourceOffset = this.bytesWritten), (this.currentFile = u.file.name));
                var f = this.streamFiles && !u.file.dir;
                if (f) {
                  var h = o(
                    u,
                    f,
                    !1,
                    this.currentSourceOffset,
                    this.zipPlatform,
                    this.encodeFileName,
                  );
                  this.push({ data: h.fileRecord, meta: { percent: 0 } });
                } else this.accumulate = !0;
              }),
              (v.prototype.closedSource = function (u) {
                this.accumulate = !1;
                var f = this.streamFiles && !u.file.dir,
                  h = o(u, f, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
                if ((this.dirRecords.push(h.dirRecord), f))
                  this.push({
                    data: (function (b) {
                      return (
                        d.DATA_DESCRIPTOR +
                        a(b.crc32, 4) +
                        a(b.compressedSize, 4) +
                        a(b.uncompressedSize, 4)
                      );
                    })(u),
                    meta: { percent: 100 },
                  });
                else
                  for (
                    this.push({ data: h.fileRecord, meta: { percent: 0 } });
                    this.contentBuffer.length;

                  )
                    this.push(this.contentBuffer.shift());
                this.currentFile = null;
              }),
              (v.prototype.flush = function () {
                for (var u = this.bytesWritten, f = 0; f < this.dirRecords.length; f++)
                  this.push({ data: this.dirRecords[f], meta: { percent: 100 } });
                var h = this.bytesWritten - u,
                  b = (function (g, _, y, k, P) {
                    var D = s.transformTo("string", P(k));
                    return (
                      d.CENTRAL_DIRECTORY_END +
                      "\0\0\0\0" +
                      a(g, 2) +
                      a(g, 2) +
                      a(_, 4) +
                      a(y, 4) +
                      a(D.length, 2) +
                      D
                    );
                  })(this.dirRecords.length, h, u, this.zipComment, this.encodeFileName);
                this.push({ data: b, meta: { percent: 100 } });
              }),
              (v.prototype.prepareNextSource = function () {
                ((this.previous = this._sources.shift()),
                  this.openedSource(this.previous.streamInfo),
                  this.isPaused ? this.previous.pause() : this.previous.resume());
              }),
              (v.prototype.registerPrevious = function (u) {
                this._sources.push(u);
                var f = this;
                return (
                  u.on("data", function (h) {
                    f.processChunk(h);
                  }),
                  u.on("end", function () {
                    (f.closedSource(f.previous.streamInfo),
                      f._sources.length ? f.prepareNextSource() : f.end());
                  }),
                  u.on("error", function (h) {
                    f.error(h);
                  }),
                  this
                );
              }),
              (v.prototype.resume = function () {
                return (
                  !!l.prototype.resume.call(this) &&
                  (!this.previous && this._sources.length
                    ? (this.prepareNextSource(), !0)
                    : this.previous || this._sources.length || this.generatedError
                      ? void 0
                      : (this.end(), !0))
                );
              }),
              (v.prototype.error = function (u) {
                var f = this._sources;
                if (!l.prototype.error.call(this, u)) return !1;
                for (var h = 0; h < f.length; h++)
                  try {
                    f[h].error(u);
                  } catch {}
                return !0;
              }),
              (v.prototype.lock = function () {
                l.prototype.lock.call(this);
                for (var u = this._sources, f = 0; f < u.length; f++) u[f].lock();
              }),
              (n.exports = v));
          },
          {
            "../crc32": 4,
            "../signature": 23,
            "../stream/GenericWorker": 28,
            "../utf8": 31,
            "../utils": 32,
          },
        ],
        9: [
          function (e, n, i) {
            var a = e("../compressions"),
              o = e("./ZipFileWorker");
            i.generateWorker = function (s, l, c) {
              var p = new o(l.streamFiles, c, l.platform, l.encodeFileName),
                d = 0;
              try {
                (s.forEach(function (v, u) {
                  d++;
                  var f = (function (_, y) {
                      var k = _ || y,
                        P = a[k];
                      if (!P) throw new Error(k + " is not a valid compression method !");
                      return P;
                    })(u.options.compression, l.compression),
                    h = u.options.compressionOptions || l.compressionOptions || {},
                    b = u.dir,
                    g = u.date;
                  u._compressWorker(f, h)
                    .withStreamInfo("file", {
                      name: v,
                      dir: b,
                      date: g,
                      comment: u.comment || "",
                      unixPermissions: u.unixPermissions,
                      dosPermissions: u.dosPermissions,
                    })
                    .pipe(p);
                }),
                  (p.entriesCount = d));
              } catch (v) {
                p.error(v);
              }
              return p;
            };
          },
          { "../compressions": 3, "./ZipFileWorker": 8 },
        ],
        10: [
          function (e, n, i) {
            function a() {
              if (!(this instanceof a)) return new a();
              if (arguments.length)
                throw new Error(
                  "The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.",
                );
              ((this.files = Object.create(null)),
                (this.comment = null),
                (this.root = ""),
                (this.clone = function () {
                  var o = new a();
                  for (var s in this) typeof this[s] != "function" && (o[s] = this[s]);
                  return o;
                }));
            }
            (((a.prototype = e("./object")).loadAsync = e("./load")),
              (a.support = e("./support")),
              (a.defaults = e("./defaults")),
              (a.version = "3.10.1"),
              (a.loadAsync = function (o, s) {
                return new a().loadAsync(o, s);
              }),
              (a.external = e("./external")),
              (n.exports = a));
          },
          { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 },
        ],
        11: [
          function (e, n, i) {
            var a = e("./utils"),
              o = e("./external"),
              s = e("./utf8"),
              l = e("./zipEntries"),
              c = e("./stream/Crc32Probe"),
              p = e("./nodejsUtils");
            function d(v) {
              return new o.Promise(function (u, f) {
                var h = v.decompressed.getContentWorker().pipe(new c());
                h.on("error", function (b) {
                  f(b);
                })
                  .on("end", function () {
                    h.streamInfo.crc32 !== v.decompressed.crc32
                      ? f(new Error("Corrupted zip : CRC32 mismatch"))
                      : u();
                  })
                  .resume();
              });
            }
            n.exports = function (v, u) {
              var f = this;
              return (
                (u = a.extend(u || {}, {
                  base64: !1,
                  checkCRC32: !1,
                  optimizedBinaryString: !1,
                  createFolders: !1,
                  decodeFileName: s.utf8decode,
                })),
                p.isNode && p.isStream(v)
                  ? o.Promise.reject(
                      new Error("JSZip can't accept a stream when loading a zip file."),
                    )
                  : a
                      .prepareContent(
                        "the loaded zip file",
                        v,
                        !0,
                        u.optimizedBinaryString,
                        u.base64,
                      )
                      .then(function (h) {
                        var b = new l(u);
                        return (b.load(h), b);
                      })
                      .then(function (h) {
                        var b = [o.Promise.resolve(h)],
                          g = h.files;
                        if (u.checkCRC32) for (var _ = 0; _ < g.length; _++) b.push(d(g[_]));
                        return o.Promise.all(b);
                      })
                      .then(function (h) {
                        for (var b = h.shift(), g = b.files, _ = 0; _ < g.length; _++) {
                          var y = g[_],
                            k = y.fileNameStr,
                            P = a.resolve(y.fileNameStr);
                          (f.file(P, y.decompressed, {
                            binary: !0,
                            optimizedBinaryString: !0,
                            date: y.date,
                            dir: y.dir,
                            comment: y.fileCommentStr.length ? y.fileCommentStr : null,
                            unixPermissions: y.unixPermissions,
                            dosPermissions: y.dosPermissions,
                            createFolders: u.createFolders,
                          }),
                            y.dir || (f.file(P).unsafeOriginalName = k));
                        }
                        return (b.zipComment.length && (f.comment = b.zipComment), f);
                      })
              );
            };
          },
          {
            "./external": 6,
            "./nodejsUtils": 14,
            "./stream/Crc32Probe": 25,
            "./utf8": 31,
            "./utils": 32,
            "./zipEntries": 33,
          },
        ],
        12: [
          function (e, n, i) {
            var a = e("../utils"),
              o = e("../stream/GenericWorker");
            function s(l, c) {
              (o.call(this, "Nodejs stream input adapter for " + l),
                (this._upstreamEnded = !1),
                this._bindStream(c));
            }
            (a.inherits(s, o),
              (s.prototype._bindStream = function (l) {
                var c = this;
                ((this._stream = l).pause(),
                  l
                    .on("data", function (p) {
                      c.push({ data: p, meta: { percent: 0 } });
                    })
                    .on("error", function (p) {
                      c.isPaused ? (this.generatedError = p) : c.error(p);
                    })
                    .on("end", function () {
                      c.isPaused ? (c._upstreamEnded = !0) : c.end();
                    }));
              }),
              (s.prototype.pause = function () {
                return !!o.prototype.pause.call(this) && (this._stream.pause(), !0);
              }),
              (s.prototype.resume = function () {
                return (
                  !!o.prototype.resume.call(this) &&
                  (this._upstreamEnded ? this.end() : this._stream.resume(), !0)
                );
              }),
              (n.exports = s));
          },
          { "../stream/GenericWorker": 28, "../utils": 32 },
        ],
        13: [
          function (e, n, i) {
            var a = e("readable-stream").Readable;
            function o(s, l, c) {
              (a.call(this, l), (this._helper = s));
              var p = this;
              s.on("data", function (d, v) {
                (p.push(d) || p._helper.pause(), c && c(v));
              })
                .on("error", function (d) {
                  p.emit("error", d);
                })
                .on("end", function () {
                  p.push(null);
                });
            }
            (e("../utils").inherits(o, a),
              (o.prototype._read = function () {
                this._helper.resume();
              }),
              (n.exports = o));
          },
          { "../utils": 32, "readable-stream": 16 },
        ],
        14: [
          function (e, n, i) {
            n.exports = {
              isNode: typeof Buffer < "u",
              newBufferFrom: function (a, o) {
                if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(a, o);
                if (typeof a == "number")
                  throw new Error('The "data" argument must not be a number');
                return new Buffer(a, o);
              },
              allocBuffer: function (a) {
                if (Buffer.alloc) return Buffer.alloc(a);
                var o = new Buffer(a);
                return (o.fill(0), o);
              },
              isBuffer: function (a) {
                return Buffer.isBuffer(a);
              },
              isStream: function (a) {
                return (
                  a &&
                  typeof a.on == "function" &&
                  typeof a.pause == "function" &&
                  typeof a.resume == "function"
                );
              },
            };
          },
          {},
        ],
        15: [
          function (e, n, i) {
            function a(P, D, T) {
              var S,
                O = s.getTypeOf(D),
                V = s.extend(T || {}, p);
              ((V.date = V.date || new Date()),
                V.compression !== null && (V.compression = V.compression.toUpperCase()),
                typeof V.unixPermissions == "string" &&
                  (V.unixPermissions = parseInt(V.unixPermissions, 8)),
                V.unixPermissions && 16384 & V.unixPermissions && (V.dir = !0),
                V.dosPermissions && 16 & V.dosPermissions && (V.dir = !0),
                V.dir && (P = g(P)),
                V.createFolders && (S = b(P)) && _.call(this, S, !0));
              var at = O === "string" && V.binary === !1 && V.base64 === !1;
              ((T && T.binary !== void 0) || (V.binary = !at),
                ((D instanceof d && D.uncompressedSize === 0) || V.dir || !D || D.length === 0) &&
                  ((V.base64 = !1),
                  (V.binary = !0),
                  (D = ""),
                  (V.compression = "STORE"),
                  (O = "string")));
              var E = null;
              E =
                D instanceof d || D instanceof l
                  ? D
                  : f.isNode && f.isStream(D)
                    ? new h(P, D)
                    : s.prepareContent(P, D, V.binary, V.optimizedBinaryString, V.base64);
              var B = new v(P, E, V);
              this.files[P] = B;
            }
            var o = e("./utf8"),
              s = e("./utils"),
              l = e("./stream/GenericWorker"),
              c = e("./stream/StreamHelper"),
              p = e("./defaults"),
              d = e("./compressedObject"),
              v = e("./zipObject"),
              u = e("./generate"),
              f = e("./nodejsUtils"),
              h = e("./nodejs/NodejsStreamInputAdapter"),
              b = function (P) {
                P.slice(-1) === "/" && (P = P.substring(0, P.length - 1));
                var D = P.lastIndexOf("/");
                return 0 < D ? P.substring(0, D) : "";
              },
              g = function (P) {
                return (P.slice(-1) !== "/" && (P += "/"), P);
              },
              _ = function (P, D) {
                return (
                  (D = D !== void 0 ? D : p.createFolders),
                  (P = g(P)),
                  this.files[P] || a.call(this, P, null, { dir: !0, createFolders: D }),
                  this.files[P]
                );
              };
            function y(P) {
              return Object.prototype.toString.call(P) === "[object RegExp]";
            }
            var k = {
              load: function () {
                throw new Error(
                  "This method has been removed in JSZip 3.0, please check the upgrade guide.",
                );
              },
              forEach: function (P) {
                var D, T, S;
                for (D in this.files)
                  ((S = this.files[D]),
                    (T = D.slice(this.root.length, D.length)) &&
                      D.slice(0, this.root.length) === this.root &&
                      P(T, S));
              },
              filter: function (P) {
                var D = [];
                return (
                  this.forEach(function (T, S) {
                    P(T, S) && D.push(S);
                  }),
                  D
                );
              },
              file: function (P, D, T) {
                if (arguments.length !== 1)
                  return ((P = this.root + P), a.call(this, P, D, T), this);
                if (y(P)) {
                  var S = P;
                  return this.filter(function (V, at) {
                    return !at.dir && S.test(V);
                  });
                }
                var O = this.files[this.root + P];
                return O && !O.dir ? O : null;
              },
              folder: function (P) {
                if (!P) return this;
                if (y(P))
                  return this.filter(function (O, V) {
                    return V.dir && P.test(O);
                  });
                var D = this.root + P,
                  T = _.call(this, D),
                  S = this.clone();
                return ((S.root = T.name), S);
              },
              remove: function (P) {
                P = this.root + P;
                var D = this.files[P];
                if ((D || (P.slice(-1) !== "/" && (P += "/"), (D = this.files[P])), D && !D.dir))
                  delete this.files[P];
                else
                  for (
                    var T = this.filter(function (O, V) {
                        return V.name.slice(0, P.length) === P;
                      }),
                      S = 0;
                    S < T.length;
                    S++
                  )
                    delete this.files[T[S].name];
                return this;
              },
              generate: function () {
                throw new Error(
                  "This method has been removed in JSZip 3.0, please check the upgrade guide.",
                );
              },
              generateInternalStream: function (P) {
                var D,
                  T = {};
                try {
                  if (
                    (((T = s.extend(P || {}, {
                      streamFiles: !1,
                      compression: "STORE",
                      compressionOptions: null,
                      type: "",
                      platform: "DOS",
                      comment: null,
                      mimeType: "application/zip",
                      encodeFileName: o.utf8encode,
                    })).type = T.type.toLowerCase()),
                    (T.compression = T.compression.toUpperCase()),
                    T.type === "binarystring" && (T.type = "string"),
                    !T.type)
                  )
                    throw new Error("No output type specified.");
                  (s.checkSupport(T.type),
                    (T.platform !== "darwin" &&
                      T.platform !== "freebsd" &&
                      T.platform !== "linux" &&
                      T.platform !== "sunos") ||
                      (T.platform = "UNIX"),
                    T.platform === "win32" && (T.platform = "DOS"));
                  var S = T.comment || this.comment || "";
                  D = u.generateWorker(this, T, S);
                } catch (O) {
                  (D = new l("error")).error(O);
                }
                return new c(D, T.type || "string", T.mimeType);
              },
              generateAsync: function (P, D) {
                return this.generateInternalStream(P).accumulate(D);
              },
              generateNodeStream: function (P, D) {
                return (
                  (P = P || {}).type || (P.type = "nodebuffer"),
                  this.generateInternalStream(P).toNodejsStream(D)
                );
              },
            };
            n.exports = k;
          },
          {
            "./compressedObject": 2,
            "./defaults": 5,
            "./generate": 9,
            "./nodejs/NodejsStreamInputAdapter": 12,
            "./nodejsUtils": 14,
            "./stream/GenericWorker": 28,
            "./stream/StreamHelper": 29,
            "./utf8": 31,
            "./utils": 32,
            "./zipObject": 35,
          },
        ],
        16: [
          function (e, n, i) {
            n.exports = e("stream");
          },
          { stream: void 0 },
        ],
        17: [
          function (e, n, i) {
            var a = e("./DataReader");
            function o(s) {
              a.call(this, s);
              for (var l = 0; l < this.data.length; l++) s[l] = 255 & s[l];
            }
            (e("../utils").inherits(o, a),
              (o.prototype.byteAt = function (s) {
                return this.data[this.zero + s];
              }),
              (o.prototype.lastIndexOfSignature = function (s) {
                for (
                  var l = s.charCodeAt(0),
                    c = s.charCodeAt(1),
                    p = s.charCodeAt(2),
                    d = s.charCodeAt(3),
                    v = this.length - 4;
                  0 <= v;
                  --v
                )
                  if (
                    this.data[v] === l &&
                    this.data[v + 1] === c &&
                    this.data[v + 2] === p &&
                    this.data[v + 3] === d
                  )
                    return v - this.zero;
                return -1;
              }),
              (o.prototype.readAndCheckSignature = function (s) {
                var l = s.charCodeAt(0),
                  c = s.charCodeAt(1),
                  p = s.charCodeAt(2),
                  d = s.charCodeAt(3),
                  v = this.readData(4);
                return l === v[0] && c === v[1] && p === v[2] && d === v[3];
              }),
              (o.prototype.readData = function (s) {
                if ((this.checkOffset(s), s === 0)) return [];
                var l = this.data.slice(this.zero + this.index, this.zero + this.index + s);
                return ((this.index += s), l);
              }),
              (n.exports = o));
          },
          { "../utils": 32, "./DataReader": 18 },
        ],
        18: [
          function (e, n, i) {
            var a = e("../utils");
            function o(s) {
              ((this.data = s), (this.length = s.length), (this.index = 0), (this.zero = 0));
            }
            ((o.prototype = {
              checkOffset: function (s) {
                this.checkIndex(this.index + s);
              },
              checkIndex: function (s) {
                if (this.length < this.zero + s || s < 0)
                  throw new Error(
                    "End of data reached (data length = " +
                      this.length +
                      ", asked index = " +
                      s +
                      "). Corrupted zip ?",
                  );
              },
              setIndex: function (s) {
                (this.checkIndex(s), (this.index = s));
              },
              skip: function (s) {
                this.setIndex(this.index + s);
              },
              byteAt: function () {},
              readInt: function (s) {
                var l,
                  c = 0;
                for (this.checkOffset(s), l = this.index + s - 1; l >= this.index; l--)
                  c = (c << 8) + this.byteAt(l);
                return ((this.index += s), c);
              },
              readString: function (s) {
                return a.transformTo("string", this.readData(s));
              },
              readData: function () {},
              lastIndexOfSignature: function () {},
              readAndCheckSignature: function () {},
              readDate: function () {
                var s = this.readInt(4);
                return new Date(
                  Date.UTC(
                    1980 + ((s >> 25) & 127),
                    ((s >> 21) & 15) - 1,
                    (s >> 16) & 31,
                    (s >> 11) & 31,
                    (s >> 5) & 63,
                    (31 & s) << 1,
                  ),
                );
              },
            }),
              (n.exports = o));
          },
          { "../utils": 32 },
        ],
        19: [
          function (e, n, i) {
            var a = e("./Uint8ArrayReader");
            function o(s) {
              a.call(this, s);
            }
            (e("../utils").inherits(o, a),
              (o.prototype.readData = function (s) {
                this.checkOffset(s);
                var l = this.data.slice(this.zero + this.index, this.zero + this.index + s);
                return ((this.index += s), l);
              }),
              (n.exports = o));
          },
          { "../utils": 32, "./Uint8ArrayReader": 21 },
        ],
        20: [
          function (e, n, i) {
            var a = e("./DataReader");
            function o(s) {
              a.call(this, s);
            }
            (e("../utils").inherits(o, a),
              (o.prototype.byteAt = function (s) {
                return this.data.charCodeAt(this.zero + s);
              }),
              (o.prototype.lastIndexOfSignature = function (s) {
                return this.data.lastIndexOf(s) - this.zero;
              }),
              (o.prototype.readAndCheckSignature = function (s) {
                return s === this.readData(4);
              }),
              (o.prototype.readData = function (s) {
                this.checkOffset(s);
                var l = this.data.slice(this.zero + this.index, this.zero + this.index + s);
                return ((this.index += s), l);
              }),
              (n.exports = o));
          },
          { "../utils": 32, "./DataReader": 18 },
        ],
        21: [
          function (e, n, i) {
            var a = e("./ArrayReader");
            function o(s) {
              a.call(this, s);
            }
            (e("../utils").inherits(o, a),
              (o.prototype.readData = function (s) {
                if ((this.checkOffset(s), s === 0)) return new Uint8Array(0);
                var l = this.data.subarray(this.zero + this.index, this.zero + this.index + s);
                return ((this.index += s), l);
              }),
              (n.exports = o));
          },
          { "../utils": 32, "./ArrayReader": 17 },
        ],
        22: [
          function (e, n, i) {
            var a = e("../utils"),
              o = e("../support"),
              s = e("./ArrayReader"),
              l = e("./StringReader"),
              c = e("./NodeBufferReader"),
              p = e("./Uint8ArrayReader");
            n.exports = function (d) {
              var v = a.getTypeOf(d);
              return (
                a.checkSupport(v),
                v !== "string" || o.uint8array
                  ? v === "nodebuffer"
                    ? new c(d)
                    : o.uint8array
                      ? new p(a.transformTo("uint8array", d))
                      : new s(a.transformTo("array", d))
                  : new l(d)
              );
            };
          },
          {
            "../support": 30,
            "../utils": 32,
            "./ArrayReader": 17,
            "./NodeBufferReader": 19,
            "./StringReader": 20,
            "./Uint8ArrayReader": 21,
          },
        ],
        23: [
          function (e, n, i) {
            ((i.LOCAL_FILE_HEADER = "PK"),
              (i.CENTRAL_FILE_HEADER = "PK"),
              (i.CENTRAL_DIRECTORY_END = "PK"),
              (i.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07"),
              (i.ZIP64_CENTRAL_DIRECTORY_END = "PK"),
              (i.DATA_DESCRIPTOR = "PK\x07\b"));
          },
          {},
        ],
        24: [
          function (e, n, i) {
            var a = e("./GenericWorker"),
              o = e("../utils");
            function s(l) {
              (a.call(this, "ConvertWorker to " + l), (this.destType = l));
            }
            (o.inherits(s, a),
              (s.prototype.processChunk = function (l) {
                this.push({ data: o.transformTo(this.destType, l.data), meta: l.meta });
              }),
              (n.exports = s));
          },
          { "../utils": 32, "./GenericWorker": 28 },
        ],
        25: [
          function (e, n, i) {
            var a = e("./GenericWorker"),
              o = e("../crc32");
            function s() {
              (a.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0));
            }
            (e("../utils").inherits(s, a),
              (s.prototype.processChunk = function (l) {
                ((this.streamInfo.crc32 = o(l.data, this.streamInfo.crc32 || 0)), this.push(l));
              }),
              (n.exports = s));
          },
          { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 },
        ],
        26: [
          function (e, n, i) {
            var a = e("../utils"),
              o = e("./GenericWorker");
            function s(l) {
              (o.call(this, "DataLengthProbe for " + l),
                (this.propName = l),
                this.withStreamInfo(l, 0));
            }
            (a.inherits(s, o),
              (s.prototype.processChunk = function (l) {
                if (l) {
                  var c = this.streamInfo[this.propName] || 0;
                  this.streamInfo[this.propName] = c + l.data.length;
                }
                o.prototype.processChunk.call(this, l);
              }),
              (n.exports = s));
          },
          { "../utils": 32, "./GenericWorker": 28 },
        ],
        27: [
          function (e, n, i) {
            var a = e("../utils"),
              o = e("./GenericWorker");
            function s(l) {
              o.call(this, "DataWorker");
              var c = this;
              ((this.dataIsReady = !1),
                (this.index = 0),
                (this.max = 0),
                (this.data = null),
                (this.type = ""),
                (this._tickScheduled = !1),
                l.then(
                  function (p) {
                    ((c.dataIsReady = !0),
                      (c.data = p),
                      (c.max = (p && p.length) || 0),
                      (c.type = a.getTypeOf(p)),
                      c.isPaused || c._tickAndRepeat());
                  },
                  function (p) {
                    c.error(p);
                  },
                ));
            }
            (a.inherits(s, o),
              (s.prototype.cleanUp = function () {
                (o.prototype.cleanUp.call(this), (this.data = null));
              }),
              (s.prototype.resume = function () {
                return (
                  !!o.prototype.resume.call(this) &&
                  (!this._tickScheduled &&
                    this.dataIsReady &&
                    ((this._tickScheduled = !0), a.delay(this._tickAndRepeat, [], this)),
                  !0)
                );
              }),
              (s.prototype._tickAndRepeat = function () {
                ((this._tickScheduled = !1),
                  this.isPaused ||
                    this.isFinished ||
                    (this._tick(),
                    this.isFinished ||
                      (a.delay(this._tickAndRepeat, [], this), (this._tickScheduled = !0))));
              }),
              (s.prototype._tick = function () {
                if (this.isPaused || this.isFinished) return !1;
                var l = null,
                  c = Math.min(this.max, this.index + 16384);
                if (this.index >= this.max) return this.end();
                switch (this.type) {
                  case "string":
                    l = this.data.substring(this.index, c);
                    break;
                  case "uint8array":
                    l = this.data.subarray(this.index, c);
                    break;
                  case "array":
                  case "nodebuffer":
                    l = this.data.slice(this.index, c);
                }
                return (
                  (this.index = c),
                  this.push({
                    data: l,
                    meta: { percent: this.max ? (this.index / this.max) * 100 : 0 },
                  })
                );
              }),
              (n.exports = s));
          },
          { "../utils": 32, "./GenericWorker": 28 },
        ],
        28: [
          function (e, n, i) {
            function a(o) {
              ((this.name = o || "default"),
                (this.streamInfo = {}),
                (this.generatedError = null),
                (this.extraStreamInfo = {}),
                (this.isPaused = !0),
                (this.isFinished = !1),
                (this.isLocked = !1),
                (this._listeners = { data: [], end: [], error: [] }),
                (this.previous = null));
            }
            ((a.prototype = {
              push: function (o) {
                this.emit("data", o);
              },
              end: function () {
                if (this.isFinished) return !1;
                this.flush();
                try {
                  (this.emit("end"), this.cleanUp(), (this.isFinished = !0));
                } catch (o) {
                  this.emit("error", o);
                }
                return !0;
              },
              error: function (o) {
                return (
                  !this.isFinished &&
                  (this.isPaused
                    ? (this.generatedError = o)
                    : ((this.isFinished = !0),
                      this.emit("error", o),
                      this.previous && this.previous.error(o),
                      this.cleanUp()),
                  !0)
                );
              },
              on: function (o, s) {
                return (this._listeners[o].push(s), this);
              },
              cleanUp: function () {
                ((this.streamInfo = this.generatedError = this.extraStreamInfo = null),
                  (this._listeners = []));
              },
              emit: function (o, s) {
                if (this._listeners[o])
                  for (var l = 0; l < this._listeners[o].length; l++)
                    this._listeners[o][l].call(this, s);
              },
              pipe: function (o) {
                return o.registerPrevious(this);
              },
              registerPrevious: function (o) {
                if (this.isLocked)
                  throw new Error("The stream '" + this + "' has already been used.");
                ((this.streamInfo = o.streamInfo), this.mergeStreamInfo(), (this.previous = o));
                var s = this;
                return (
                  o.on("data", function (l) {
                    s.processChunk(l);
                  }),
                  o.on("end", function () {
                    s.end();
                  }),
                  o.on("error", function (l) {
                    s.error(l);
                  }),
                  this
                );
              },
              pause: function () {
                return (
                  !this.isPaused &&
                  !this.isFinished &&
                  ((this.isPaused = !0), this.previous && this.previous.pause(), !0)
                );
              },
              resume: function () {
                if (!this.isPaused || this.isFinished) return !1;
                var o = (this.isPaused = !1);
                return (
                  this.generatedError && (this.error(this.generatedError), (o = !0)),
                  this.previous && this.previous.resume(),
                  !o
                );
              },
              flush: function () {},
              processChunk: function (o) {
                this.push(o);
              },
              withStreamInfo: function (o, s) {
                return ((this.extraStreamInfo[o] = s), this.mergeStreamInfo(), this);
              },
              mergeStreamInfo: function () {
                for (var o in this.extraStreamInfo)
                  Object.prototype.hasOwnProperty.call(this.extraStreamInfo, o) &&
                    (this.streamInfo[o] = this.extraStreamInfo[o]);
              },
              lock: function () {
                if (this.isLocked)
                  throw new Error("The stream '" + this + "' has already been used.");
                ((this.isLocked = !0), this.previous && this.previous.lock());
              },
              toString: function () {
                var o = "Worker " + this.name;
                return this.previous ? this.previous + " -> " + o : o;
              },
            }),
              (n.exports = a));
          },
          {},
        ],
        29: [
          function (e, n, i) {
            var a = e("../utils"),
              o = e("./ConvertWorker"),
              s = e("./GenericWorker"),
              l = e("../base64"),
              c = e("../support"),
              p = e("../external"),
              d = null;
            if (c.nodestream)
              try {
                d = e("../nodejs/NodejsStreamOutputAdapter");
              } catch {}
            function v(f, h) {
              return new p.Promise(function (b, g) {
                var _ = [],
                  y = f._internalType,
                  k = f._outputType,
                  P = f._mimeType;
                f.on("data", function (D, T) {
                  (_.push(D), h && h(T));
                })
                  .on("error", function (D) {
                    ((_ = []), g(D));
                  })
                  .on("end", function () {
                    try {
                      var D = (function (T, S, O) {
                        switch (T) {
                          case "blob":
                            return a.newBlob(a.transformTo("arraybuffer", S), O);
                          case "base64":
                            return l.encode(S);
                          default:
                            return a.transformTo(T, S);
                        }
                      })(
                        k,
                        (function (T, S) {
                          var O,
                            V = 0,
                            at = null,
                            E = 0;
                          for (O = 0; O < S.length; O++) E += S[O].length;
                          switch (T) {
                            case "string":
                              return S.join("");
                            case "array":
                              return Array.prototype.concat.apply([], S);
                            case "uint8array":
                              for (at = new Uint8Array(E), O = 0; O < S.length; O++)
                                (at.set(S[O], V), (V += S[O].length));
                              return at;
                            case "nodebuffer":
                              return Buffer.concat(S);
                            default:
                              throw new Error("concat : unsupported type '" + T + "'");
                          }
                        })(y, _),
                        P,
                      );
                      b(D);
                    } catch (T) {
                      g(T);
                    }
                    _ = [];
                  })
                  .resume();
              });
            }
            function u(f, h, b) {
              var g = h;
              switch (h) {
                case "blob":
                case "arraybuffer":
                  g = "uint8array";
                  break;
                case "base64":
                  g = "string";
              }
              try {
                ((this._internalType = g),
                  (this._outputType = h),
                  (this._mimeType = b),
                  a.checkSupport(g),
                  (this._worker = f.pipe(new o(g))),
                  f.lock());
              } catch (_) {
                ((this._worker = new s("error")), this._worker.error(_));
              }
            }
            ((u.prototype = {
              accumulate: function (f) {
                return v(this, f);
              },
              on: function (f, h) {
                var b = this;
                return (
                  f === "data"
                    ? this._worker.on(f, function (g) {
                        h.call(b, g.data, g.meta);
                      })
                    : this._worker.on(f, function () {
                        a.delay(h, arguments, b);
                      }),
                  this
                );
              },
              resume: function () {
                return (a.delay(this._worker.resume, [], this._worker), this);
              },
              pause: function () {
                return (this._worker.pause(), this);
              },
              toNodejsStream: function (f) {
                if ((a.checkSupport("nodestream"), this._outputType !== "nodebuffer"))
                  throw new Error(this._outputType + " is not supported by this method");
                return new d(this, { objectMode: this._outputType !== "nodebuffer" }, f);
              },
            }),
              (n.exports = u));
          },
          {
            "../base64": 1,
            "../external": 6,
            "../nodejs/NodejsStreamOutputAdapter": 13,
            "../support": 30,
            "../utils": 32,
            "./ConvertWorker": 24,
            "./GenericWorker": 28,
          },
        ],
        30: [
          function (e, n, i) {
            if (
              ((i.base64 = !0),
              (i.array = !0),
              (i.string = !0),
              (i.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u"),
              (i.nodebuffer = typeof Buffer < "u"),
              (i.uint8array = typeof Uint8Array < "u"),
              typeof ArrayBuffer > "u")
            )
              i.blob = !1;
            else {
              var a = new ArrayBuffer(0);
              try {
                i.blob = new Blob([a], { type: "application/zip" }).size === 0;
              } catch {
                try {
                  var o = new (self.BlobBuilder ||
                    self.WebKitBlobBuilder ||
                    self.MozBlobBuilder ||
                    self.MSBlobBuilder)();
                  (o.append(a), (i.blob = o.getBlob("application/zip").size === 0));
                } catch {
                  i.blob = !1;
                }
              }
            }
            try {
              i.nodestream = !!e("readable-stream").Readable;
            } catch {
              i.nodestream = !1;
            }
          },
          { "readable-stream": 16 },
        ],
        31: [
          function (e, n, i) {
            for (
              var a = e("./utils"),
                o = e("./support"),
                s = e("./nodejsUtils"),
                l = e("./stream/GenericWorker"),
                c = new Array(256),
                p = 0;
              p < 256;
              p++
            )
              c[p] = 252 <= p ? 6 : 248 <= p ? 5 : 240 <= p ? 4 : 224 <= p ? 3 : 192 <= p ? 2 : 1;
            c[254] = c[254] = 1;
            function d() {
              (l.call(this, "utf-8 decode"), (this.leftOver = null));
            }
            function v() {
              l.call(this, "utf-8 encode");
            }
            ((i.utf8encode = function (u) {
              return o.nodebuffer
                ? s.newBufferFrom(u, "utf-8")
                : (function (f) {
                    var h,
                      b,
                      g,
                      _,
                      y,
                      k = f.length,
                      P = 0;
                    for (_ = 0; _ < k; _++)
                      ((64512 & (b = f.charCodeAt(_))) == 55296 &&
                        _ + 1 < k &&
                        (64512 & (g = f.charCodeAt(_ + 1))) == 56320 &&
                        ((b = 65536 + ((b - 55296) << 10) + (g - 56320)), _++),
                        (P += b < 128 ? 1 : b < 2048 ? 2 : b < 65536 ? 3 : 4));
                    for (h = o.uint8array ? new Uint8Array(P) : new Array(P), _ = y = 0; y < P; _++)
                      ((64512 & (b = f.charCodeAt(_))) == 55296 &&
                        _ + 1 < k &&
                        (64512 & (g = f.charCodeAt(_ + 1))) == 56320 &&
                        ((b = 65536 + ((b - 55296) << 10) + (g - 56320)), _++),
                        b < 128
                          ? (h[y++] = b)
                          : (b < 2048
                              ? (h[y++] = 192 | (b >>> 6))
                              : (b < 65536
                                  ? (h[y++] = 224 | (b >>> 12))
                                  : ((h[y++] = 240 | (b >>> 18)),
                                    (h[y++] = 128 | ((b >>> 12) & 63))),
                                (h[y++] = 128 | ((b >>> 6) & 63))),
                            (h[y++] = 128 | (63 & b))));
                    return h;
                  })(u);
            }),
              (i.utf8decode = function (u) {
                return o.nodebuffer
                  ? a.transformTo("nodebuffer", u).toString("utf-8")
                  : (function (f) {
                      var h,
                        b,
                        g,
                        _,
                        y = f.length,
                        k = new Array(2 * y);
                      for (h = b = 0; h < y; )
                        if ((g = f[h++]) < 128) k[b++] = g;
                        else if (4 < (_ = c[g])) ((k[b++] = 65533), (h += _ - 1));
                        else {
                          for (g &= _ === 2 ? 31 : _ === 3 ? 15 : 7; 1 < _ && h < y; )
                            ((g = (g << 6) | (63 & f[h++])), _--);
                          1 < _
                            ? (k[b++] = 65533)
                            : g < 65536
                              ? (k[b++] = g)
                              : ((g -= 65536),
                                (k[b++] = 55296 | ((g >> 10) & 1023)),
                                (k[b++] = 56320 | (1023 & g)));
                        }
                      return (
                        k.length !== b && (k.subarray ? (k = k.subarray(0, b)) : (k.length = b)),
                        a.applyFromCharCode(k)
                      );
                    })((u = a.transformTo(o.uint8array ? "uint8array" : "array", u)));
              }),
              a.inherits(d, l),
              (d.prototype.processChunk = function (u) {
                var f = a.transformTo(o.uint8array ? "uint8array" : "array", u.data);
                if (this.leftOver && this.leftOver.length) {
                  if (o.uint8array) {
                    var h = f;
                    ((f = new Uint8Array(h.length + this.leftOver.length)).set(this.leftOver, 0),
                      f.set(h, this.leftOver.length));
                  } else f = this.leftOver.concat(f);
                  this.leftOver = null;
                }
                var b = (function (_, y) {
                    var k;
                    for (
                      (y = y || _.length) > _.length && (y = _.length), k = y - 1;
                      0 <= k && (192 & _[k]) == 128;

                    )
                      k--;
                    return k < 0 || k === 0 ? y : k + c[_[k]] > y ? k : y;
                  })(f),
                  g = f;
                (b !== f.length &&
                  (o.uint8array
                    ? ((g = f.subarray(0, b)), (this.leftOver = f.subarray(b, f.length)))
                    : ((g = f.slice(0, b)), (this.leftOver = f.slice(b, f.length)))),
                  this.push({ data: i.utf8decode(g), meta: u.meta }));
              }),
              (d.prototype.flush = function () {
                this.leftOver &&
                  this.leftOver.length &&
                  (this.push({ data: i.utf8decode(this.leftOver), meta: {} }),
                  (this.leftOver = null));
              }),
              (i.Utf8DecodeWorker = d),
              a.inherits(v, l),
              (v.prototype.processChunk = function (u) {
                this.push({ data: i.utf8encode(u.data), meta: u.meta });
              }),
              (i.Utf8EncodeWorker = v));
          },
          { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 },
        ],
        32: [
          function (e, n, i) {
            var a = e("./support"),
              o = e("./base64"),
              s = e("./nodejsUtils"),
              l = e("./external");
            function c(h) {
              return h;
            }
            function p(h, b) {
              for (var g = 0; g < h.length; ++g) b[g] = 255 & h.charCodeAt(g);
              return b;
            }
            (e("setimmediate"),
              (i.newBlob = function (h, b) {
                i.checkSupport("blob");
                try {
                  return new Blob([h], { type: b });
                } catch {
                  try {
                    var g = new (self.BlobBuilder ||
                      self.WebKitBlobBuilder ||
                      self.MozBlobBuilder ||
                      self.MSBlobBuilder)();
                    return (g.append(h), g.getBlob(b));
                  } catch {
                    throw new Error("Bug : can't construct the Blob.");
                  }
                }
              }));
            var d = {
              stringifyByChunk: function (h, b, g) {
                var _ = [],
                  y = 0,
                  k = h.length;
                if (k <= g) return String.fromCharCode.apply(null, h);
                for (; y < k; )
                  (b === "array" || b === "nodebuffer"
                    ? _.push(String.fromCharCode.apply(null, h.slice(y, Math.min(y + g, k))))
                    : _.push(String.fromCharCode.apply(null, h.subarray(y, Math.min(y + g, k)))),
                    (y += g));
                return _.join("");
              },
              stringifyByChar: function (h) {
                for (var b = "", g = 0; g < h.length; g++) b += String.fromCharCode(h[g]);
                return b;
              },
              applyCanBeUsed: {
                uint8array: (function () {
                  try {
                    return (
                      a.uint8array &&
                      String.fromCharCode.apply(null, new Uint8Array(1)).length === 1
                    );
                  } catch {
                    return !1;
                  }
                })(),
                nodebuffer: (function () {
                  try {
                    return (
                      a.nodebuffer && String.fromCharCode.apply(null, s.allocBuffer(1)).length === 1
                    );
                  } catch {
                    return !1;
                  }
                })(),
              },
            };
            function v(h) {
              var b = 65536,
                g = i.getTypeOf(h),
                _ = !0;
              if (
                (g === "uint8array"
                  ? (_ = d.applyCanBeUsed.uint8array)
                  : g === "nodebuffer" && (_ = d.applyCanBeUsed.nodebuffer),
                _)
              )
                for (; 1 < b; )
                  try {
                    return d.stringifyByChunk(h, g, b);
                  } catch {
                    b = Math.floor(b / 2);
                  }
              return d.stringifyByChar(h);
            }
            function u(h, b) {
              for (var g = 0; g < h.length; g++) b[g] = h[g];
              return b;
            }
            i.applyFromCharCode = v;
            var f = {};
            ((f.string = {
              string: c,
              array: function (h) {
                return p(h, new Array(h.length));
              },
              arraybuffer: function (h) {
                return f.string.uint8array(h).buffer;
              },
              uint8array: function (h) {
                return p(h, new Uint8Array(h.length));
              },
              nodebuffer: function (h) {
                return p(h, s.allocBuffer(h.length));
              },
            }),
              (f.array = {
                string: v,
                array: c,
                arraybuffer: function (h) {
                  return new Uint8Array(h).buffer;
                },
                uint8array: function (h) {
                  return new Uint8Array(h);
                },
                nodebuffer: function (h) {
                  return s.newBufferFrom(h);
                },
              }),
              (f.arraybuffer = {
                string: function (h) {
                  return v(new Uint8Array(h));
                },
                array: function (h) {
                  return u(new Uint8Array(h), new Array(h.byteLength));
                },
                arraybuffer: c,
                uint8array: function (h) {
                  return new Uint8Array(h);
                },
                nodebuffer: function (h) {
                  return s.newBufferFrom(new Uint8Array(h));
                },
              }),
              (f.uint8array = {
                string: v,
                array: function (h) {
                  return u(h, new Array(h.length));
                },
                arraybuffer: function (h) {
                  return h.buffer;
                },
                uint8array: c,
                nodebuffer: function (h) {
                  return s.newBufferFrom(h);
                },
              }),
              (f.nodebuffer = {
                string: v,
                array: function (h) {
                  return u(h, new Array(h.length));
                },
                arraybuffer: function (h) {
                  return f.nodebuffer.uint8array(h).buffer;
                },
                uint8array: function (h) {
                  return u(h, new Uint8Array(h.length));
                },
                nodebuffer: c,
              }),
              (i.transformTo = function (h, b) {
                if (((b = b || ""), !h)) return b;
                i.checkSupport(h);
                var g = i.getTypeOf(b);
                return f[g][h](b);
              }),
              (i.resolve = function (h) {
                for (var b = h.split("/"), g = [], _ = 0; _ < b.length; _++) {
                  var y = b[_];
                  y === "." ||
                    (y === "" && _ !== 0 && _ !== b.length - 1) ||
                    (y === ".." ? g.pop() : g.push(y));
                }
                return g.join("/");
              }),
              (i.getTypeOf = function (h) {
                return typeof h == "string"
                  ? "string"
                  : Object.prototype.toString.call(h) === "[object Array]"
                    ? "array"
                    : a.nodebuffer && s.isBuffer(h)
                      ? "nodebuffer"
                      : a.uint8array && h instanceof Uint8Array
                        ? "uint8array"
                        : a.arraybuffer && h instanceof ArrayBuffer
                          ? "arraybuffer"
                          : void 0;
              }),
              (i.checkSupport = function (h) {
                if (!a[h.toLowerCase()]) throw new Error(h + " is not supported by this platform");
              }),
              (i.MAX_VALUE_16BITS = 65535),
              (i.MAX_VALUE_32BITS = -1),
              (i.pretty = function (h) {
                var b,
                  g,
                  _ = "";
                for (g = 0; g < (h || "").length; g++)
                  _ +=
                    "\\x" + ((b = h.charCodeAt(g)) < 16 ? "0" : "") + b.toString(16).toUpperCase();
                return _;
              }),
              (i.delay = function (h, b, g) {
                setImmediate(function () {
                  h.apply(g || null, b || []);
                });
              }),
              (i.inherits = function (h, b) {
                function g() {}
                ((g.prototype = b.prototype), (h.prototype = new g()));
              }),
              (i.extend = function () {
                var h,
                  b,
                  g = {};
                for (h = 0; h < arguments.length; h++)
                  for (b in arguments[h])
                    Object.prototype.hasOwnProperty.call(arguments[h], b) &&
                      g[b] === void 0 &&
                      (g[b] = arguments[h][b]);
                return g;
              }),
              (i.prepareContent = function (h, b, g, _, y) {
                return l.Promise.resolve(b)
                  .then(function (k) {
                    return a.blob &&
                      (k instanceof Blob ||
                        ["[object File]", "[object Blob]"].indexOf(
                          Object.prototype.toString.call(k),
                        ) !== -1) &&
                      typeof FileReader < "u"
                      ? new l.Promise(function (P, D) {
                          var T = new FileReader();
                          ((T.onload = function (S) {
                            P(S.target.result);
                          }),
                            (T.onerror = function (S) {
                              D(S.target.error);
                            }),
                            T.readAsArrayBuffer(k));
                        })
                      : k;
                  })
                  .then(function (k) {
                    var P = i.getTypeOf(k);
                    return P
                      ? (P === "arraybuffer"
                          ? (k = i.transformTo("uint8array", k))
                          : P === "string" &&
                            (y
                              ? (k = o.decode(k))
                              : g &&
                                _ !== !0 &&
                                (k = (function (D) {
                                  return p(
                                    D,
                                    a.uint8array ? new Uint8Array(D.length) : new Array(D.length),
                                  );
                                })(k))),
                        k)
                      : l.Promise.reject(
                          new Error(
                            "Can't read the data of '" +
                              h +
                              "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?",
                          ),
                        );
                  });
              }));
          },
          {
            "./base64": 1,
            "./external": 6,
            "./nodejsUtils": 14,
            "./support": 30,
            setimmediate: 54,
          },
        ],
        33: [
          function (e, n, i) {
            var a = e("./reader/readerFor"),
              o = e("./utils"),
              s = e("./signature"),
              l = e("./zipEntry"),
              c = e("./support");
            function p(d) {
              ((this.files = []), (this.loadOptions = d));
            }
            ((p.prototype = {
              checkSignature: function (d) {
                if (!this.reader.readAndCheckSignature(d)) {
                  this.reader.index -= 4;
                  var v = this.reader.readString(4);
                  throw new Error(
                    "Corrupted zip or bug: unexpected signature (" +
                      o.pretty(v) +
                      ", expected " +
                      o.pretty(d) +
                      ")",
                  );
                }
              },
              isSignature: function (d, v) {
                var u = this.reader.index;
                this.reader.setIndex(d);
                var f = this.reader.readString(4) === v;
                return (this.reader.setIndex(u), f);
              },
              readBlockEndOfCentral: function () {
                ((this.diskNumber = this.reader.readInt(2)),
                  (this.diskWithCentralDirStart = this.reader.readInt(2)),
                  (this.centralDirRecordsOnThisDisk = this.reader.readInt(2)),
                  (this.centralDirRecords = this.reader.readInt(2)),
                  (this.centralDirSize = this.reader.readInt(4)),
                  (this.centralDirOffset = this.reader.readInt(4)),
                  (this.zipCommentLength = this.reader.readInt(2)));
                var d = this.reader.readData(this.zipCommentLength),
                  v = c.uint8array ? "uint8array" : "array",
                  u = o.transformTo(v, d);
                this.zipComment = this.loadOptions.decodeFileName(u);
              },
              readBlockZip64EndOfCentral: function () {
                ((this.zip64EndOfCentralSize = this.reader.readInt(8)),
                  this.reader.skip(4),
                  (this.diskNumber = this.reader.readInt(4)),
                  (this.diskWithCentralDirStart = this.reader.readInt(4)),
                  (this.centralDirRecordsOnThisDisk = this.reader.readInt(8)),
                  (this.centralDirRecords = this.reader.readInt(8)),
                  (this.centralDirSize = this.reader.readInt(8)),
                  (this.centralDirOffset = this.reader.readInt(8)),
                  (this.zip64ExtensibleData = {}));
                for (var d, v, u, f = this.zip64EndOfCentralSize - 44; 0 < f; )
                  ((d = this.reader.readInt(2)),
                    (v = this.reader.readInt(4)),
                    (u = this.reader.readData(v)),
                    (this.zip64ExtensibleData[d] = { id: d, length: v, value: u }));
              },
              readBlockZip64EndOfCentralLocator: function () {
                if (
                  ((this.diskWithZip64CentralDirStart = this.reader.readInt(4)),
                  (this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8)),
                  (this.disksCount = this.reader.readInt(4)),
                  1 < this.disksCount)
                )
                  throw new Error("Multi-volumes zip are not supported");
              },
              readLocalFiles: function () {
                var d, v;
                for (d = 0; d < this.files.length; d++)
                  ((v = this.files[d]),
                    this.reader.setIndex(v.localHeaderOffset),
                    this.checkSignature(s.LOCAL_FILE_HEADER),
                    v.readLocalPart(this.reader),
                    v.handleUTF8(),
                    v.processAttributes());
              },
              readCentralDir: function () {
                var d;
                for (
                  this.reader.setIndex(this.centralDirOffset);
                  this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);

                )
                  ((d = new l({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(
                    this.reader,
                  ),
                    this.files.push(d));
                if (
                  this.centralDirRecords !== this.files.length &&
                  this.centralDirRecords !== 0 &&
                  this.files.length === 0
                )
                  throw new Error(
                    "Corrupted zip or bug: expected " +
                      this.centralDirRecords +
                      " records in central dir, got " +
                      this.files.length,
                  );
              },
              readEndOfCentral: function () {
                var d = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
                if (d < 0)
                  throw this.isSignature(0, s.LOCAL_FILE_HEADER)
                    ? new Error("Corrupted zip: can't find end of central directory")
                    : new Error(
                        "Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html",
                      );
                this.reader.setIndex(d);
                var v = d;
                if (
                  (this.checkSignature(s.CENTRAL_DIRECTORY_END),
                  this.readBlockEndOfCentral(),
                  this.diskNumber === o.MAX_VALUE_16BITS ||
                    this.diskWithCentralDirStart === o.MAX_VALUE_16BITS ||
                    this.centralDirRecordsOnThisDisk === o.MAX_VALUE_16BITS ||
                    this.centralDirRecords === o.MAX_VALUE_16BITS ||
                    this.centralDirSize === o.MAX_VALUE_32BITS ||
                    this.centralDirOffset === o.MAX_VALUE_32BITS)
                ) {
                  if (
                    ((this.zip64 = !0),
                    (d = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0)
                  )
                    throw new Error(
                      "Corrupted zip: can't find the ZIP64 end of central directory locator",
                    );
                  if (
                    (this.reader.setIndex(d),
                    this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),
                    this.readBlockZip64EndOfCentralLocator(),
                    !this.isSignature(
                      this.relativeOffsetEndOfZip64CentralDir,
                      s.ZIP64_CENTRAL_DIRECTORY_END,
                    ) &&
                      ((this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(
                        s.ZIP64_CENTRAL_DIRECTORY_END,
                      )),
                      this.relativeOffsetEndOfZip64CentralDir < 0))
                  )
                    throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
                  (this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),
                    this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),
                    this.readBlockZip64EndOfCentral());
                }
                var u = this.centralDirOffset + this.centralDirSize;
                this.zip64 && ((u += 20), (u += 12 + this.zip64EndOfCentralSize));
                var f = v - u;
                if (0 < f) this.isSignature(v, s.CENTRAL_FILE_HEADER) || (this.reader.zero = f);
                else if (f < 0)
                  throw new Error("Corrupted zip: missing " + Math.abs(f) + " bytes.");
              },
              prepareReader: function (d) {
                this.reader = a(d);
              },
              load: function (d) {
                (this.prepareReader(d),
                  this.readEndOfCentral(),
                  this.readCentralDir(),
                  this.readLocalFiles());
              },
            }),
              (n.exports = p));
          },
          {
            "./reader/readerFor": 22,
            "./signature": 23,
            "./support": 30,
            "./utils": 32,
            "./zipEntry": 34,
          },
        ],
        34: [
          function (e, n, i) {
            var a = e("./reader/readerFor"),
              o = e("./utils"),
              s = e("./compressedObject"),
              l = e("./crc32"),
              c = e("./utf8"),
              p = e("./compressions"),
              d = e("./support");
            function v(u, f) {
              ((this.options = u), (this.loadOptions = f));
            }
            ((v.prototype = {
              isEncrypted: function () {
                return (1 & this.bitFlag) == 1;
              },
              useUTF8: function () {
                return (2048 & this.bitFlag) == 2048;
              },
              readLocalPart: function (u) {
                var f, h;
                if (
                  (u.skip(22),
                  (this.fileNameLength = u.readInt(2)),
                  (h = u.readInt(2)),
                  (this.fileName = u.readData(this.fileNameLength)),
                  u.skip(h),
                  this.compressedSize === -1 || this.uncompressedSize === -1)
                )
                  throw new Error(
                    "Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)",
                  );
                if (
                  (f = (function (b) {
                    for (var g in p)
                      if (Object.prototype.hasOwnProperty.call(p, g) && p[g].magic === b)
                        return p[g];
                    return null;
                  })(this.compressionMethod)) === null
                )
                  throw new Error(
                    "Corrupted zip : compression " +
                      o.pretty(this.compressionMethod) +
                      " unknown (inner file : " +
                      o.transformTo("string", this.fileName) +
                      ")",
                  );
                this.decompressed = new s(
                  this.compressedSize,
                  this.uncompressedSize,
                  this.crc32,
                  f,
                  u.readData(this.compressedSize),
                );
              },
              readCentralPart: function (u) {
                ((this.versionMadeBy = u.readInt(2)),
                  u.skip(2),
                  (this.bitFlag = u.readInt(2)),
                  (this.compressionMethod = u.readString(2)),
                  (this.date = u.readDate()),
                  (this.crc32 = u.readInt(4)),
                  (this.compressedSize = u.readInt(4)),
                  (this.uncompressedSize = u.readInt(4)));
                var f = u.readInt(2);
                if (
                  ((this.extraFieldsLength = u.readInt(2)),
                  (this.fileCommentLength = u.readInt(2)),
                  (this.diskNumberStart = u.readInt(2)),
                  (this.internalFileAttributes = u.readInt(2)),
                  (this.externalFileAttributes = u.readInt(4)),
                  (this.localHeaderOffset = u.readInt(4)),
                  this.isEncrypted())
                )
                  throw new Error("Encrypted zip are not supported");
                (u.skip(f),
                  this.readExtraFields(u),
                  this.parseZIP64ExtraField(u),
                  (this.fileComment = u.readData(this.fileCommentLength)));
              },
              processAttributes: function () {
                ((this.unixPermissions = null), (this.dosPermissions = null));
                var u = this.versionMadeBy >> 8;
                ((this.dir = !!(16 & this.externalFileAttributes)),
                  u == 0 && (this.dosPermissions = 63 & this.externalFileAttributes),
                  u == 3 && (this.unixPermissions = (this.externalFileAttributes >> 16) & 65535),
                  this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0));
              },
              parseZIP64ExtraField: function () {
                if (this.extraFields[1]) {
                  var u = a(this.extraFields[1].value);
                  (this.uncompressedSize === o.MAX_VALUE_32BITS &&
                    (this.uncompressedSize = u.readInt(8)),
                    this.compressedSize === o.MAX_VALUE_32BITS &&
                      (this.compressedSize = u.readInt(8)),
                    this.localHeaderOffset === o.MAX_VALUE_32BITS &&
                      (this.localHeaderOffset = u.readInt(8)),
                    this.diskNumberStart === o.MAX_VALUE_32BITS &&
                      (this.diskNumberStart = u.readInt(4)));
                }
              },
              readExtraFields: function (u) {
                var f,
                  h,
                  b,
                  g = u.index + this.extraFieldsLength;
                for (this.extraFields || (this.extraFields = {}); u.index + 4 < g; )
                  ((f = u.readInt(2)),
                    (h = u.readInt(2)),
                    (b = u.readData(h)),
                    (this.extraFields[f] = { id: f, length: h, value: b }));
                u.setIndex(g);
              },
              handleUTF8: function () {
                var u = d.uint8array ? "uint8array" : "array";
                if (this.useUTF8())
                  ((this.fileNameStr = c.utf8decode(this.fileName)),
                    (this.fileCommentStr = c.utf8decode(this.fileComment)));
                else {
                  var f = this.findExtraFieldUnicodePath();
                  if (f !== null) this.fileNameStr = f;
                  else {
                    var h = o.transformTo(u, this.fileName);
                    this.fileNameStr = this.loadOptions.decodeFileName(h);
                  }
                  var b = this.findExtraFieldUnicodeComment();
                  if (b !== null) this.fileCommentStr = b;
                  else {
                    var g = o.transformTo(u, this.fileComment);
                    this.fileCommentStr = this.loadOptions.decodeFileName(g);
                  }
                }
              },
              findExtraFieldUnicodePath: function () {
                var u = this.extraFields[28789];
                if (u) {
                  var f = a(u.value);
                  return f.readInt(1) !== 1 || l(this.fileName) !== f.readInt(4)
                    ? null
                    : c.utf8decode(f.readData(u.length - 5));
                }
                return null;
              },
              findExtraFieldUnicodeComment: function () {
                var u = this.extraFields[25461];
                if (u) {
                  var f = a(u.value);
                  return f.readInt(1) !== 1 || l(this.fileComment) !== f.readInt(4)
                    ? null
                    : c.utf8decode(f.readData(u.length - 5));
                }
                return null;
              },
            }),
              (n.exports = v));
          },
          {
            "./compressedObject": 2,
            "./compressions": 3,
            "./crc32": 4,
            "./reader/readerFor": 22,
            "./support": 30,
            "./utf8": 31,
            "./utils": 32,
          },
        ],
        35: [
          function (e, n, i) {
            function a(f, h, b) {
              ((this.name = f),
                (this.dir = b.dir),
                (this.date = b.date),
                (this.comment = b.comment),
                (this.unixPermissions = b.unixPermissions),
                (this.dosPermissions = b.dosPermissions),
                (this._data = h),
                (this._dataBinary = b.binary),
                (this.options = {
                  compression: b.compression,
                  compressionOptions: b.compressionOptions,
                }));
            }
            var o = e("./stream/StreamHelper"),
              s = e("./stream/DataWorker"),
              l = e("./utf8"),
              c = e("./compressedObject"),
              p = e("./stream/GenericWorker");
            a.prototype = {
              internalStream: function (f) {
                var h = null,
                  b = "string";
                try {
                  if (!f) throw new Error("No output type specified.");
                  var g = (b = f.toLowerCase()) === "string" || b === "text";
                  ((b !== "binarystring" && b !== "text") || (b = "string"),
                    (h = this._decompressWorker()));
                  var _ = !this._dataBinary;
                  (_ && !g && (h = h.pipe(new l.Utf8EncodeWorker())),
                    !_ && g && (h = h.pipe(new l.Utf8DecodeWorker())));
                } catch (y) {
                  (h = new p("error")).error(y);
                }
                return new o(h, b, "");
              },
              async: function (f, h) {
                return this.internalStream(f).accumulate(h);
              },
              nodeStream: function (f, h) {
                return this.internalStream(f || "nodebuffer").toNodejsStream(h);
              },
              _compressWorker: function (f, h) {
                if (this._data instanceof c && this._data.compression.magic === f.magic)
                  return this._data.getCompressedWorker();
                var b = this._decompressWorker();
                return (
                  this._dataBinary || (b = b.pipe(new l.Utf8EncodeWorker())),
                  c.createWorkerFrom(b, f, h)
                );
              },
              _decompressWorker: function () {
                return this._data instanceof c
                  ? this._data.getContentWorker()
                  : this._data instanceof p
                    ? this._data
                    : new s(this._data);
              },
            };
            for (
              var d = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"],
                v = function () {
                  throw new Error(
                    "This method has been removed in JSZip 3.0, please check the upgrade guide.",
                  );
                },
                u = 0;
              u < d.length;
              u++
            )
              a.prototype[d[u]] = v;
            n.exports = a;
          },
          {
            "./compressedObject": 2,
            "./stream/DataWorker": 27,
            "./stream/GenericWorker": 28,
            "./stream/StreamHelper": 29,
            "./utf8": 31,
          },
        ],
        36: [
          function (e, n, i) {
            (function (a) {
              var o,
                s,
                l = a.MutationObserver || a.WebKitMutationObserver;
              if (l) {
                var c = 0,
                  p = new l(f),
                  d = a.document.createTextNode("");
                (p.observe(d, { characterData: !0 }),
                  (o = function () {
                    d.data = c = ++c % 2;
                  }));
              } else if (a.setImmediate || a.MessageChannel === void 0)
                o =
                  "document" in a && "onreadystatechange" in a.document.createElement("script")
                    ? function () {
                        var h = a.document.createElement("script");
                        ((h.onreadystatechange = function () {
                          (f(),
                            (h.onreadystatechange = null),
                            h.parentNode.removeChild(h),
                            (h = null));
                        }),
                          a.document.documentElement.appendChild(h));
                      }
                    : function () {
                        setTimeout(f, 0);
                      };
              else {
                var v = new a.MessageChannel();
                ((v.port1.onmessage = f),
                  (o = function () {
                    v.port2.postMessage(0);
                  }));
              }
              var u = [];
              function f() {
                var h, b;
                s = !0;
                for (var g = u.length; g; ) {
                  for (b = u, u = [], h = -1; ++h < g; ) b[h]();
                  g = u.length;
                }
                s = !1;
              }
              n.exports = function (h) {
                u.push(h) !== 1 || s || o();
              };
            }).call(
              this,
              typeof Wi < "u" ? Wi : typeof self < "u" ? self : typeof window < "u" ? window : {},
            );
          },
          {},
        ],
        37: [
          function (e, n, i) {
            var a = e("immediate");
            function o() {}
            var s = {},
              l = ["REJECTED"],
              c = ["FULFILLED"],
              p = ["PENDING"];
            function d(g) {
              if (typeof g != "function") throw new TypeError("resolver must be a function");
              ((this.state = p), (this.queue = []), (this.outcome = void 0), g !== o && h(this, g));
            }
            function v(g, _, y) {
              ((this.promise = g),
                typeof _ == "function" &&
                  ((this.onFulfilled = _), (this.callFulfilled = this.otherCallFulfilled)),
                typeof y == "function" &&
                  ((this.onRejected = y), (this.callRejected = this.otherCallRejected)));
            }
            function u(g, _, y) {
              a(function () {
                var k;
                try {
                  k = _(y);
                } catch (P) {
                  return s.reject(g, P);
                }
                k === g
                  ? s.reject(g, new TypeError("Cannot resolve promise with itself"))
                  : s.resolve(g, k);
              });
            }
            function f(g) {
              var _ = g && g.then;
              if (g && (typeof g == "object" || typeof g == "function") && typeof _ == "function")
                return function () {
                  _.apply(g, arguments);
                };
            }
            function h(g, _) {
              var y = !1;
              function k(T) {
                y || ((y = !0), s.reject(g, T));
              }
              function P(T) {
                y || ((y = !0), s.resolve(g, T));
              }
              var D = b(function () {
                _(P, k);
              });
              D.status === "error" && k(D.value);
            }
            function b(g, _) {
              var y = {};
              try {
                ((y.value = g(_)), (y.status = "success"));
              } catch (k) {
                ((y.status = "error"), (y.value = k));
              }
              return y;
            }
            (((n.exports = d).prototype.finally = function (g) {
              if (typeof g != "function") return this;
              var _ = this.constructor;
              return this.then(
                function (y) {
                  return _.resolve(g()).then(function () {
                    return y;
                  });
                },
                function (y) {
                  return _.resolve(g()).then(function () {
                    throw y;
                  });
                },
              );
            }),
              (d.prototype.catch = function (g) {
                return this.then(null, g);
              }),
              (d.prototype.then = function (g, _) {
                if (
                  (typeof g != "function" && this.state === c) ||
                  (typeof _ != "function" && this.state === l)
                )
                  return this;
                var y = new this.constructor(o);
                return (
                  this.state !== p
                    ? u(y, this.state === c ? g : _, this.outcome)
                    : this.queue.push(new v(y, g, _)),
                  y
                );
              }),
              (v.prototype.callFulfilled = function (g) {
                s.resolve(this.promise, g);
              }),
              (v.prototype.otherCallFulfilled = function (g) {
                u(this.promise, this.onFulfilled, g);
              }),
              (v.prototype.callRejected = function (g) {
                s.reject(this.promise, g);
              }),
              (v.prototype.otherCallRejected = function (g) {
                u(this.promise, this.onRejected, g);
              }),
              (s.resolve = function (g, _) {
                var y = b(f, _);
                if (y.status === "error") return s.reject(g, y.value);
                var k = y.value;
                if (k) h(g, k);
                else {
                  ((g.state = c), (g.outcome = _));
                  for (var P = -1, D = g.queue.length; ++P < D; ) g.queue[P].callFulfilled(_);
                }
                return g;
              }),
              (s.reject = function (g, _) {
                ((g.state = l), (g.outcome = _));
                for (var y = -1, k = g.queue.length; ++y < k; ) g.queue[y].callRejected(_);
                return g;
              }),
              (d.resolve = function (g) {
                return g instanceof this ? g : s.resolve(new this(o), g);
              }),
              (d.reject = function (g) {
                var _ = new this(o);
                return s.reject(_, g);
              }),
              (d.all = function (g) {
                var _ = this;
                if (Object.prototype.toString.call(g) !== "[object Array]")
                  return this.reject(new TypeError("must be an array"));
                var y = g.length,
                  k = !1;
                if (!y) return this.resolve([]);
                for (var P = new Array(y), D = 0, T = -1, S = new this(o); ++T < y; ) O(g[T], T);
                return S;
                function O(V, at) {
                  _.resolve(V).then(
                    function (E) {
                      ((P[at] = E), ++D !== y || k || ((k = !0), s.resolve(S, P)));
                    },
                    function (E) {
                      k || ((k = !0), s.reject(S, E));
                    },
                  );
                }
              }),
              (d.race = function (g) {
                var _ = this;
                if (Object.prototype.toString.call(g) !== "[object Array]")
                  return this.reject(new TypeError("must be an array"));
                var y = g.length,
                  k = !1;
                if (!y) return this.resolve([]);
                for (var P = -1, D = new this(o); ++P < y; )
                  ((T = g[P]),
                    _.resolve(T).then(
                      function (S) {
                        k || ((k = !0), s.resolve(D, S));
                      },
                      function (S) {
                        k || ((k = !0), s.reject(D, S));
                      },
                    ));
                var T;
                return D;
              }));
          },
          { immediate: 36 },
        ],
        38: [
          function (e, n, i) {
            var a = {};
            ((0, e("./lib/utils/common").assign)(
              a,
              e("./lib/deflate"),
              e("./lib/inflate"),
              e("./lib/zlib/constants"),
            ),
              (n.exports = a));
          },
          {
            "./lib/deflate": 39,
            "./lib/inflate": 40,
            "./lib/utils/common": 41,
            "./lib/zlib/constants": 44,
          },
        ],
        39: [
          function (e, n, i) {
            var a = e("./zlib/deflate"),
              o = e("./utils/common"),
              s = e("./utils/strings"),
              l = e("./zlib/messages"),
              c = e("./zlib/zstream"),
              p = Object.prototype.toString,
              d = 0,
              v = -1,
              u = 0,
              f = 8;
            function h(g) {
              if (!(this instanceof h)) return new h(g);
              this.options = o.assign(
                {
                  level: v,
                  method: f,
                  chunkSize: 16384,
                  windowBits: 15,
                  memLevel: 8,
                  strategy: u,
                  to: "",
                },
                g || {},
              );
              var _ = this.options;
              (_.raw && 0 < _.windowBits
                ? (_.windowBits = -_.windowBits)
                : _.gzip && 0 < _.windowBits && _.windowBits < 16 && (_.windowBits += 16),
                (this.err = 0),
                (this.msg = ""),
                (this.ended = !1),
                (this.chunks = []),
                (this.strm = new c()),
                (this.strm.avail_out = 0));
              var y = a.deflateInit2(
                this.strm,
                _.level,
                _.method,
                _.windowBits,
                _.memLevel,
                _.strategy,
              );
              if (y !== d) throw new Error(l[y]);
              if ((_.header && a.deflateSetHeader(this.strm, _.header), _.dictionary)) {
                var k;
                if (
                  ((k =
                    typeof _.dictionary == "string"
                      ? s.string2buf(_.dictionary)
                      : p.call(_.dictionary) === "[object ArrayBuffer]"
                        ? new Uint8Array(_.dictionary)
                        : _.dictionary),
                  (y = a.deflateSetDictionary(this.strm, k)) !== d)
                )
                  throw new Error(l[y]);
                this._dict_set = !0;
              }
            }
            function b(g, _) {
              var y = new h(_);
              if ((y.push(g, !0), y.err)) throw y.msg || l[y.err];
              return y.result;
            }
            ((h.prototype.push = function (g, _) {
              var y,
                k,
                P = this.strm,
                D = this.options.chunkSize;
              if (this.ended) return !1;
              ((k = _ === ~~_ ? _ : _ === !0 ? 4 : 0),
                typeof g == "string"
                  ? (P.input = s.string2buf(g))
                  : p.call(g) === "[object ArrayBuffer]"
                    ? (P.input = new Uint8Array(g))
                    : (P.input = g),
                (P.next_in = 0),
                (P.avail_in = P.input.length));
              do {
                if (
                  (P.avail_out === 0 &&
                    ((P.output = new o.Buf8(D)), (P.next_out = 0), (P.avail_out = D)),
                  (y = a.deflate(P, k)) !== 1 && y !== d)
                )
                  return (this.onEnd(y), !(this.ended = !0));
                (P.avail_out !== 0 && (P.avail_in !== 0 || (k !== 4 && k !== 2))) ||
                  (this.options.to === "string"
                    ? this.onData(s.buf2binstring(o.shrinkBuf(P.output, P.next_out)))
                    : this.onData(o.shrinkBuf(P.output, P.next_out)));
              } while ((0 < P.avail_in || P.avail_out === 0) && y !== 1);
              return k === 4
                ? ((y = a.deflateEnd(this.strm)), this.onEnd(y), (this.ended = !0), y === d)
                : k !== 2 || (this.onEnd(d), !(P.avail_out = 0));
            }),
              (h.prototype.onData = function (g) {
                this.chunks.push(g);
              }),
              (h.prototype.onEnd = function (g) {
                (g === d &&
                  (this.options.to === "string"
                    ? (this.result = this.chunks.join(""))
                    : (this.result = o.flattenChunks(this.chunks))),
                  (this.chunks = []),
                  (this.err = g),
                  (this.msg = this.strm.msg));
              }),
              (i.Deflate = h),
              (i.deflate = b),
              (i.deflateRaw = function (g, _) {
                return (((_ = _ || {}).raw = !0), b(g, _));
              }),
              (i.gzip = function (g, _) {
                return (((_ = _ || {}).gzip = !0), b(g, _));
              }));
          },
          {
            "./utils/common": 41,
            "./utils/strings": 42,
            "./zlib/deflate": 46,
            "./zlib/messages": 51,
            "./zlib/zstream": 53,
          },
        ],
        40: [
          function (e, n, i) {
            var a = e("./zlib/inflate"),
              o = e("./utils/common"),
              s = e("./utils/strings"),
              l = e("./zlib/constants"),
              c = e("./zlib/messages"),
              p = e("./zlib/zstream"),
              d = e("./zlib/gzheader"),
              v = Object.prototype.toString;
            function u(h) {
              if (!(this instanceof u)) return new u(h);
              this.options = o.assign({ chunkSize: 16384, windowBits: 0, to: "" }, h || {});
              var b = this.options;
              (b.raw &&
                0 <= b.windowBits &&
                b.windowBits < 16 &&
                ((b.windowBits = -b.windowBits), b.windowBits === 0 && (b.windowBits = -15)),
                !(0 <= b.windowBits && b.windowBits < 16) ||
                  (h && h.windowBits) ||
                  (b.windowBits += 32),
                15 < b.windowBits &&
                  b.windowBits < 48 &&
                  !(15 & b.windowBits) &&
                  (b.windowBits |= 15),
                (this.err = 0),
                (this.msg = ""),
                (this.ended = !1),
                (this.chunks = []),
                (this.strm = new p()),
                (this.strm.avail_out = 0));
              var g = a.inflateInit2(this.strm, b.windowBits);
              if (g !== l.Z_OK) throw new Error(c[g]);
              ((this.header = new d()), a.inflateGetHeader(this.strm, this.header));
            }
            function f(h, b) {
              var g = new u(b);
              if ((g.push(h, !0), g.err)) throw g.msg || c[g.err];
              return g.result;
            }
            ((u.prototype.push = function (h, b) {
              var g,
                _,
                y,
                k,
                P,
                D,
                T = this.strm,
                S = this.options.chunkSize,
                O = this.options.dictionary,
                V = !1;
              if (this.ended) return !1;
              ((_ = b === ~~b ? b : b === !0 ? l.Z_FINISH : l.Z_NO_FLUSH),
                typeof h == "string"
                  ? (T.input = s.binstring2buf(h))
                  : v.call(h) === "[object ArrayBuffer]"
                    ? (T.input = new Uint8Array(h))
                    : (T.input = h),
                (T.next_in = 0),
                (T.avail_in = T.input.length));
              do {
                if (
                  (T.avail_out === 0 &&
                    ((T.output = new o.Buf8(S)), (T.next_out = 0), (T.avail_out = S)),
                  (g = a.inflate(T, l.Z_NO_FLUSH)) === l.Z_NEED_DICT &&
                    O &&
                    ((D =
                      typeof O == "string"
                        ? s.string2buf(O)
                        : v.call(O) === "[object ArrayBuffer]"
                          ? new Uint8Array(O)
                          : O),
                    (g = a.inflateSetDictionary(this.strm, D))),
                  g === l.Z_BUF_ERROR && V === !0 && ((g = l.Z_OK), (V = !1)),
                  g !== l.Z_STREAM_END && g !== l.Z_OK)
                )
                  return (this.onEnd(g), !(this.ended = !0));
                (T.next_out &&
                  ((T.avail_out !== 0 &&
                    g !== l.Z_STREAM_END &&
                    (T.avail_in !== 0 || (_ !== l.Z_FINISH && _ !== l.Z_SYNC_FLUSH))) ||
                    (this.options.to === "string"
                      ? ((y = s.utf8border(T.output, T.next_out)),
                        (k = T.next_out - y),
                        (P = s.buf2string(T.output, y)),
                        (T.next_out = k),
                        (T.avail_out = S - k),
                        k && o.arraySet(T.output, T.output, y, k, 0),
                        this.onData(P))
                      : this.onData(o.shrinkBuf(T.output, T.next_out)))),
                  T.avail_in === 0 && T.avail_out === 0 && (V = !0));
              } while ((0 < T.avail_in || T.avail_out === 0) && g !== l.Z_STREAM_END);
              return (
                g === l.Z_STREAM_END && (_ = l.Z_FINISH),
                _ === l.Z_FINISH
                  ? ((g = a.inflateEnd(this.strm)), this.onEnd(g), (this.ended = !0), g === l.Z_OK)
                  : _ !== l.Z_SYNC_FLUSH || (this.onEnd(l.Z_OK), !(T.avail_out = 0))
              );
            }),
              (u.prototype.onData = function (h) {
                this.chunks.push(h);
              }),
              (u.prototype.onEnd = function (h) {
                (h === l.Z_OK &&
                  (this.options.to === "string"
                    ? (this.result = this.chunks.join(""))
                    : (this.result = o.flattenChunks(this.chunks))),
                  (this.chunks = []),
                  (this.err = h),
                  (this.msg = this.strm.msg));
              }),
              (i.Inflate = u),
              (i.inflate = f),
              (i.inflateRaw = function (h, b) {
                return (((b = b || {}).raw = !0), f(h, b));
              }),
              (i.ungzip = f));
          },
          {
            "./utils/common": 41,
            "./utils/strings": 42,
            "./zlib/constants": 44,
            "./zlib/gzheader": 47,
            "./zlib/inflate": 49,
            "./zlib/messages": 51,
            "./zlib/zstream": 53,
          },
        ],
        41: [
          function (e, n, i) {
            var a = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
            ((i.assign = function (l) {
              for (var c = Array.prototype.slice.call(arguments, 1); c.length; ) {
                var p = c.shift();
                if (p) {
                  if (typeof p != "object") throw new TypeError(p + "must be non-object");
                  for (var d in p) p.hasOwnProperty(d) && (l[d] = p[d]);
                }
              }
              return l;
            }),
              (i.shrinkBuf = function (l, c) {
                return l.length === c ? l : l.subarray ? l.subarray(0, c) : ((l.length = c), l);
              }));
            var o = {
                arraySet: function (l, c, p, d, v) {
                  if (c.subarray && l.subarray) l.set(c.subarray(p, p + d), v);
                  else for (var u = 0; u < d; u++) l[v + u] = c[p + u];
                },
                flattenChunks: function (l) {
                  var c, p, d, v, u, f;
                  for (c = d = 0, p = l.length; c < p; c++) d += l[c].length;
                  for (f = new Uint8Array(d), c = v = 0, p = l.length; c < p; c++)
                    ((u = l[c]), f.set(u, v), (v += u.length));
                  return f;
                },
              },
              s = {
                arraySet: function (l, c, p, d, v) {
                  for (var u = 0; u < d; u++) l[v + u] = c[p + u];
                },
                flattenChunks: function (l) {
                  return [].concat.apply([], l);
                },
              };
            ((i.setTyped = function (l) {
              l
                ? ((i.Buf8 = Uint8Array),
                  (i.Buf16 = Uint16Array),
                  (i.Buf32 = Int32Array),
                  i.assign(i, o))
                : ((i.Buf8 = Array), (i.Buf16 = Array), (i.Buf32 = Array), i.assign(i, s));
            }),
              i.setTyped(a));
          },
          {},
        ],
        42: [
          function (e, n, i) {
            var a = e("./common"),
              o = !0,
              s = !0;
            try {
              String.fromCharCode.apply(null, [0]);
            } catch {
              o = !1;
            }
            try {
              String.fromCharCode.apply(null, new Uint8Array(1));
            } catch {
              s = !1;
            }
            for (var l = new a.Buf8(256), c = 0; c < 256; c++)
              l[c] = 252 <= c ? 6 : 248 <= c ? 5 : 240 <= c ? 4 : 224 <= c ? 3 : 192 <= c ? 2 : 1;
            function p(d, v) {
              if (v < 65537 && ((d.subarray && s) || (!d.subarray && o)))
                return String.fromCharCode.apply(null, a.shrinkBuf(d, v));
              for (var u = "", f = 0; f < v; f++) u += String.fromCharCode(d[f]);
              return u;
            }
            ((l[254] = l[254] = 1),
              (i.string2buf = function (d) {
                var v,
                  u,
                  f,
                  h,
                  b,
                  g = d.length,
                  _ = 0;
                for (h = 0; h < g; h++)
                  ((64512 & (u = d.charCodeAt(h))) == 55296 &&
                    h + 1 < g &&
                    (64512 & (f = d.charCodeAt(h + 1))) == 56320 &&
                    ((u = 65536 + ((u - 55296) << 10) + (f - 56320)), h++),
                    (_ += u < 128 ? 1 : u < 2048 ? 2 : u < 65536 ? 3 : 4));
                for (v = new a.Buf8(_), h = b = 0; b < _; h++)
                  ((64512 & (u = d.charCodeAt(h))) == 55296 &&
                    h + 1 < g &&
                    (64512 & (f = d.charCodeAt(h + 1))) == 56320 &&
                    ((u = 65536 + ((u - 55296) << 10) + (f - 56320)), h++),
                    u < 128
                      ? (v[b++] = u)
                      : (u < 2048
                          ? (v[b++] = 192 | (u >>> 6))
                          : (u < 65536
                              ? (v[b++] = 224 | (u >>> 12))
                              : ((v[b++] = 240 | (u >>> 18)), (v[b++] = 128 | ((u >>> 12) & 63))),
                            (v[b++] = 128 | ((u >>> 6) & 63))),
                        (v[b++] = 128 | (63 & u))));
                return v;
              }),
              (i.buf2binstring = function (d) {
                return p(d, d.length);
              }),
              (i.binstring2buf = function (d) {
                for (var v = new a.Buf8(d.length), u = 0, f = v.length; u < f; u++)
                  v[u] = d.charCodeAt(u);
                return v;
              }),
              (i.buf2string = function (d, v) {
                var u,
                  f,
                  h,
                  b,
                  g = v || d.length,
                  _ = new Array(2 * g);
                for (u = f = 0; u < g; )
                  if ((h = d[u++]) < 128) _[f++] = h;
                  else if (4 < (b = l[h])) ((_[f++] = 65533), (u += b - 1));
                  else {
                    for (h &= b === 2 ? 31 : b === 3 ? 15 : 7; 1 < b && u < g; )
                      ((h = (h << 6) | (63 & d[u++])), b--);
                    1 < b
                      ? (_[f++] = 65533)
                      : h < 65536
                        ? (_[f++] = h)
                        : ((h -= 65536),
                          (_[f++] = 55296 | ((h >> 10) & 1023)),
                          (_[f++] = 56320 | (1023 & h)));
                  }
                return p(_, f);
              }),
              (i.utf8border = function (d, v) {
                var u;
                for (
                  (v = v || d.length) > d.length && (v = d.length), u = v - 1;
                  0 <= u && (192 & d[u]) == 128;

                )
                  u--;
                return u < 0 || u === 0 ? v : u + l[d[u]] > v ? u : v;
              }));
          },
          { "./common": 41 },
        ],
        43: [
          function (e, n, i) {
            n.exports = function (a, o, s, l) {
              for (var c = (65535 & a) | 0, p = ((a >>> 16) & 65535) | 0, d = 0; s !== 0; ) {
                for (s -= d = 2e3 < s ? 2e3 : s; (p = (p + (c = (c + o[l++]) | 0)) | 0), --d; );
                ((c %= 65521), (p %= 65521));
              }
              return c | (p << 16) | 0;
            };
          },
          {},
        ],
        44: [
          function (e, n, i) {
            n.exports = {
              Z_NO_FLUSH: 0,
              Z_PARTIAL_FLUSH: 1,
              Z_SYNC_FLUSH: 2,
              Z_FULL_FLUSH: 3,
              Z_FINISH: 4,
              Z_BLOCK: 5,
              Z_TREES: 6,
              Z_OK: 0,
              Z_STREAM_END: 1,
              Z_NEED_DICT: 2,
              Z_ERRNO: -1,
              Z_STREAM_ERROR: -2,
              Z_DATA_ERROR: -3,
              Z_BUF_ERROR: -5,
              Z_NO_COMPRESSION: 0,
              Z_BEST_SPEED: 1,
              Z_BEST_COMPRESSION: 9,
              Z_DEFAULT_COMPRESSION: -1,
              Z_FILTERED: 1,
              Z_HUFFMAN_ONLY: 2,
              Z_RLE: 3,
              Z_FIXED: 4,
              Z_DEFAULT_STRATEGY: 0,
              Z_BINARY: 0,
              Z_TEXT: 1,
              Z_UNKNOWN: 2,
              Z_DEFLATED: 8,
            };
          },
          {},
        ],
        45: [
          function (e, n, i) {
            var a = (function () {
              for (var o, s = [], l = 0; l < 256; l++) {
                o = l;
                for (var c = 0; c < 8; c++) o = 1 & o ? 3988292384 ^ (o >>> 1) : o >>> 1;
                s[l] = o;
              }
              return s;
            })();
            n.exports = function (o, s, l, c) {
              var p = a,
                d = c + l;
              o ^= -1;
              for (var v = c; v < d; v++) o = (o >>> 8) ^ p[255 & (o ^ s[v])];
              return -1 ^ o;
            };
          },
          {},
        ],
        46: [
          function (e, n, i) {
            var a,
              o = e("../utils/common"),
              s = e("./trees"),
              l = e("./adler32"),
              c = e("./crc32"),
              p = e("./messages"),
              d = 0,
              v = 4,
              u = 0,
              f = -2,
              h = -1,
              b = 4,
              g = 2,
              _ = 8,
              y = 9,
              k = 286,
              P = 30,
              D = 19,
              T = 2 * k + 1,
              S = 15,
              O = 3,
              V = 258,
              at = V + O + 1,
              E = 42,
              B = 113,
              w = 1,
              U = 2,
              ft = 3,
              J = 4;
            function rt(m, q) {
              return ((m.msg = p[q]), q);
            }
            function Y(m) {
              return (m << 1) - (4 < m ? 9 : 0);
            }
            function dt(m) {
              for (var q = m.length; 0 <= --q; ) m[q] = 0;
            }
            function R(m) {
              var q = m.state,
                L = q.pending;
              (L > m.avail_out && (L = m.avail_out),
                L !== 0 &&
                  (o.arraySet(m.output, q.pending_buf, q.pending_out, L, m.next_out),
                  (m.next_out += L),
                  (q.pending_out += L),
                  (m.total_out += L),
                  (m.avail_out -= L),
                  (q.pending -= L),
                  q.pending === 0 && (q.pending_out = 0)));
            }
            function I(m, q) {
              (s._tr_flush_block(
                m,
                0 <= m.block_start ? m.block_start : -1,
                m.strstart - m.block_start,
                q,
              ),
                (m.block_start = m.strstart),
                R(m.strm));
            }
            function ut(m, q) {
              m.pending_buf[m.pending++] = q;
            }
            function st(m, q) {
              ((m.pending_buf[m.pending++] = (q >>> 8) & 255),
                (m.pending_buf[m.pending++] = 255 & q));
            }
            function et(m, q) {
              var L,
                C,
                x = m.max_chain_length,
                N = m.strstart,
                K = m.prev_length,
                W = m.nice_match,
                F = m.strstart > m.w_size - at ? m.strstart - (m.w_size - at) : 0,
                z = m.window,
                M = m.w_mask,
                G = m.prev,
                it = m.strstart + V,
                ht = z[N + K - 1],
                vt = z[N + K];
              (m.prev_length >= m.good_match && (x >>= 2), W > m.lookahead && (W = m.lookahead));
              do
                if (
                  z[(L = q) + K] === vt &&
                  z[L + K - 1] === ht &&
                  z[L] === z[N] &&
                  z[++L] === z[N + 1]
                ) {
                  ((N += 2), L++);
                  do;
                  while (
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    z[++N] === z[++L] &&
                    N < it
                  );
                  if (((C = V - (it - N)), (N = it - V), K < C)) {
                    if (((m.match_start = q), W <= (K = C))) break;
                    ((ht = z[N + K - 1]), (vt = z[N + K]));
                  }
                }
              while ((q = G[q & M]) > F && --x != 0);
              return K <= m.lookahead ? K : m.lookahead;
            }
            function zt(m) {
              var q,
                L,
                C,
                x,
                N,
                K,
                W,
                F,
                z,
                M,
                G = m.w_size;
              do {
                if (((x = m.window_size - m.lookahead - m.strstart), m.strstart >= G + (G - at))) {
                  for (
                    o.arraySet(m.window, m.window, G, G, 0),
                      m.match_start -= G,
                      m.strstart -= G,
                      m.block_start -= G,
                      q = L = m.hash_size;
                    (C = m.head[--q]), (m.head[q] = G <= C ? C - G : 0), --L;

                  );
                  for (q = L = G; (C = m.prev[--q]), (m.prev[q] = G <= C ? C - G : 0), --L; );
                  x += G;
                }
                if (m.strm.avail_in === 0) break;
                if (
                  ((K = m.strm),
                  (W = m.window),
                  (F = m.strstart + m.lookahead),
                  (z = x),
                  (M = void 0),
                  (M = K.avail_in),
                  z < M && (M = z),
                  (L =
                    M === 0
                      ? 0
                      : ((K.avail_in -= M),
                        o.arraySet(W, K.input, K.next_in, M, F),
                        K.state.wrap === 1
                          ? (K.adler = l(K.adler, W, M, F))
                          : K.state.wrap === 2 && (K.adler = c(K.adler, W, M, F)),
                        (K.next_in += M),
                        (K.total_in += M),
                        M)),
                  (m.lookahead += L),
                  m.lookahead + m.insert >= O)
                )
                  for (
                    N = m.strstart - m.insert,
                      m.ins_h = m.window[N],
                      m.ins_h = ((m.ins_h << m.hash_shift) ^ m.window[N + 1]) & m.hash_mask;
                    m.insert &&
                    ((m.ins_h = ((m.ins_h << m.hash_shift) ^ m.window[N + O - 1]) & m.hash_mask),
                    (m.prev[N & m.w_mask] = m.head[m.ins_h]),
                    (m.head[m.ins_h] = N),
                    N++,
                    m.insert--,
                    !(m.lookahead + m.insert < O));

                  );
              } while (m.lookahead < at && m.strm.avail_in !== 0);
            }
            function te(m, q) {
              for (var L, C; ; ) {
                if (m.lookahead < at) {
                  if ((zt(m), m.lookahead < at && q === d)) return w;
                  if (m.lookahead === 0) break;
                }
                if (
                  ((L = 0),
                  m.lookahead >= O &&
                    ((m.ins_h =
                      ((m.ins_h << m.hash_shift) ^ m.window[m.strstart + O - 1]) & m.hash_mask),
                    (L = m.prev[m.strstart & m.w_mask] = m.head[m.ins_h]),
                    (m.head[m.ins_h] = m.strstart)),
                  L !== 0 && m.strstart - L <= m.w_size - at && (m.match_length = et(m, L)),
                  m.match_length >= O)
                )
                  if (
                    ((C = s._tr_tally(m, m.strstart - m.match_start, m.match_length - O)),
                    (m.lookahead -= m.match_length),
                    m.match_length <= m.max_lazy_match && m.lookahead >= O)
                  ) {
                    for (
                      m.match_length--;
                      m.strstart++,
                        (m.ins_h =
                          ((m.ins_h << m.hash_shift) ^ m.window[m.strstart + O - 1]) & m.hash_mask),
                        (L = m.prev[m.strstart & m.w_mask] = m.head[m.ins_h]),
                        (m.head[m.ins_h] = m.strstart),
                        --m.match_length != 0;

                    );
                    m.strstart++;
                  } else
                    ((m.strstart += m.match_length),
                      (m.match_length = 0),
                      (m.ins_h = m.window[m.strstart]),
                      (m.ins_h =
                        ((m.ins_h << m.hash_shift) ^ m.window[m.strstart + 1]) & m.hash_mask));
                else ((C = s._tr_tally(m, 0, m.window[m.strstart])), m.lookahead--, m.strstart++);
                if (C && (I(m, !1), m.strm.avail_out === 0)) return w;
              }
              return (
                (m.insert = m.strstart < O - 1 ? m.strstart : O - 1),
                q === v
                  ? (I(m, !0), m.strm.avail_out === 0 ? ft : J)
                  : m.last_lit && (I(m, !1), m.strm.avail_out === 0)
                    ? w
                    : U
              );
            }
            function xt(m, q) {
              for (var L, C, x; ; ) {
                if (m.lookahead < at) {
                  if ((zt(m), m.lookahead < at && q === d)) return w;
                  if (m.lookahead === 0) break;
                }
                if (
                  ((L = 0),
                  m.lookahead >= O &&
                    ((m.ins_h =
                      ((m.ins_h << m.hash_shift) ^ m.window[m.strstart + O - 1]) & m.hash_mask),
                    (L = m.prev[m.strstart & m.w_mask] = m.head[m.ins_h]),
                    (m.head[m.ins_h] = m.strstart)),
                  (m.prev_length = m.match_length),
                  (m.prev_match = m.match_start),
                  (m.match_length = O - 1),
                  L !== 0 &&
                    m.prev_length < m.max_lazy_match &&
                    m.strstart - L <= m.w_size - at &&
                    ((m.match_length = et(m, L)),
                    m.match_length <= 5 &&
                      (m.strategy === 1 ||
                        (m.match_length === O && 4096 < m.strstart - m.match_start)) &&
                      (m.match_length = O - 1)),
                  m.prev_length >= O && m.match_length <= m.prev_length)
                ) {
                  for (
                    x = m.strstart + m.lookahead - O,
                      C = s._tr_tally(m, m.strstart - 1 - m.prev_match, m.prev_length - O),
                      m.lookahead -= m.prev_length - 1,
                      m.prev_length -= 2;
                    ++m.strstart <= x &&
                      ((m.ins_h =
                        ((m.ins_h << m.hash_shift) ^ m.window[m.strstart + O - 1]) & m.hash_mask),
                      (L = m.prev[m.strstart & m.w_mask] = m.head[m.ins_h]),
                      (m.head[m.ins_h] = m.strstart)),
                      --m.prev_length != 0;

                  );
                  if (
                    ((m.match_available = 0),
                    (m.match_length = O - 1),
                    m.strstart++,
                    C && (I(m, !1), m.strm.avail_out === 0))
                  )
                    return w;
                } else if (m.match_available) {
                  if (
                    ((C = s._tr_tally(m, 0, m.window[m.strstart - 1])) && I(m, !1),
                    m.strstart++,
                    m.lookahead--,
                    m.strm.avail_out === 0)
                  )
                    return w;
                } else ((m.match_available = 1), m.strstart++, m.lookahead--);
              }
              return (
                m.match_available &&
                  ((C = s._tr_tally(m, 0, m.window[m.strstart - 1])), (m.match_available = 0)),
                (m.insert = m.strstart < O - 1 ? m.strstart : O - 1),
                q === v
                  ? (I(m, !0), m.strm.avail_out === 0 ? ft : J)
                  : m.last_lit && (I(m, !1), m.strm.avail_out === 0)
                    ? w
                    : U
              );
            }
            function At(m, q, L, C, x) {
              ((this.good_length = m),
                (this.max_lazy = q),
                (this.nice_length = L),
                (this.max_chain = C),
                (this.func = x));
            }
            function Xt() {
              ((this.strm = null),
                (this.status = 0),
                (this.pending_buf = null),
                (this.pending_buf_size = 0),
                (this.pending_out = 0),
                (this.pending = 0),
                (this.wrap = 0),
                (this.gzhead = null),
                (this.gzindex = 0),
                (this.method = _),
                (this.last_flush = -1),
                (this.w_size = 0),
                (this.w_bits = 0),
                (this.w_mask = 0),
                (this.window = null),
                (this.window_size = 0),
                (this.prev = null),
                (this.head = null),
                (this.ins_h = 0),
                (this.hash_size = 0),
                (this.hash_bits = 0),
                (this.hash_mask = 0),
                (this.hash_shift = 0),
                (this.block_start = 0),
                (this.match_length = 0),
                (this.prev_match = 0),
                (this.match_available = 0),
                (this.strstart = 0),
                (this.match_start = 0),
                (this.lookahead = 0),
                (this.prev_length = 0),
                (this.max_chain_length = 0),
                (this.max_lazy_match = 0),
                (this.level = 0),
                (this.strategy = 0),
                (this.good_match = 0),
                (this.nice_match = 0),
                (this.dyn_ltree = new o.Buf16(2 * T)),
                (this.dyn_dtree = new o.Buf16(2 * (2 * P + 1))),
                (this.bl_tree = new o.Buf16(2 * (2 * D + 1))),
                dt(this.dyn_ltree),
                dt(this.dyn_dtree),
                dt(this.bl_tree),
                (this.l_desc = null),
                (this.d_desc = null),
                (this.bl_desc = null),
                (this.bl_count = new o.Buf16(S + 1)),
                (this.heap = new o.Buf16(2 * k + 1)),
                dt(this.heap),
                (this.heap_len = 0),
                (this.heap_max = 0),
                (this.depth = new o.Buf16(2 * k + 1)),
                dt(this.depth),
                (this.l_buf = 0),
                (this.lit_bufsize = 0),
                (this.last_lit = 0),
                (this.d_buf = 0),
                (this.opt_len = 0),
                (this.static_len = 0),
                (this.matches = 0),
                (this.insert = 0),
                (this.bi_buf = 0),
                (this.bi_valid = 0));
            }
            function Tt(m) {
              var q;
              return m && m.state
                ? ((m.total_in = m.total_out = 0),
                  (m.data_type = g),
                  ((q = m.state).pending = 0),
                  (q.pending_out = 0),
                  q.wrap < 0 && (q.wrap = -q.wrap),
                  (q.status = q.wrap ? E : B),
                  (m.adler = q.wrap === 2 ? 0 : 1),
                  (q.last_flush = d),
                  s._tr_init(q),
                  u)
                : rt(m, f);
            }
            function pt(m) {
              var q = Tt(m);
              return (
                q === u &&
                  (function (L) {
                    ((L.window_size = 2 * L.w_size),
                      dt(L.head),
                      (L.max_lazy_match = a[L.level].max_lazy),
                      (L.good_match = a[L.level].good_length),
                      (L.nice_match = a[L.level].nice_length),
                      (L.max_chain_length = a[L.level].max_chain),
                      (L.strstart = 0),
                      (L.block_start = 0),
                      (L.lookahead = 0),
                      (L.insert = 0),
                      (L.match_length = L.prev_length = O - 1),
                      (L.match_available = 0),
                      (L.ins_h = 0));
                  })(m.state),
                q
              );
            }
            function ve(m, q, L, C, x, N) {
              if (!m) return f;
              var K = 1;
              if (
                (q === h && (q = 6),
                C < 0 ? ((K = 0), (C = -C)) : 15 < C && ((K = 2), (C -= 16)),
                x < 1 || y < x || L !== _ || C < 8 || 15 < C || q < 0 || 9 < q || N < 0 || b < N)
              )
                return rt(m, f);
              C === 8 && (C = 9);
              var W = new Xt();
              return (
                ((m.state = W).strm = m),
                (W.wrap = K),
                (W.gzhead = null),
                (W.w_bits = C),
                (W.w_size = 1 << W.w_bits),
                (W.w_mask = W.w_size - 1),
                (W.hash_bits = x + 7),
                (W.hash_size = 1 << W.hash_bits),
                (W.hash_mask = W.hash_size - 1),
                (W.hash_shift = ~~((W.hash_bits + O - 1) / O)),
                (W.window = new o.Buf8(2 * W.w_size)),
                (W.head = new o.Buf16(W.hash_size)),
                (W.prev = new o.Buf16(W.w_size)),
                (W.lit_bufsize = 1 << (x + 6)),
                (W.pending_buf_size = 4 * W.lit_bufsize),
                (W.pending_buf = new o.Buf8(W.pending_buf_size)),
                (W.d_buf = 1 * W.lit_bufsize),
                (W.l_buf = 3 * W.lit_bufsize),
                (W.level = q),
                (W.strategy = N),
                (W.method = L),
                pt(m)
              );
            }
            ((a = [
              new At(0, 0, 0, 0, function (m, q) {
                var L = 65535;
                for (L > m.pending_buf_size - 5 && (L = m.pending_buf_size - 5); ; ) {
                  if (m.lookahead <= 1) {
                    if ((zt(m), m.lookahead === 0 && q === d)) return w;
                    if (m.lookahead === 0) break;
                  }
                  ((m.strstart += m.lookahead), (m.lookahead = 0));
                  var C = m.block_start + L;
                  if (
                    ((m.strstart === 0 || m.strstart >= C) &&
                      ((m.lookahead = m.strstart - C),
                      (m.strstart = C),
                      I(m, !1),
                      m.strm.avail_out === 0)) ||
                    (m.strstart - m.block_start >= m.w_size - at &&
                      (I(m, !1), m.strm.avail_out === 0))
                  )
                    return w;
                }
                return (
                  (m.insert = 0),
                  q === v
                    ? (I(m, !0), m.strm.avail_out === 0 ? ft : J)
                    : (m.strstart > m.block_start && (I(m, !1), m.strm.avail_out), w)
                );
              }),
              new At(4, 4, 8, 4, te),
              new At(4, 5, 16, 8, te),
              new At(4, 6, 32, 32, te),
              new At(4, 4, 16, 16, xt),
              new At(8, 16, 32, 32, xt),
              new At(8, 16, 128, 128, xt),
              new At(8, 32, 128, 256, xt),
              new At(32, 128, 258, 1024, xt),
              new At(32, 258, 258, 4096, xt),
            ]),
              (i.deflateInit = function (m, q) {
                return ve(m, q, _, 15, 8, 0);
              }),
              (i.deflateInit2 = ve),
              (i.deflateReset = pt),
              (i.deflateResetKeep = Tt),
              (i.deflateSetHeader = function (m, q) {
                return m && m.state ? (m.state.wrap !== 2 ? f : ((m.state.gzhead = q), u)) : f;
              }),
              (i.deflate = function (m, q) {
                var L, C, x, N;
                if (!m || !m.state || 5 < q || q < 0) return m ? rt(m, f) : f;
                if (
                  ((C = m.state),
                  !m.output || (!m.input && m.avail_in !== 0) || (C.status === 666 && q !== v))
                )
                  return rt(m, m.avail_out === 0 ? -5 : f);
                if (((C.strm = m), (L = C.last_flush), (C.last_flush = q), C.status === E))
                  if (C.wrap === 2)
                    ((m.adler = 0),
                      ut(C, 31),
                      ut(C, 139),
                      ut(C, 8),
                      C.gzhead
                        ? (ut(
                            C,
                            (C.gzhead.text ? 1 : 0) +
                              (C.gzhead.hcrc ? 2 : 0) +
                              (C.gzhead.extra ? 4 : 0) +
                              (C.gzhead.name ? 8 : 0) +
                              (C.gzhead.comment ? 16 : 0),
                          ),
                          ut(C, 255 & C.gzhead.time),
                          ut(C, (C.gzhead.time >> 8) & 255),
                          ut(C, (C.gzhead.time >> 16) & 255),
                          ut(C, (C.gzhead.time >> 24) & 255),
                          ut(C, C.level === 9 ? 2 : 2 <= C.strategy || C.level < 2 ? 4 : 0),
                          ut(C, 255 & C.gzhead.os),
                          C.gzhead.extra &&
                            C.gzhead.extra.length &&
                            (ut(C, 255 & C.gzhead.extra.length),
                            ut(C, (C.gzhead.extra.length >> 8) & 255)),
                          C.gzhead.hcrc && (m.adler = c(m.adler, C.pending_buf, C.pending, 0)),
                          (C.gzindex = 0),
                          (C.status = 69))
                        : (ut(C, 0),
                          ut(C, 0),
                          ut(C, 0),
                          ut(C, 0),
                          ut(C, 0),
                          ut(C, C.level === 9 ? 2 : 2 <= C.strategy || C.level < 2 ? 4 : 0),
                          ut(C, 3),
                          (C.status = B)));
                  else {
                    var K = (_ + ((C.w_bits - 8) << 4)) << 8;
                    ((K |=
                      (2 <= C.strategy || C.level < 2
                        ? 0
                        : C.level < 6
                          ? 1
                          : C.level === 6
                            ? 2
                            : 3) << 6),
                      C.strstart !== 0 && (K |= 32),
                      (K += 31 - (K % 31)),
                      (C.status = B),
                      st(C, K),
                      C.strstart !== 0 && (st(C, m.adler >>> 16), st(C, 65535 & m.adler)),
                      (m.adler = 1));
                  }
                if (C.status === 69)
                  if (C.gzhead.extra) {
                    for (
                      x = C.pending;
                      C.gzindex < (65535 & C.gzhead.extra.length) &&
                      (C.pending !== C.pending_buf_size ||
                        (C.gzhead.hcrc &&
                          C.pending > x &&
                          (m.adler = c(m.adler, C.pending_buf, C.pending - x, x)),
                        R(m),
                        (x = C.pending),
                        C.pending !== C.pending_buf_size));

                    )
                      (ut(C, 255 & C.gzhead.extra[C.gzindex]), C.gzindex++);
                    (C.gzhead.hcrc &&
                      C.pending > x &&
                      (m.adler = c(m.adler, C.pending_buf, C.pending - x, x)),
                      C.gzindex === C.gzhead.extra.length && ((C.gzindex = 0), (C.status = 73)));
                  } else C.status = 73;
                if (C.status === 73)
                  if (C.gzhead.name) {
                    x = C.pending;
                    do {
                      if (
                        C.pending === C.pending_buf_size &&
                        (C.gzhead.hcrc &&
                          C.pending > x &&
                          (m.adler = c(m.adler, C.pending_buf, C.pending - x, x)),
                        R(m),
                        (x = C.pending),
                        C.pending === C.pending_buf_size)
                      ) {
                        N = 1;
                        break;
                      }
                      ((N =
                        C.gzindex < C.gzhead.name.length
                          ? 255 & C.gzhead.name.charCodeAt(C.gzindex++)
                          : 0),
                        ut(C, N));
                    } while (N !== 0);
                    (C.gzhead.hcrc &&
                      C.pending > x &&
                      (m.adler = c(m.adler, C.pending_buf, C.pending - x, x)),
                      N === 0 && ((C.gzindex = 0), (C.status = 91)));
                  } else C.status = 91;
                if (C.status === 91)
                  if (C.gzhead.comment) {
                    x = C.pending;
                    do {
                      if (
                        C.pending === C.pending_buf_size &&
                        (C.gzhead.hcrc &&
                          C.pending > x &&
                          (m.adler = c(m.adler, C.pending_buf, C.pending - x, x)),
                        R(m),
                        (x = C.pending),
                        C.pending === C.pending_buf_size)
                      ) {
                        N = 1;
                        break;
                      }
                      ((N =
                        C.gzindex < C.gzhead.comment.length
                          ? 255 & C.gzhead.comment.charCodeAt(C.gzindex++)
                          : 0),
                        ut(C, N));
                    } while (N !== 0);
                    (C.gzhead.hcrc &&
                      C.pending > x &&
                      (m.adler = c(m.adler, C.pending_buf, C.pending - x, x)),
                      N === 0 && (C.status = 103));
                  } else C.status = 103;
                if (
                  (C.status === 103 &&
                    (C.gzhead.hcrc
                      ? (C.pending + 2 > C.pending_buf_size && R(m),
                        C.pending + 2 <= C.pending_buf_size &&
                          (ut(C, 255 & m.adler),
                          ut(C, (m.adler >> 8) & 255),
                          (m.adler = 0),
                          (C.status = B)))
                      : (C.status = B)),
                  C.pending !== 0)
                ) {
                  if ((R(m), m.avail_out === 0)) return ((C.last_flush = -1), u);
                } else if (m.avail_in === 0 && Y(q) <= Y(L) && q !== v) return rt(m, -5);
                if (C.status === 666 && m.avail_in !== 0) return rt(m, -5);
                if (m.avail_in !== 0 || C.lookahead !== 0 || (q !== d && C.status !== 666)) {
                  var W =
                    C.strategy === 2
                      ? (function (F, z) {
                          for (var M; ; ) {
                            if (F.lookahead === 0 && (zt(F), F.lookahead === 0)) {
                              if (z === d) return w;
                              break;
                            }
                            if (
                              ((F.match_length = 0),
                              (M = s._tr_tally(F, 0, F.window[F.strstart])),
                              F.lookahead--,
                              F.strstart++,
                              M && (I(F, !1), F.strm.avail_out === 0))
                            )
                              return w;
                          }
                          return (
                            (F.insert = 0),
                            z === v
                              ? (I(F, !0), F.strm.avail_out === 0 ? ft : J)
                              : F.last_lit && (I(F, !1), F.strm.avail_out === 0)
                                ? w
                                : U
                          );
                        })(C, q)
                      : C.strategy === 3
                        ? (function (F, z) {
                            for (var M, G, it, ht, vt = F.window; ; ) {
                              if (F.lookahead <= V) {
                                if ((zt(F), F.lookahead <= V && z === d)) return w;
                                if (F.lookahead === 0) break;
                              }
                              if (
                                ((F.match_length = 0),
                                F.lookahead >= O &&
                                  0 < F.strstart &&
                                  (G = vt[(it = F.strstart - 1)]) === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it])
                              ) {
                                ht = F.strstart + V;
                                do;
                                while (
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  G === vt[++it] &&
                                  it < ht
                                );
                                ((F.match_length = V - (ht - it)),
                                  F.match_length > F.lookahead && (F.match_length = F.lookahead));
                              }
                              if (
                                (F.match_length >= O
                                  ? ((M = s._tr_tally(F, 1, F.match_length - O)),
                                    (F.lookahead -= F.match_length),
                                    (F.strstart += F.match_length),
                                    (F.match_length = 0))
                                  : ((M = s._tr_tally(F, 0, F.window[F.strstart])),
                                    F.lookahead--,
                                    F.strstart++),
                                M && (I(F, !1), F.strm.avail_out === 0))
                              )
                                return w;
                            }
                            return (
                              (F.insert = 0),
                              z === v
                                ? (I(F, !0), F.strm.avail_out === 0 ? ft : J)
                                : F.last_lit && (I(F, !1), F.strm.avail_out === 0)
                                  ? w
                                  : U
                            );
                          })(C, q)
                        : a[C.level].func(C, q);
                  if (((W !== ft && W !== J) || (C.status = 666), W === w || W === ft))
                    return (m.avail_out === 0 && (C.last_flush = -1), u);
                  if (
                    W === U &&
                    (q === 1
                      ? s._tr_align(C)
                      : q !== 5 &&
                        (s._tr_stored_block(C, 0, 0, !1),
                        q === 3 &&
                          (dt(C.head),
                          C.lookahead === 0 &&
                            ((C.strstart = 0), (C.block_start = 0), (C.insert = 0)))),
                    R(m),
                    m.avail_out === 0)
                  )
                    return ((C.last_flush = -1), u);
                }
                return q !== v
                  ? u
                  : C.wrap <= 0
                    ? 1
                    : (C.wrap === 2
                        ? (ut(C, 255 & m.adler),
                          ut(C, (m.adler >> 8) & 255),
                          ut(C, (m.adler >> 16) & 255),
                          ut(C, (m.adler >> 24) & 255),
                          ut(C, 255 & m.total_in),
                          ut(C, (m.total_in >> 8) & 255),
                          ut(C, (m.total_in >> 16) & 255),
                          ut(C, (m.total_in >> 24) & 255))
                        : (st(C, m.adler >>> 16), st(C, 65535 & m.adler)),
                      R(m),
                      0 < C.wrap && (C.wrap = -C.wrap),
                      C.pending !== 0 ? u : 1);
              }),
              (i.deflateEnd = function (m) {
                var q;
                return m && m.state
                  ? (q = m.state.status) !== E &&
                    q !== 69 &&
                    q !== 73 &&
                    q !== 91 &&
                    q !== 103 &&
                    q !== B &&
                    q !== 666
                    ? rt(m, f)
                    : ((m.state = null), q === B ? rt(m, -3) : u)
                  : f;
              }),
              (i.deflateSetDictionary = function (m, q) {
                var L,
                  C,
                  x,
                  N,
                  K,
                  W,
                  F,
                  z,
                  M = q.length;
                if (
                  !m ||
                  !m.state ||
                  (N = (L = m.state).wrap) === 2 ||
                  (N === 1 && L.status !== E) ||
                  L.lookahead
                )
                  return f;
                for (
                  N === 1 && (m.adler = l(m.adler, q, M, 0)),
                    L.wrap = 0,
                    M >= L.w_size &&
                      (N === 0 &&
                        (dt(L.head), (L.strstart = 0), (L.block_start = 0), (L.insert = 0)),
                      (z = new o.Buf8(L.w_size)),
                      o.arraySet(z, q, M - L.w_size, L.w_size, 0),
                      (q = z),
                      (M = L.w_size)),
                    K = m.avail_in,
                    W = m.next_in,
                    F = m.input,
                    m.avail_in = M,
                    m.next_in = 0,
                    m.input = q,
                    zt(L);
                  L.lookahead >= O;

                ) {
                  for (
                    C = L.strstart, x = L.lookahead - (O - 1);
                    (L.ins_h = ((L.ins_h << L.hash_shift) ^ L.window[C + O - 1]) & L.hash_mask),
                      (L.prev[C & L.w_mask] = L.head[L.ins_h]),
                      (L.head[L.ins_h] = C),
                      C++,
                      --x;

                  );
                  ((L.strstart = C), (L.lookahead = O - 1), zt(L));
                }
                return (
                  (L.strstart += L.lookahead),
                  (L.block_start = L.strstart),
                  (L.insert = L.lookahead),
                  (L.lookahead = 0),
                  (L.match_length = L.prev_length = O - 1),
                  (L.match_available = 0),
                  (m.next_in = W),
                  (m.input = F),
                  (m.avail_in = K),
                  (L.wrap = N),
                  u
                );
              }),
              (i.deflateInfo = "pako deflate (from Nodeca project)"));
          },
          {
            "../utils/common": 41,
            "./adler32": 43,
            "./crc32": 45,
            "./messages": 51,
            "./trees": 52,
          },
        ],
        47: [
          function (e, n, i) {
            n.exports = function () {
              ((this.text = 0),
                (this.time = 0),
                (this.xflags = 0),
                (this.os = 0),
                (this.extra = null),
                (this.extra_len = 0),
                (this.name = ""),
                (this.comment = ""),
                (this.hcrc = 0),
                (this.done = !1));
            };
          },
          {},
        ],
        48: [
          function (e, n, i) {
            n.exports = function (a, o) {
              var s, l, c, p, d, v, u, f, h, b, g, _, y, k, P, D, T, S, O, V, at, E, B, w, U;
              ((s = a.state),
                (l = a.next_in),
                (w = a.input),
                (c = l + (a.avail_in - 5)),
                (p = a.next_out),
                (U = a.output),
                (d = p - (o - a.avail_out)),
                (v = p + (a.avail_out - 257)),
                (u = s.dmax),
                (f = s.wsize),
                (h = s.whave),
                (b = s.wnext),
                (g = s.window),
                (_ = s.hold),
                (y = s.bits),
                (k = s.lencode),
                (P = s.distcode),
                (D = (1 << s.lenbits) - 1),
                (T = (1 << s.distbits) - 1));
              t: do {
                (y < 15 && ((_ += w[l++] << y), (y += 8), (_ += w[l++] << y), (y += 8)),
                  (S = k[_ & D]));
                e: for (;;) {
                  if (((_ >>>= O = S >>> 24), (y -= O), (O = (S >>> 16) & 255) === 0))
                    U[p++] = 65535 & S;
                  else {
                    if (!(16 & O)) {
                      if (!(64 & O)) {
                        S = k[(65535 & S) + (_ & ((1 << O) - 1))];
                        continue e;
                      }
                      if (32 & O) {
                        s.mode = 12;
                        break t;
                      }
                      ((a.msg = "invalid literal/length code"), (s.mode = 30));
                      break t;
                    }
                    ((V = 65535 & S),
                      (O &= 15) &&
                        (y < O && ((_ += w[l++] << y), (y += 8)),
                        (V += _ & ((1 << O) - 1)),
                        (_ >>>= O),
                        (y -= O)),
                      y < 15 && ((_ += w[l++] << y), (y += 8), (_ += w[l++] << y), (y += 8)),
                      (S = P[_ & T]));
                    r: for (;;) {
                      if (((_ >>>= O = S >>> 24), (y -= O), !(16 & (O = (S >>> 16) & 255)))) {
                        if (!(64 & O)) {
                          S = P[(65535 & S) + (_ & ((1 << O) - 1))];
                          continue r;
                        }
                        ((a.msg = "invalid distance code"), (s.mode = 30));
                        break t;
                      }
                      if (
                        ((at = 65535 & S),
                        y < (O &= 15) &&
                          ((_ += w[l++] << y), (y += 8) < O && ((_ += w[l++] << y), (y += 8))),
                        u < (at += _ & ((1 << O) - 1)))
                      ) {
                        ((a.msg = "invalid distance too far back"), (s.mode = 30));
                        break t;
                      }
                      if (((_ >>>= O), (y -= O), (O = p - d) < at)) {
                        if (h < (O = at - O) && s.sane) {
                          ((a.msg = "invalid distance too far back"), (s.mode = 30));
                          break t;
                        }
                        if (((B = g), (E = 0) === b)) {
                          if (((E += f - O), O < V)) {
                            for (V -= O; (U[p++] = g[E++]), --O; );
                            ((E = p - at), (B = U));
                          }
                        } else if (b < O) {
                          if (((E += f + b - O), (O -= b) < V)) {
                            for (V -= O; (U[p++] = g[E++]), --O; );
                            if (((E = 0), b < V)) {
                              for (V -= O = b; (U[p++] = g[E++]), --O; );
                              ((E = p - at), (B = U));
                            }
                          }
                        } else if (((E += b - O), O < V)) {
                          for (V -= O; (U[p++] = g[E++]), --O; );
                          ((E = p - at), (B = U));
                        }
                        for (; 2 < V; )
                          ((U[p++] = B[E++]), (U[p++] = B[E++]), (U[p++] = B[E++]), (V -= 3));
                        V && ((U[p++] = B[E++]), 1 < V && (U[p++] = B[E++]));
                      } else {
                        for (
                          E = p - at;
                          (U[p++] = U[E++]), (U[p++] = U[E++]), (U[p++] = U[E++]), 2 < (V -= 3);

                        );
                        V && ((U[p++] = U[E++]), 1 < V && (U[p++] = U[E++]));
                      }
                      break;
                    }
                  }
                  break;
                }
              } while (l < c && p < v);
              ((l -= V = y >> 3),
                (_ &= (1 << (y -= V << 3)) - 1),
                (a.next_in = l),
                (a.next_out = p),
                (a.avail_in = l < c ? c - l + 5 : 5 - (l - c)),
                (a.avail_out = p < v ? v - p + 257 : 257 - (p - v)),
                (s.hold = _),
                (s.bits = y));
            };
          },
          {},
        ],
        49: [
          function (e, n, i) {
            var a = e("../utils/common"),
              o = e("./adler32"),
              s = e("./crc32"),
              l = e("./inffast"),
              c = e("./inftrees"),
              p = 1,
              d = 2,
              v = 0,
              u = -2,
              f = 1,
              h = 852,
              b = 592;
            function g(E) {
              return (
                ((E >>> 24) & 255) + ((E >>> 8) & 65280) + ((65280 & E) << 8) + ((255 & E) << 24)
              );
            }
            function _() {
              ((this.mode = 0),
                (this.last = !1),
                (this.wrap = 0),
                (this.havedict = !1),
                (this.flags = 0),
                (this.dmax = 0),
                (this.check = 0),
                (this.total = 0),
                (this.head = null),
                (this.wbits = 0),
                (this.wsize = 0),
                (this.whave = 0),
                (this.wnext = 0),
                (this.window = null),
                (this.hold = 0),
                (this.bits = 0),
                (this.length = 0),
                (this.offset = 0),
                (this.extra = 0),
                (this.lencode = null),
                (this.distcode = null),
                (this.lenbits = 0),
                (this.distbits = 0),
                (this.ncode = 0),
                (this.nlen = 0),
                (this.ndist = 0),
                (this.have = 0),
                (this.next = null),
                (this.lens = new a.Buf16(320)),
                (this.work = new a.Buf16(288)),
                (this.lendyn = null),
                (this.distdyn = null),
                (this.sane = 0),
                (this.back = 0),
                (this.was = 0));
            }
            function y(E) {
              var B;
              return E && E.state
                ? ((B = E.state),
                  (E.total_in = E.total_out = B.total = 0),
                  (E.msg = ""),
                  B.wrap && (E.adler = 1 & B.wrap),
                  (B.mode = f),
                  (B.last = 0),
                  (B.havedict = 0),
                  (B.dmax = 32768),
                  (B.head = null),
                  (B.hold = 0),
                  (B.bits = 0),
                  (B.lencode = B.lendyn = new a.Buf32(h)),
                  (B.distcode = B.distdyn = new a.Buf32(b)),
                  (B.sane = 1),
                  (B.back = -1),
                  v)
                : u;
            }
            function k(E) {
              var B;
              return E && E.state
                ? (((B = E.state).wsize = 0), (B.whave = 0), (B.wnext = 0), y(E))
                : u;
            }
            function P(E, B) {
              var w, U;
              return E && E.state
                ? ((U = E.state),
                  B < 0 ? ((w = 0), (B = -B)) : ((w = 1 + (B >> 4)), B < 48 && (B &= 15)),
                  B && (B < 8 || 15 < B)
                    ? u
                    : (U.window !== null && U.wbits !== B && (U.window = null),
                      (U.wrap = w),
                      (U.wbits = B),
                      k(E)))
                : u;
            }
            function D(E, B) {
              var w, U;
              return E
                ? ((U = new _()),
                  ((E.state = U).window = null),
                  (w = P(E, B)) !== v && (E.state = null),
                  w)
                : u;
            }
            var T,
              S,
              O = !0;
            function V(E) {
              if (O) {
                var B;
                for (T = new a.Buf32(512), S = new a.Buf32(32), B = 0; B < 144; ) E.lens[B++] = 8;
                for (; B < 256; ) E.lens[B++] = 9;
                for (; B < 280; ) E.lens[B++] = 7;
                for (; B < 288; ) E.lens[B++] = 8;
                for (c(p, E.lens, 0, 288, T, 0, E.work, { bits: 9 }), B = 0; B < 32; )
                  E.lens[B++] = 5;
                (c(d, E.lens, 0, 32, S, 0, E.work, { bits: 5 }), (O = !1));
              }
              ((E.lencode = T), (E.lenbits = 9), (E.distcode = S), (E.distbits = 5));
            }
            function at(E, B, w, U) {
              var ft,
                J = E.state;
              return (
                J.window === null &&
                  ((J.wsize = 1 << J.wbits),
                  (J.wnext = 0),
                  (J.whave = 0),
                  (J.window = new a.Buf8(J.wsize))),
                U >= J.wsize
                  ? (a.arraySet(J.window, B, w - J.wsize, J.wsize, 0),
                    (J.wnext = 0),
                    (J.whave = J.wsize))
                  : (U < (ft = J.wsize - J.wnext) && (ft = U),
                    a.arraySet(J.window, B, w - U, ft, J.wnext),
                    (U -= ft)
                      ? (a.arraySet(J.window, B, w - U, U, 0), (J.wnext = U), (J.whave = J.wsize))
                      : ((J.wnext += ft),
                        J.wnext === J.wsize && (J.wnext = 0),
                        J.whave < J.wsize && (J.whave += ft))),
                0
              );
            }
            ((i.inflateReset = k),
              (i.inflateReset2 = P),
              (i.inflateResetKeep = y),
              (i.inflateInit = function (E) {
                return D(E, 15);
              }),
              (i.inflateInit2 = D),
              (i.inflate = function (E, B) {
                var w,
                  U,
                  ft,
                  J,
                  rt,
                  Y,
                  dt,
                  R,
                  I,
                  ut,
                  st,
                  et,
                  zt,
                  te,
                  xt,
                  At,
                  Xt,
                  Tt,
                  pt,
                  ve,
                  m,
                  q,
                  L,
                  C,
                  x = 0,
                  N = new a.Buf8(4),
                  K = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
                if (!E || !E.state || !E.output || (!E.input && E.avail_in !== 0)) return u;
                ((w = E.state).mode === 12 && (w.mode = 13),
                  (rt = E.next_out),
                  (ft = E.output),
                  (dt = E.avail_out),
                  (J = E.next_in),
                  (U = E.input),
                  (Y = E.avail_in),
                  (R = w.hold),
                  (I = w.bits),
                  (ut = Y),
                  (st = dt),
                  (q = v));
                t: for (;;)
                  switch (w.mode) {
                    case f:
                      if (w.wrap === 0) {
                        w.mode = 13;
                        break;
                      }
                      for (; I < 16; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      if (2 & w.wrap && R === 35615) {
                        ((N[(w.check = 0)] = 255 & R),
                          (N[1] = (R >>> 8) & 255),
                          (w.check = s(w.check, N, 2, 0)),
                          (I = R = 0),
                          (w.mode = 2));
                        break;
                      }
                      if (
                        ((w.flags = 0),
                        w.head && (w.head.done = !1),
                        !(1 & w.wrap) || (((255 & R) << 8) + (R >> 8)) % 31)
                      ) {
                        ((E.msg = "incorrect header check"), (w.mode = 30));
                        break;
                      }
                      if ((15 & R) != 8) {
                        ((E.msg = "unknown compression method"), (w.mode = 30));
                        break;
                      }
                      if (((I -= 4), (m = 8 + (15 & (R >>>= 4))), w.wbits === 0)) w.wbits = m;
                      else if (m > w.wbits) {
                        ((E.msg = "invalid window size"), (w.mode = 30));
                        break;
                      }
                      ((w.dmax = 1 << m),
                        (E.adler = w.check = 1),
                        (w.mode = 512 & R ? 10 : 12),
                        (I = R = 0));
                      break;
                    case 2:
                      for (; I < 16; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      if (((w.flags = R), (255 & w.flags) != 8)) {
                        ((E.msg = "unknown compression method"), (w.mode = 30));
                        break;
                      }
                      if (57344 & w.flags) {
                        ((E.msg = "unknown header flags set"), (w.mode = 30));
                        break;
                      }
                      (w.head && (w.head.text = (R >> 8) & 1),
                        512 & w.flags &&
                          ((N[0] = 255 & R),
                          (N[1] = (R >>> 8) & 255),
                          (w.check = s(w.check, N, 2, 0))),
                        (I = R = 0),
                        (w.mode = 3));
                    case 3:
                      for (; I < 32; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      (w.head && (w.head.time = R),
                        512 & w.flags &&
                          ((N[0] = 255 & R),
                          (N[1] = (R >>> 8) & 255),
                          (N[2] = (R >>> 16) & 255),
                          (N[3] = (R >>> 24) & 255),
                          (w.check = s(w.check, N, 4, 0))),
                        (I = R = 0),
                        (w.mode = 4));
                    case 4:
                      for (; I < 16; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      (w.head && ((w.head.xflags = 255 & R), (w.head.os = R >> 8)),
                        512 & w.flags &&
                          ((N[0] = 255 & R),
                          (N[1] = (R >>> 8) & 255),
                          (w.check = s(w.check, N, 2, 0))),
                        (I = R = 0),
                        (w.mode = 5));
                    case 5:
                      if (1024 & w.flags) {
                        for (; I < 16; ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        ((w.length = R),
                          w.head && (w.head.extra_len = R),
                          512 & w.flags &&
                            ((N[0] = 255 & R),
                            (N[1] = (R >>> 8) & 255),
                            (w.check = s(w.check, N, 2, 0))),
                          (I = R = 0));
                      } else w.head && (w.head.extra = null);
                      w.mode = 6;
                    case 6:
                      if (
                        1024 & w.flags &&
                        (Y < (et = w.length) && (et = Y),
                        et &&
                          (w.head &&
                            ((m = w.head.extra_len - w.length),
                            w.head.extra || (w.head.extra = new Array(w.head.extra_len)),
                            a.arraySet(w.head.extra, U, J, et, m)),
                          512 & w.flags && (w.check = s(w.check, U, et, J)),
                          (Y -= et),
                          (J += et),
                          (w.length -= et)),
                        w.length)
                      )
                        break t;
                      ((w.length = 0), (w.mode = 7));
                    case 7:
                      if (2048 & w.flags) {
                        if (Y === 0) break t;
                        for (
                          et = 0;
                          (m = U[J + et++]),
                            w.head &&
                              m &&
                              w.length < 65536 &&
                              (w.head.name += String.fromCharCode(m)),
                            m && et < Y;

                        );
                        if (
                          (512 & w.flags && (w.check = s(w.check, U, et, J)),
                          (Y -= et),
                          (J += et),
                          m)
                        )
                          break t;
                      } else w.head && (w.head.name = null);
                      ((w.length = 0), (w.mode = 8));
                    case 8:
                      if (4096 & w.flags) {
                        if (Y === 0) break t;
                        for (
                          et = 0;
                          (m = U[J + et++]),
                            w.head &&
                              m &&
                              w.length < 65536 &&
                              (w.head.comment += String.fromCharCode(m)),
                            m && et < Y;

                        );
                        if (
                          (512 & w.flags && (w.check = s(w.check, U, et, J)),
                          (Y -= et),
                          (J += et),
                          m)
                        )
                          break t;
                      } else w.head && (w.head.comment = null);
                      w.mode = 9;
                    case 9:
                      if (512 & w.flags) {
                        for (; I < 16; ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        if (R !== (65535 & w.check)) {
                          ((E.msg = "header crc mismatch"), (w.mode = 30));
                          break;
                        }
                        I = R = 0;
                      }
                      (w.head && ((w.head.hcrc = (w.flags >> 9) & 1), (w.head.done = !0)),
                        (E.adler = w.check = 0),
                        (w.mode = 12));
                      break;
                    case 10:
                      for (; I < 32; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      ((E.adler = w.check = g(R)), (I = R = 0), (w.mode = 11));
                    case 11:
                      if (w.havedict === 0)
                        return (
                          (E.next_out = rt),
                          (E.avail_out = dt),
                          (E.next_in = J),
                          (E.avail_in = Y),
                          (w.hold = R),
                          (w.bits = I),
                          2
                        );
                      ((E.adler = w.check = 1), (w.mode = 12));
                    case 12:
                      if (B === 5 || B === 6) break t;
                    case 13:
                      if (w.last) {
                        ((R >>>= 7 & I), (I -= 7 & I), (w.mode = 27));
                        break;
                      }
                      for (; I < 3; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      switch (((w.last = 1 & R), (I -= 1), 3 & (R >>>= 1))) {
                        case 0:
                          w.mode = 14;
                          break;
                        case 1:
                          if ((V(w), (w.mode = 20), B !== 6)) break;
                          ((R >>>= 2), (I -= 2));
                          break t;
                        case 2:
                          w.mode = 17;
                          break;
                        case 3:
                          ((E.msg = "invalid block type"), (w.mode = 30));
                      }
                      ((R >>>= 2), (I -= 2));
                      break;
                    case 14:
                      for (R >>>= 7 & I, I -= 7 & I; I < 32; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      if ((65535 & R) != ((R >>> 16) ^ 65535)) {
                        ((E.msg = "invalid stored block lengths"), (w.mode = 30));
                        break;
                      }
                      if (((w.length = 65535 & R), (I = R = 0), (w.mode = 15), B === 6)) break t;
                    case 15:
                      w.mode = 16;
                    case 16:
                      if ((et = w.length)) {
                        if ((Y < et && (et = Y), dt < et && (et = dt), et === 0)) break t;
                        (a.arraySet(ft, U, J, et, rt),
                          (Y -= et),
                          (J += et),
                          (dt -= et),
                          (rt += et),
                          (w.length -= et));
                        break;
                      }
                      w.mode = 12;
                      break;
                    case 17:
                      for (; I < 14; ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      if (
                        ((w.nlen = 257 + (31 & R)),
                        (R >>>= 5),
                        (I -= 5),
                        (w.ndist = 1 + (31 & R)),
                        (R >>>= 5),
                        (I -= 5),
                        (w.ncode = 4 + (15 & R)),
                        (R >>>= 4),
                        (I -= 4),
                        286 < w.nlen || 30 < w.ndist)
                      ) {
                        ((E.msg = "too many length or distance symbols"), (w.mode = 30));
                        break;
                      }
                      ((w.have = 0), (w.mode = 18));
                    case 18:
                      for (; w.have < w.ncode; ) {
                        for (; I < 3; ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        ((w.lens[K[w.have++]] = 7 & R), (R >>>= 3), (I -= 3));
                      }
                      for (; w.have < 19; ) w.lens[K[w.have++]] = 0;
                      if (
                        ((w.lencode = w.lendyn),
                        (w.lenbits = 7),
                        (L = { bits: w.lenbits }),
                        (q = c(0, w.lens, 0, 19, w.lencode, 0, w.work, L)),
                        (w.lenbits = L.bits),
                        q)
                      ) {
                        ((E.msg = "invalid code lengths set"), (w.mode = 30));
                        break;
                      }
                      ((w.have = 0), (w.mode = 19));
                    case 19:
                      for (; w.have < w.nlen + w.ndist; ) {
                        for (
                          ;
                          (At = ((x = w.lencode[R & ((1 << w.lenbits) - 1)]) >>> 16) & 255),
                            (Xt = 65535 & x),
                            !((xt = x >>> 24) <= I);

                        ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        if (Xt < 16) ((R >>>= xt), (I -= xt), (w.lens[w.have++] = Xt));
                        else {
                          if (Xt === 16) {
                            for (C = xt + 2; I < C; ) {
                              if (Y === 0) break t;
                              (Y--, (R += U[J++] << I), (I += 8));
                            }
                            if (((R >>>= xt), (I -= xt), w.have === 0)) {
                              ((E.msg = "invalid bit length repeat"), (w.mode = 30));
                              break;
                            }
                            ((m = w.lens[w.have - 1]), (et = 3 + (3 & R)), (R >>>= 2), (I -= 2));
                          } else if (Xt === 17) {
                            for (C = xt + 3; I < C; ) {
                              if (Y === 0) break t;
                              (Y--, (R += U[J++] << I), (I += 8));
                            }
                            ((I -= xt),
                              (m = 0),
                              (et = 3 + (7 & (R >>>= xt))),
                              (R >>>= 3),
                              (I -= 3));
                          } else {
                            for (C = xt + 7; I < C; ) {
                              if (Y === 0) break t;
                              (Y--, (R += U[J++] << I), (I += 8));
                            }
                            ((I -= xt),
                              (m = 0),
                              (et = 11 + (127 & (R >>>= xt))),
                              (R >>>= 7),
                              (I -= 7));
                          }
                          if (w.have + et > w.nlen + w.ndist) {
                            ((E.msg = "invalid bit length repeat"), (w.mode = 30));
                            break;
                          }
                          for (; et--; ) w.lens[w.have++] = m;
                        }
                      }
                      if (w.mode === 30) break;
                      if (w.lens[256] === 0) {
                        ((E.msg = "invalid code -- missing end-of-block"), (w.mode = 30));
                        break;
                      }
                      if (
                        ((w.lenbits = 9),
                        (L = { bits: w.lenbits }),
                        (q = c(p, w.lens, 0, w.nlen, w.lencode, 0, w.work, L)),
                        (w.lenbits = L.bits),
                        q)
                      ) {
                        ((E.msg = "invalid literal/lengths set"), (w.mode = 30));
                        break;
                      }
                      if (
                        ((w.distbits = 6),
                        (w.distcode = w.distdyn),
                        (L = { bits: w.distbits }),
                        (q = c(d, w.lens, w.nlen, w.ndist, w.distcode, 0, w.work, L)),
                        (w.distbits = L.bits),
                        q)
                      ) {
                        ((E.msg = "invalid distances set"), (w.mode = 30));
                        break;
                      }
                      if (((w.mode = 20), B === 6)) break t;
                    case 20:
                      w.mode = 21;
                    case 21:
                      if (6 <= Y && 258 <= dt) {
                        ((E.next_out = rt),
                          (E.avail_out = dt),
                          (E.next_in = J),
                          (E.avail_in = Y),
                          (w.hold = R),
                          (w.bits = I),
                          l(E, st),
                          (rt = E.next_out),
                          (ft = E.output),
                          (dt = E.avail_out),
                          (J = E.next_in),
                          (U = E.input),
                          (Y = E.avail_in),
                          (R = w.hold),
                          (I = w.bits),
                          w.mode === 12 && (w.back = -1));
                        break;
                      }
                      for (
                        w.back = 0;
                        (At = ((x = w.lencode[R & ((1 << w.lenbits) - 1)]) >>> 16) & 255),
                          (Xt = 65535 & x),
                          !((xt = x >>> 24) <= I);

                      ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      if (At && !(240 & At)) {
                        for (
                          Tt = xt, pt = At, ve = Xt;
                          (At =
                            ((x = w.lencode[ve + ((R & ((1 << (Tt + pt)) - 1)) >> Tt)]) >>> 16) &
                            255),
                            (Xt = 65535 & x),
                            !(Tt + (xt = x >>> 24) <= I);

                        ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        ((R >>>= Tt), (I -= Tt), (w.back += Tt));
                      }
                      if (((R >>>= xt), (I -= xt), (w.back += xt), (w.length = Xt), At === 0)) {
                        w.mode = 26;
                        break;
                      }
                      if (32 & At) {
                        ((w.back = -1), (w.mode = 12));
                        break;
                      }
                      if (64 & At) {
                        ((E.msg = "invalid literal/length code"), (w.mode = 30));
                        break;
                      }
                      ((w.extra = 15 & At), (w.mode = 22));
                    case 22:
                      if (w.extra) {
                        for (C = w.extra; I < C; ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        ((w.length += R & ((1 << w.extra) - 1)),
                          (R >>>= w.extra),
                          (I -= w.extra),
                          (w.back += w.extra));
                      }
                      ((w.was = w.length), (w.mode = 23));
                    case 23:
                      for (
                        ;
                        (At = ((x = w.distcode[R & ((1 << w.distbits) - 1)]) >>> 16) & 255),
                          (Xt = 65535 & x),
                          !((xt = x >>> 24) <= I);

                      ) {
                        if (Y === 0) break t;
                        (Y--, (R += U[J++] << I), (I += 8));
                      }
                      if (!(240 & At)) {
                        for (
                          Tt = xt, pt = At, ve = Xt;
                          (At =
                            ((x = w.distcode[ve + ((R & ((1 << (Tt + pt)) - 1)) >> Tt)]) >>> 16) &
                            255),
                            (Xt = 65535 & x),
                            !(Tt + (xt = x >>> 24) <= I);

                        ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        ((R >>>= Tt), (I -= Tt), (w.back += Tt));
                      }
                      if (((R >>>= xt), (I -= xt), (w.back += xt), 64 & At)) {
                        ((E.msg = "invalid distance code"), (w.mode = 30));
                        break;
                      }
                      ((w.offset = Xt), (w.extra = 15 & At), (w.mode = 24));
                    case 24:
                      if (w.extra) {
                        for (C = w.extra; I < C; ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        ((w.offset += R & ((1 << w.extra) - 1)),
                          (R >>>= w.extra),
                          (I -= w.extra),
                          (w.back += w.extra));
                      }
                      if (w.offset > w.dmax) {
                        ((E.msg = "invalid distance too far back"), (w.mode = 30));
                        break;
                      }
                      w.mode = 25;
                    case 25:
                      if (dt === 0) break t;
                      if (((et = st - dt), w.offset > et)) {
                        if ((et = w.offset - et) > w.whave && w.sane) {
                          ((E.msg = "invalid distance too far back"), (w.mode = 30));
                          break;
                        }
                        ((zt = et > w.wnext ? ((et -= w.wnext), w.wsize - et) : w.wnext - et),
                          et > w.length && (et = w.length),
                          (te = w.window));
                      } else ((te = ft), (zt = rt - w.offset), (et = w.length));
                      for (
                        dt < et && (et = dt), dt -= et, w.length -= et;
                        (ft[rt++] = te[zt++]), --et;

                      );
                      w.length === 0 && (w.mode = 21);
                      break;
                    case 26:
                      if (dt === 0) break t;
                      ((ft[rt++] = w.length), dt--, (w.mode = 21));
                      break;
                    case 27:
                      if (w.wrap) {
                        for (; I < 32; ) {
                          if (Y === 0) break t;
                          (Y--, (R |= U[J++] << I), (I += 8));
                        }
                        if (
                          ((st -= dt),
                          (E.total_out += st),
                          (w.total += st),
                          st &&
                            (E.adler = w.check =
                              w.flags ? s(w.check, ft, st, rt - st) : o(w.check, ft, st, rt - st)),
                          (st = dt),
                          (w.flags ? R : g(R)) !== w.check)
                        ) {
                          ((E.msg = "incorrect data check"), (w.mode = 30));
                          break;
                        }
                        I = R = 0;
                      }
                      w.mode = 28;
                    case 28:
                      if (w.wrap && w.flags) {
                        for (; I < 32; ) {
                          if (Y === 0) break t;
                          (Y--, (R += U[J++] << I), (I += 8));
                        }
                        if (R !== (4294967295 & w.total)) {
                          ((E.msg = "incorrect length check"), (w.mode = 30));
                          break;
                        }
                        I = R = 0;
                      }
                      w.mode = 29;
                    case 29:
                      q = 1;
                      break t;
                    case 30:
                      q = -3;
                      break t;
                    case 31:
                      return -4;
                    case 32:
                    default:
                      return u;
                  }
                return (
                  (E.next_out = rt),
                  (E.avail_out = dt),
                  (E.next_in = J),
                  (E.avail_in = Y),
                  (w.hold = R),
                  (w.bits = I),
                  (w.wsize || (st !== E.avail_out && w.mode < 30 && (w.mode < 27 || B !== 4))) &&
                  at(E, E.output, E.next_out, st - E.avail_out)
                    ? ((w.mode = 31), -4)
                    : ((ut -= E.avail_in),
                      (st -= E.avail_out),
                      (E.total_in += ut),
                      (E.total_out += st),
                      (w.total += st),
                      w.wrap &&
                        st &&
                        (E.adler = w.check =
                          w.flags
                            ? s(w.check, ft, st, E.next_out - st)
                            : o(w.check, ft, st, E.next_out - st)),
                      (E.data_type =
                        w.bits +
                        (w.last ? 64 : 0) +
                        (w.mode === 12 ? 128 : 0) +
                        (w.mode === 20 || w.mode === 15 ? 256 : 0)),
                      ((ut == 0 && st === 0) || B === 4) && q === v && (q = -5),
                      q)
                );
              }),
              (i.inflateEnd = function (E) {
                if (!E || !E.state) return u;
                var B = E.state;
                return (B.window && (B.window = null), (E.state = null), v);
              }),
              (i.inflateGetHeader = function (E, B) {
                var w;
                return E && E.state && 2 & (w = E.state).wrap ? (((w.head = B).done = !1), v) : u;
              }),
              (i.inflateSetDictionary = function (E, B) {
                var w,
                  U = B.length;
                return E && E.state
                  ? (w = E.state).wrap !== 0 && w.mode !== 11
                    ? u
                    : w.mode === 11 && o(1, B, U, 0) !== w.check
                      ? -3
                      : at(E, B, U, U)
                        ? ((w.mode = 31), -4)
                        : ((w.havedict = 1), v)
                  : u;
              }),
              (i.inflateInfo = "pako inflate (from Nodeca project)"));
          },
          {
            "../utils/common": 41,
            "./adler32": 43,
            "./crc32": 45,
            "./inffast": 48,
            "./inftrees": 50,
          },
        ],
        50: [
          function (e, n, i) {
            var a = e("../utils/common"),
              o = [
                3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99,
                115, 131, 163, 195, 227, 258, 0, 0,
              ],
              s = [
                16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20,
                20, 20, 20, 21, 21, 21, 21, 16, 72, 78,
              ],
              l = [
                1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025,
                1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0,
              ],
              c = [
                16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25,
                25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64,
              ];
            n.exports = function (p, d, v, u, f, h, b, g) {
              var _,
                y,
                k,
                P,
                D,
                T,
                S,
                O,
                V,
                at = g.bits,
                E = 0,
                B = 0,
                w = 0,
                U = 0,
                ft = 0,
                J = 0,
                rt = 0,
                Y = 0,
                dt = 0,
                R = 0,
                I = null,
                ut = 0,
                st = new a.Buf16(16),
                et = new a.Buf16(16),
                zt = null,
                te = 0;
              for (E = 0; E <= 15; E++) st[E] = 0;
              for (B = 0; B < u; B++) st[d[v + B]]++;
              for (ft = at, U = 15; 1 <= U && st[U] === 0; U--);
              if ((U < ft && (ft = U), U === 0))
                return ((f[h++] = 20971520), (f[h++] = 20971520), (g.bits = 1), 0);
              for (w = 1; w < U && st[w] === 0; w++);
              for (ft < w && (ft = w), E = Y = 1; E <= 15; E++)
                if (((Y <<= 1), (Y -= st[E]) < 0)) return -1;
              if (0 < Y && (p === 0 || U !== 1)) return -1;
              for (et[1] = 0, E = 1; E < 15; E++) et[E + 1] = et[E] + st[E];
              for (B = 0; B < u; B++) d[v + B] !== 0 && (b[et[d[v + B]]++] = B);
              if (
                ((T =
                  p === 0
                    ? ((I = zt = b), 19)
                    : p === 1
                      ? ((I = o), (ut -= 257), (zt = s), (te -= 257), 256)
                      : ((I = l), (zt = c), -1)),
                (E = w),
                (D = h),
                (rt = B = R = 0),
                (k = -1),
                (P = (dt = 1 << (J = ft)) - 1),
                (p === 1 && 852 < dt) || (p === 2 && 592 < dt))
              )
                return 1;
              for (;;) {
                for (
                  S = E - rt,
                    V =
                      b[B] < T
                        ? ((O = 0), b[B])
                        : b[B] > T
                          ? ((O = zt[te + b[B]]), I[ut + b[B]])
                          : ((O = 96), 0),
                    _ = 1 << (E - rt),
                    w = y = 1 << J;
                  (f[D + (R >> rt) + (y -= _)] = (S << 24) | (O << 16) | V | 0), y !== 0;

                );
                for (_ = 1 << (E - 1); R & _; ) _ >>= 1;
                if ((_ !== 0 ? ((R &= _ - 1), (R += _)) : (R = 0), B++, --st[E] == 0)) {
                  if (E === U) break;
                  E = d[v + b[B]];
                }
                if (ft < E && (R & P) !== k) {
                  for (
                    rt === 0 && (rt = ft), D += w, Y = 1 << (J = E - rt);
                    J + rt < U && !((Y -= st[J + rt]) <= 0);

                  )
                    (J++, (Y <<= 1));
                  if (((dt += 1 << J), (p === 1 && 852 < dt) || (p === 2 && 592 < dt))) return 1;
                  f[(k = R & P)] = (ft << 24) | (J << 16) | (D - h) | 0;
                }
              }
              return (R !== 0 && (f[D + R] = ((E - rt) << 24) | (64 << 16) | 0), (g.bits = ft), 0);
            };
          },
          { "../utils/common": 41 },
        ],
        51: [
          function (e, n, i) {
            n.exports = {
              2: "need dictionary",
              1: "stream end",
              0: "",
              "-1": "file error",
              "-2": "stream error",
              "-3": "data error",
              "-4": "insufficient memory",
              "-5": "buffer error",
              "-6": "incompatible version",
            };
          },
          {},
        ],
        52: [
          function (e, n, i) {
            var a = e("../utils/common"),
              o = 0,
              s = 1;
            function l(x) {
              for (var N = x.length; 0 <= --N; ) x[N] = 0;
            }
            var c = 0,
              p = 29,
              d = 256,
              v = d + 1 + p,
              u = 30,
              f = 19,
              h = 2 * v + 1,
              b = 15,
              g = 16,
              _ = 7,
              y = 256,
              k = 16,
              P = 17,
              D = 18,
              T = [
                0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5,
                0,
              ],
              S = [
                0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
                12, 12, 13, 13,
              ],
              O = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7],
              V = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
              at = new Array(2 * (v + 2));
            l(at);
            var E = new Array(2 * u);
            l(E);
            var B = new Array(512);
            l(B);
            var w = new Array(256);
            l(w);
            var U = new Array(p);
            l(U);
            var ft,
              J,
              rt,
              Y = new Array(u);
            function dt(x, N, K, W, F) {
              ((this.static_tree = x),
                (this.extra_bits = N),
                (this.extra_base = K),
                (this.elems = W),
                (this.max_length = F),
                (this.has_stree = x && x.length));
            }
            function R(x, N) {
              ((this.dyn_tree = x), (this.max_code = 0), (this.stat_desc = N));
            }
            function I(x) {
              return x < 256 ? B[x] : B[256 + (x >>> 7)];
            }
            function ut(x, N) {
              ((x.pending_buf[x.pending++] = 255 & N),
                (x.pending_buf[x.pending++] = (N >>> 8) & 255));
            }
            function st(x, N, K) {
              x.bi_valid > g - K
                ? ((x.bi_buf |= (N << x.bi_valid) & 65535),
                  ut(x, x.bi_buf),
                  (x.bi_buf = N >> (g - x.bi_valid)),
                  (x.bi_valid += K - g))
                : ((x.bi_buf |= (N << x.bi_valid) & 65535), (x.bi_valid += K));
            }
            function et(x, N, K) {
              st(x, K[2 * N], K[2 * N + 1]);
            }
            function zt(x, N) {
              for (var K = 0; (K |= 1 & x), (x >>>= 1), (K <<= 1), 0 < --N; );
              return K >>> 1;
            }
            function te(x, N, K) {
              var W,
                F,
                z = new Array(b + 1),
                M = 0;
              for (W = 1; W <= b; W++) z[W] = M = (M + K[W - 1]) << 1;
              for (F = 0; F <= N; F++) {
                var G = x[2 * F + 1];
                G !== 0 && (x[2 * F] = zt(z[G]++, G));
              }
            }
            function xt(x) {
              var N;
              for (N = 0; N < v; N++) x.dyn_ltree[2 * N] = 0;
              for (N = 0; N < u; N++) x.dyn_dtree[2 * N] = 0;
              for (N = 0; N < f; N++) x.bl_tree[2 * N] = 0;
              ((x.dyn_ltree[2 * y] = 1),
                (x.opt_len = x.static_len = 0),
                (x.last_lit = x.matches = 0));
            }
            function At(x) {
              (8 < x.bi_valid
                ? ut(x, x.bi_buf)
                : 0 < x.bi_valid && (x.pending_buf[x.pending++] = x.bi_buf),
                (x.bi_buf = 0),
                (x.bi_valid = 0));
            }
            function Xt(x, N, K, W) {
              var F = 2 * N,
                z = 2 * K;
              return x[F] < x[z] || (x[F] === x[z] && W[N] <= W[K]);
            }
            function Tt(x, N, K) {
              for (
                var W = x.heap[K], F = K << 1;
                F <= x.heap_len &&
                (F < x.heap_len && Xt(N, x.heap[F + 1], x.heap[F], x.depth) && F++,
                !Xt(N, W, x.heap[F], x.depth));

              )
                ((x.heap[K] = x.heap[F]), (K = F), (F <<= 1));
              x.heap[K] = W;
            }
            function pt(x, N, K) {
              var W,
                F,
                z,
                M,
                G = 0;
              if (x.last_lit !== 0)
                for (
                  ;
                  (W = (x.pending_buf[x.d_buf + 2 * G] << 8) | x.pending_buf[x.d_buf + 2 * G + 1]),
                    (F = x.pending_buf[x.l_buf + G]),
                    G++,
                    W === 0
                      ? et(x, F, N)
                      : (et(x, (z = w[F]) + d + 1, N),
                        (M = T[z]) !== 0 && st(x, (F -= U[z]), M),
                        et(x, (z = I(--W)), K),
                        (M = S[z]) !== 0 && st(x, (W -= Y[z]), M)),
                    G < x.last_lit;

                );
              et(x, y, N);
            }
            function ve(x, N) {
              var K,
                W,
                F,
                z = N.dyn_tree,
                M = N.stat_desc.static_tree,
                G = N.stat_desc.has_stree,
                it = N.stat_desc.elems,
                ht = -1;
              for (x.heap_len = 0, x.heap_max = h, K = 0; K < it; K++)
                z[2 * K] !== 0
                  ? ((x.heap[++x.heap_len] = ht = K), (x.depth[K] = 0))
                  : (z[2 * K + 1] = 0);
              for (; x.heap_len < 2; )
                ((z[2 * (F = x.heap[++x.heap_len] = ht < 2 ? ++ht : 0)] = 1),
                  (x.depth[F] = 0),
                  x.opt_len--,
                  G && (x.static_len -= M[2 * F + 1]));
              for (N.max_code = ht, K = x.heap_len >> 1; 1 <= K; K--) Tt(x, z, K);
              for (
                F = it;
                (K = x.heap[1]),
                  (x.heap[1] = x.heap[x.heap_len--]),
                  Tt(x, z, 1),
                  (W = x.heap[1]),
                  (x.heap[--x.heap_max] = K),
                  (x.heap[--x.heap_max] = W),
                  (z[2 * F] = z[2 * K] + z[2 * W]),
                  (x.depth[F] = (x.depth[K] >= x.depth[W] ? x.depth[K] : x.depth[W]) + 1),
                  (z[2 * K + 1] = z[2 * W + 1] = F),
                  (x.heap[1] = F++),
                  Tt(x, z, 1),
                  2 <= x.heap_len;

              );
              ((x.heap[--x.heap_max] = x.heap[1]),
                (function (vt, Bt) {
                  var $t,
                    Jt,
                    Ee,
                    St,
                    le,
                    _e,
                    ce = Bt.dyn_tree,
                    Ht = Bt.max_code,
                    Nt = Bt.stat_desc.static_tree,
                    Zt = Bt.stat_desc.has_stree,
                    qt = Bt.stat_desc.extra_bits,
                    re = Bt.stat_desc.extra_base,
                    Dt = Bt.stat_desc.max_length,
                    Wt = 0;
                  for (St = 0; St <= b; St++) vt.bl_count[St] = 0;
                  for (ce[2 * vt.heap[vt.heap_max] + 1] = 0, $t = vt.heap_max + 1; $t < h; $t++)
                    (Dt < (St = ce[2 * ce[2 * (Jt = vt.heap[$t]) + 1] + 1] + 1) &&
                      ((St = Dt), Wt++),
                      (ce[2 * Jt + 1] = St),
                      Ht < Jt ||
                        (vt.bl_count[St]++,
                        (le = 0),
                        re <= Jt && (le = qt[Jt - re]),
                        (_e = ce[2 * Jt]),
                        (vt.opt_len += _e * (St + le)),
                        Zt && (vt.static_len += _e * (Nt[2 * Jt + 1] + le))));
                  if (Wt !== 0) {
                    do {
                      for (St = Dt - 1; vt.bl_count[St] === 0; ) St--;
                      (vt.bl_count[St]--, (vt.bl_count[St + 1] += 2), vt.bl_count[Dt]--, (Wt -= 2));
                    } while (0 < Wt);
                    for (St = Dt; St !== 0; St--)
                      for (Jt = vt.bl_count[St]; Jt !== 0; )
                        Ht < (Ee = vt.heap[--$t]) ||
                          (ce[2 * Ee + 1] !== St &&
                            ((vt.opt_len += (St - ce[2 * Ee + 1]) * ce[2 * Ee]),
                            (ce[2 * Ee + 1] = St)),
                          Jt--);
                  }
                })(x, N),
                te(z, ht, x.bl_count));
            }
            function m(x, N, K) {
              var W,
                F,
                z = -1,
                M = N[1],
                G = 0,
                it = 7,
                ht = 4;
              for (
                M === 0 && ((it = 138), (ht = 3)), N[2 * (K + 1) + 1] = 65535, W = 0;
                W <= K;
                W++
              )
                ((F = M),
                  (M = N[2 * (W + 1) + 1]),
                  (++G < it && F === M) ||
                    (G < ht
                      ? (x.bl_tree[2 * F] += G)
                      : F !== 0
                        ? (F !== z && x.bl_tree[2 * F]++, x.bl_tree[2 * k]++)
                        : G <= 10
                          ? x.bl_tree[2 * P]++
                          : x.bl_tree[2 * D]++,
                    (z = F),
                    (ht =
                      (G = 0) === M ? ((it = 138), 3) : F === M ? ((it = 6), 3) : ((it = 7), 4))));
            }
            function q(x, N, K) {
              var W,
                F,
                z = -1,
                M = N[1],
                G = 0,
                it = 7,
                ht = 4;
              for (M === 0 && ((it = 138), (ht = 3)), W = 0; W <= K; W++)
                if (((F = M), (M = N[2 * (W + 1) + 1]), !(++G < it && F === M))) {
                  if (G < ht) for (; et(x, F, x.bl_tree), --G != 0; );
                  else
                    F !== 0
                      ? (F !== z && (et(x, F, x.bl_tree), G--),
                        et(x, k, x.bl_tree),
                        st(x, G - 3, 2))
                      : G <= 10
                        ? (et(x, P, x.bl_tree), st(x, G - 3, 3))
                        : (et(x, D, x.bl_tree), st(x, G - 11, 7));
                  ((z = F),
                    (ht =
                      (G = 0) === M ? ((it = 138), 3) : F === M ? ((it = 6), 3) : ((it = 7), 4)));
                }
            }
            l(Y);
            var L = !1;
            function C(x, N, K, W) {
              (st(x, (c << 1) + (W ? 1 : 0), 3),
                (function (F, z, M, G) {
                  (At(F),
                    ut(F, M),
                    ut(F, ~M),
                    a.arraySet(F.pending_buf, F.window, z, M, F.pending),
                    (F.pending += M));
                })(x, N, K));
            }
            ((i._tr_init = function (x) {
              (L ||
                ((function () {
                  var N,
                    K,
                    W,
                    F,
                    z,
                    M = new Array(b + 1);
                  for (F = W = 0; F < p - 1; F++)
                    for (U[F] = W, N = 0; N < 1 << T[F]; N++) w[W++] = F;
                  for (w[W - 1] = F, F = z = 0; F < 16; F++)
                    for (Y[F] = z, N = 0; N < 1 << S[F]; N++) B[z++] = F;
                  for (z >>= 7; F < u; F++)
                    for (Y[F] = z << 7, N = 0; N < 1 << (S[F] - 7); N++) B[256 + z++] = F;
                  for (K = 0; K <= b; K++) M[K] = 0;
                  for (N = 0; N <= 143; ) ((at[2 * N + 1] = 8), N++, M[8]++);
                  for (; N <= 255; ) ((at[2 * N + 1] = 9), N++, M[9]++);
                  for (; N <= 279; ) ((at[2 * N + 1] = 7), N++, M[7]++);
                  for (; N <= 287; ) ((at[2 * N + 1] = 8), N++, M[8]++);
                  for (te(at, v + 1, M), N = 0; N < u; N++)
                    ((E[2 * N + 1] = 5), (E[2 * N] = zt(N, 5)));
                  ((ft = new dt(at, T, d + 1, v, b)),
                    (J = new dt(E, S, 0, u, b)),
                    (rt = new dt(new Array(0), O, 0, f, _)));
                })(),
                (L = !0)),
                (x.l_desc = new R(x.dyn_ltree, ft)),
                (x.d_desc = new R(x.dyn_dtree, J)),
                (x.bl_desc = new R(x.bl_tree, rt)),
                (x.bi_buf = 0),
                (x.bi_valid = 0),
                xt(x));
            }),
              (i._tr_stored_block = C),
              (i._tr_flush_block = function (x, N, K, W) {
                var F,
                  z,
                  M = 0;
                (0 < x.level
                  ? (x.strm.data_type === 2 &&
                      (x.strm.data_type = (function (G) {
                        var it,
                          ht = 4093624447;
                        for (it = 0; it <= 31; it++, ht >>>= 1)
                          if (1 & ht && G.dyn_ltree[2 * it] !== 0) return o;
                        if (G.dyn_ltree[18] !== 0 || G.dyn_ltree[20] !== 0 || G.dyn_ltree[26] !== 0)
                          return s;
                        for (it = 32; it < d; it++) if (G.dyn_ltree[2 * it] !== 0) return s;
                        return o;
                      })(x)),
                    ve(x, x.l_desc),
                    ve(x, x.d_desc),
                    (M = (function (G) {
                      var it;
                      for (
                        m(G, G.dyn_ltree, G.l_desc.max_code),
                          m(G, G.dyn_dtree, G.d_desc.max_code),
                          ve(G, G.bl_desc),
                          it = f - 1;
                        3 <= it && G.bl_tree[2 * V[it] + 1] === 0;
                        it--
                      );
                      return ((G.opt_len += 3 * (it + 1) + 5 + 5 + 4), it);
                    })(x)),
                    (F = (x.opt_len + 3 + 7) >>> 3),
                    (z = (x.static_len + 3 + 7) >>> 3) <= F && (F = z))
                  : (F = z = K + 5),
                  K + 4 <= F && N !== -1
                    ? C(x, N, K, W)
                    : x.strategy === 4 || z === F
                      ? (st(x, 2 + (W ? 1 : 0), 3), pt(x, at, E))
                      : (st(x, 4 + (W ? 1 : 0), 3),
                        (function (G, it, ht, vt) {
                          var Bt;
                          for (
                            st(G, it - 257, 5), st(G, ht - 1, 5), st(G, vt - 4, 4), Bt = 0;
                            Bt < vt;
                            Bt++
                          )
                            st(G, G.bl_tree[2 * V[Bt] + 1], 3);
                          (q(G, G.dyn_ltree, it - 1), q(G, G.dyn_dtree, ht - 1));
                        })(x, x.l_desc.max_code + 1, x.d_desc.max_code + 1, M + 1),
                        pt(x, x.dyn_ltree, x.dyn_dtree)),
                  xt(x),
                  W && At(x));
              }),
              (i._tr_tally = function (x, N, K) {
                return (
                  (x.pending_buf[x.d_buf + 2 * x.last_lit] = (N >>> 8) & 255),
                  (x.pending_buf[x.d_buf + 2 * x.last_lit + 1] = 255 & N),
                  (x.pending_buf[x.l_buf + x.last_lit] = 255 & K),
                  x.last_lit++,
                  N === 0
                    ? x.dyn_ltree[2 * K]++
                    : (x.matches++,
                      N--,
                      x.dyn_ltree[2 * (w[K] + d + 1)]++,
                      x.dyn_dtree[2 * I(N)]++),
                  x.last_lit === x.lit_bufsize - 1
                );
              }),
              (i._tr_align = function (x) {
                (st(x, 2, 3),
                  et(x, y, at),
                  (function (N) {
                    N.bi_valid === 16
                      ? (ut(N, N.bi_buf), (N.bi_buf = 0), (N.bi_valid = 0))
                      : 8 <= N.bi_valid &&
                        ((N.pending_buf[N.pending++] = 255 & N.bi_buf),
                        (N.bi_buf >>= 8),
                        (N.bi_valid -= 8));
                  })(x));
              }));
          },
          { "../utils/common": 41 },
        ],
        53: [
          function (e, n, i) {
            n.exports = function () {
              ((this.input = null),
                (this.next_in = 0),
                (this.avail_in = 0),
                (this.total_in = 0),
                (this.output = null),
                (this.next_out = 0),
                (this.avail_out = 0),
                (this.total_out = 0),
                (this.msg = ""),
                (this.state = null),
                (this.data_type = 2),
                (this.adler = 0));
            };
          },
          {},
        ],
        54: [
          function (e, n, i) {
            (function (a) {
              (function (o, s) {
                if (!o.setImmediate) {
                  var l,
                    c,
                    p,
                    d,
                    v = 1,
                    u = {},
                    f = !1,
                    h = o.document,
                    b = Object.getPrototypeOf && Object.getPrototypeOf(o);
                  ((b = b && b.setTimeout ? b : o),
                    (l =
                      {}.toString.call(o.process) === "[object process]"
                        ? function (k) {
                            process.nextTick(function () {
                              _(k);
                            });
                          }
                        : (function () {
                              if (o.postMessage && !o.importScripts) {
                                var k = !0,
                                  P = o.onmessage;
                                return (
                                  (o.onmessage = function () {
                                    k = !1;
                                  }),
                                  o.postMessage("", "*"),
                                  (o.onmessage = P),
                                  k
                                );
                              }
                            })()
                          ? ((d = "setImmediate$" + Math.random() + "$"),
                            o.addEventListener
                              ? o.addEventListener("message", y, !1)
                              : o.attachEvent("onmessage", y),
                            function (k) {
                              o.postMessage(d + k, "*");
                            })
                          : o.MessageChannel
                            ? (((p = new MessageChannel()).port1.onmessage = function (k) {
                                _(k.data);
                              }),
                              function (k) {
                                p.port2.postMessage(k);
                              })
                            : h && "onreadystatechange" in h.createElement("script")
                              ? ((c = h.documentElement),
                                function (k) {
                                  var P = h.createElement("script");
                                  ((P.onreadystatechange = function () {
                                    (_(k),
                                      (P.onreadystatechange = null),
                                      c.removeChild(P),
                                      (P = null));
                                  }),
                                    c.appendChild(P));
                                })
                              : function (k) {
                                  setTimeout(_, 0, k);
                                }),
                    (b.setImmediate = function (k) {
                      typeof k != "function" && (k = new Function("" + k));
                      for (var P = new Array(arguments.length - 1), D = 0; D < P.length; D++)
                        P[D] = arguments[D + 1];
                      var T = { callback: k, args: P };
                      return ((u[v] = T), l(v), v++);
                    }),
                    (b.clearImmediate = g));
                }
                function g(k) {
                  delete u[k];
                }
                function _(k) {
                  if (f) setTimeout(_, 0, k);
                  else {
                    var P = u[k];
                    if (P) {
                      f = !0;
                      try {
                        (function (D) {
                          var T = D.callback,
                            S = D.args;
                          switch (S.length) {
                            case 0:
                              T();
                              break;
                            case 1:
                              T(S[0]);
                              break;
                            case 2:
                              T(S[0], S[1]);
                              break;
                            case 3:
                              T(S[0], S[1], S[2]);
                              break;
                            default:
                              T.apply(s, S);
                          }
                        })(P);
                      } finally {
                        (g(k), (f = !1));
                      }
                    }
                  }
                }
                function y(k) {
                  k.source === o &&
                    typeof k.data == "string" &&
                    k.data.indexOf(d) === 0 &&
                    _(+k.data.slice(d.length));
                }
              })(typeof self > "u" ? (a === void 0 ? this : a) : self);
            }).call(
              this,
              typeof Wi < "u" ? Wi : typeof self < "u" ? self : typeof window < "u" ? window : {},
            );
          },
          {},
        ],
      },
      {},
      [10],
    )(10);
  });
})(Yo);
var ou = Yo.exports;
const po = su(ou);
class lu {
  constructor(t, e) {
    ((this.app = t), (this.settings = e));
  }
  get maxBackups() {
    var t;
    return ((t = this.settings) == null ? void 0 : t.maxBackups) ?? 5;
  }
  get maxBackupAgeDays() {
    var t;
    return ((t = this.settings) == null ? void 0 : t.maxBackupAgeDays) ?? 30;
  }
  async createBackup(t, e) {
    try {
      const n = this.app.vault.getAbstractFileByPath(t);
      if (!n || !(n instanceof j.TFolder)) return (Z(`${H} Draft folder not found: ${t}`), !1);
      const i = this.getAllFilesInFolder(n);
      if (i.length === 0) return (Z(`${H} No files to backup in: ${t}`), !1);
      const a = t.split("/")[0] || "unknown",
        o = t.split("/")[1] || "drafts",
        s = t.split("/").pop() || "unknown",
        l = `${Vn(e)}/${a}/${o}/${s}`;
      (await this.app.vault.adapter.exists(l)) || (await this.app.vault.createFolder(l));
      const p = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5),
        d = `${s}_${p}.zip`,
        v = `${l}/${d}`,
        u = new po();
      for (const b of i) {
        const g = b.path.substring(t.length + 1),
          _ = await this.app.vault.read(b);
        u.file(g, _);
      }
      const f = await u.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: { level: 9 },
        }),
        h = new Uint8Array(f).buffer;
      return (await this.app.vault.createBinary(v, h), Z(`${H} Created backup: ${v}`), !0);
    } catch (n) {
      return (Z(`${H} Failed to create backup:`, n), !1);
    }
  }
  async listBackups(t, e) {
    try {
      const n = t.split("/")[0] || "unknown",
        i = t.split("/")[1] || "drafts",
        a = t.split("/").pop() || "unknown",
        o = `${Vn(e)}/${n}/${i}/${a}`,
        s = this.app.vault.getAbstractFileByPath(o);
      if (!s || !(s instanceof j.TFolder)) return [];
      const l = t.split("/").pop() || "unknown",
        c = [];
      for (const p of s.children)
        if (p instanceof j.TFile && p.name.startsWith(`${l}_`) && p.name.endsWith(".zip")) {
          const d = p.name.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.zip$/);
          d && c.push(d[1]);
        }
      return c.sort().reverse();
    } catch (n) {
      return (Z(`${H} Failed to list backups:`, n), []);
    }
  }
  async restoreBackup(t, e, n) {
    try {
      const i = t.split("/")[0] || "unknown",
        a = t.split("/")[1] || "drafts",
        o = t.split("/").pop() || "unknown",
        s = `${Vn(n)}/${i}/${a}/${o}`,
        l = `${o}_${e}.zip`,
        c = `${s}/${l}`;
      if (!(await this.app.vault.adapter.stat(c)))
        return (Z(`${H} Backup file not found: ${c}`), !1);
      const d = await this.app.vault.adapter.readBinary(c),
        v = await po.loadAsync(d);
      this.app.vault.getAbstractFileByPath(t) || (await this.app.vault.createFolder(t));
      for (const [f, h] of Object.entries(v.files))
        if (h.dir) {
          const b = `${t}/${f}`;
          this.app.vault.getAbstractFileByPath(b) || (await this.app.vault.createFolder(b));
        } else {
          const b = await h.async("text"),
            g = `${t}/${f}`,
            _ = g.substring(0, g.lastIndexOf("/"));
          this.app.vault.getAbstractFileByPath(_) || (await this.app.vault.createFolder(_));
          const y = this.app.vault.getAbstractFileByPath(g);
          y && y instanceof j.TFile
            ? await this.app.vault.modify(y, b)
            : await this.app.vault.create(g, b);
        }
      return (Z(`${H} Restored backup: ${c}`), !0);
    } catch (i) {
      return (Z(`${H} Failed to restore backup:`, i), !1);
    }
  }
  async deleteBackup(t, e, n) {
    try {
      const i = t.split("/")[0] || "unknown",
        a = t.split("/")[1] || "drafts",
        o = t.split("/").pop() || "unknown",
        s = `${Vn(n)}/${i}/${a}/${o}`,
        l = `${o}_${e}.zip`,
        c = `${s}/${l}`;
      return (await this.app.vault.adapter.stat(c))
        ? (await this.app.vault.adapter.remove(c), Z(`${H} Deleted backup: ${c}`), !0)
        : (Z(`${H} Backup file not found for deletion: ${c}`), !1);
    } catch (i) {
      return (Z(`${H} Failed to delete backup:`, i), !1);
    }
  }
  async clearOldBackups(t, e) {
    try {
      const n = await this.listBackups(t, e),
        i = new Date();
      i.setDate(i.getDate() - this.maxBackupAgeDays);
      for (const a of n) new Date(a.replace(/-/g, ":")) < i && (await this.deleteBackup(t, a, e));
    } catch (n) {
      Z(`${H} Failed to clear old backups:`, n);
    }
  }
  getAllFilesInFolder(t) {
    const e = [];
    function n(i) {
      for (const a of i.children) a instanceof j.TFile ? e.push(a) : a instanceof j.TFolder && n(a);
    }
    return (n(t), e);
  }
}
class cu {
  constructor(t) {
    var e, n, i;
    ((this.app = t),
      (this.manager =
        ((i =
          (n = (e = this.app.plugins).getPlugin) == null
            ? void 0
            : n.call(e, "obsidian-writeaid-plugin")) == null
          ? void 0
          : i.manager) ?? null));
  }
  async reorderChapters(t, e, n) {
    const i = this.resolveProjectPath(t);
    if (!i) return !1;
    const a = this.getDraftsFolderName(i);
    if (!a) return !1;
    const o = `${i}/${a}/${e}`;
    for (let s = 0; s < n.length; s++) {
      const { chapterName: l } = n[s],
        c = `${o}/${l}.md`,
        p = this.app.vault.getAbstractFileByPath(c);
      if (p && p instanceof j.TFile) {
        let d = await this.app.vault.read(p);
        d.match(/^---\n([\s\S]*?)\n---/) &&
          ((d = d.replace(/^---\n([\s\S]*?)\n---/, (v, u) => {
            let f = u.replace(/^order:.*\n?/gm, "");
            return (
              f.endsWith(`
`) ||
                (f += `
`),
              (f += `order: ${s + 1}
`),
              `---
${f}---`
            );
          })),
          await this.app.vault.modify(p, d));
      }
    }
    return !0;
  }
  async listChapters(t, e) {
    Z(`${H} ChapterFileService.listChapters: projectPath=${t}, draftName=${e}`);
    const n = this.resolveProjectPath(t);
    if (!n) return (Z(`${H} ChapterFileService.listChapters: no project resolved`), []);
    const i = this.getDraftsFolderName(n);
    if (!i)
      return (
        Z(`${H} ChapterFileService.listChapters: no drafts folder found in project ${n}`),
        []
      );
    const a = `${n}/${i}/${e}`;
    Z(
      `${H} ChapterFileService.listChapters: resolved project=${n}, draftsFolder=${i}, draftFolder=${a}`,
    );
    const o = this.app.vault.getAbstractFileByPath(a),
      s = [];
    if (o && o instanceof j.TFolder) {
      Z(`${H} ChapterFileService.listChapters: found folder with ${o.children.length} children`);
      for (const l of o.children)
        l instanceof j.TFile &&
          l.extension === "md" &&
          (Z(`${H} ChapterFileService.listChapters: processing file ${l.path}`),
          await ge(async () => {
            const c = await this.app.vault.read(l);
            Z(`${H} ChapterFileService.listChapters: content length ${c.length}`);
            const p = c.match(/^---\n([\s\S]*?)\n---/);
            let d, v;
            if (p) {
              Z(`${H} ChapterFileService.listChapters: found frontmatter`);
              const h = p[1].split(/\r?\n/);
              for (const b of h) {
                const g = b.match(/^order:\s*(\d+)/i);
                g && (d = parseInt(g[1], 10));
                const _ = b.match(/^chapter_name:\s*(.*)$/i);
                if (_) {
                  let y = _[1].trim();
                  (((y.startsWith('"') && y.endsWith('"')) ||
                    (y.startsWith("'") && y.endsWith("'"))) &&
                    (y = y.slice(1, -1)),
                    y.length > 0 && (v = y));
                }
              }
            } else Z(`${H} ChapterFileService.listChapters: no frontmatter`);
            Z(`${H} ChapterFileService.listChapters: parsed order=${d}, chapterName=${v}`);
            const u = v && v.length > 0 ? v : l.name.replace(/\.md$/, ""),
              f = typeof d == "number" && !isNaN(d) ? d : 0;
            (Z(
              `${H} ChapterFileService.listChapters: adding chapter ${l.name} with name ${u}, order ${f}`,
            ),
              s.push({ name: l.name.replace(/\.md$/, ""), chapterName: u, order: f }));
          }));
    } else Z(`${H} ChapterFileService.listChapters: no folder found`);
    return (
      s.sort((l, c) => l.order - c.order),
      Z(`${H} ChapterFileService.listChapters: returning ${s.length} chapters`),
      s.map(({ name: l, chapterName: c }) => ({ name: l, chapterName: c }))
    );
  }
  async createChapter(t, e, n, i) {
    const a = this.resolveProjectPath(t);
    if (!a) return !1;
    const o = this.getDraftsFolderName(a);
    if (!o) return !1;
    const s = `${a}/${o}/${e}`,
      c = `${Ke(n, i == null ? void 0 : i.slugStyle)}.md`,
      p = `${s}/${c}`;
    if (this.app.vault.getAbstractFileByPath(p)) return !1;
    let d = 0;
    const v = this.app.vault.getAbstractFileByPath(s);
    if (v && v instanceof j.TFolder)
      for (const b of v.children)
        b instanceof j.TFile &&
          b.extension === "md" &&
          (await ge(async () => {
            const _ = (await this.app.vault.read(b)).match(/^---\n([\s\S]*?)\n---/);
            if (_) {
              const y = _[1].split(/\r?\n/);
              for (const k of y) {
                const P = k.match(/^order:\s*(\d+)/i);
                if (P) {
                  const D = parseInt(P[1], 10);
                  !isNaN(D) && D > d && (d = D);
                }
              }
            }
          }));
    const u = d + 1;
    let f = `# ${n}`;
    const h = `---
order: ${u}
chapter_name: ${JSON.stringify(n)}
---
`;
    return (
      await this.app.vault.create(
        p,
        `${h}
${f}

`,
      ),
      !0
    );
  }
  async deleteChapter(t, e, n) {
    const i = this.resolveProjectPath(t);
    if (!i) return !1;
    const a = this.getDraftsFolderName(i);
    if (!a) return !1;
    const o = `${i}/${a}/${e}`,
      s = `${n}.md`,
      l = `${o}/${s}`,
      c = this.app.vault.getAbstractFileByPath(l);
    if (c && c instanceof j.TFile) {
      await this.app.vault.delete(c);
      const p = await this.listChapters(t, e);
      for (let d = 0; d < p.length; d++) {
        const { name: v } = p[d],
          u = `${o}/${v}.md`,
          f = this.app.vault.getAbstractFileByPath(u);
        if (f && f instanceof j.TFile) {
          let h = await this.app.vault.read(f);
          h.match(/^---\n([\s\S]*?)\n---/) &&
            ((h = h.replace(/^---\n([\s\S]*?)\n---/, (b, g) => {
              let _ = g.replace(/^order:.*\n?/gm, "");
              return (
                _.endsWith(`
`) ||
                  (_ += `
`),
                (_ += `order: ${d + 1}
`),
                `---
${_}---`
              );
            })),
            await this.app.vault.modify(f, h));
        }
      }
      return !0;
    }
    return !1;
  }
  async renameChapter(t, e, n, i) {
    const a = this.resolveProjectPath(t);
    if (!a) return !1;
    const o = this.getDraftsFolderName(a);
    if (!o) return !1;
    const s = `${a}/${o}/${e}`,
      l = `${s}/${n}.md`,
      c = `${s}/${i}.md`,
      p = this.app.vault.getAbstractFileByPath(l);
    if (!p || !(p instanceof j.TFile)) return !1;
    let d = await this.app.vault.read(p),
      v = `# ${i}`;
    return (
      d.match(/^---\n([\s\S]*?)\n---/) &&
        (d = d.replace(/^---\n([\s\S]*?)\n---/, (u, f) => {
          let h = f.replace(/^chapter_name:.*\n?/gm, "");
          return (
            h.endsWith(`
`) ||
              (h += `
`),
            (h += `chapter_name: ${JSON.stringify(i)}
`),
            `---
${h}---`
          );
        })),
      (d = d.replace(/^#.*$/m, v)),
      n !== i
        ? (await this.app.vault.create(c, d), await this.app.vault.delete(p))
        : await this.app.vault.modify(p, d),
      !0
    );
  }
  async openChapter(t, e, n) {
    const i = this.resolveProjectPath(t);
    if (!i) return !1;
    const a = this.getDraftsFolderName(i);
    if (!a) return !1;
    const o = `${i}/${a}/${e}/${n}.md`,
      s = this.app.vault.getAbstractFileByPath(o);
    return s && s instanceof j.TFile
      ? (await ge(async () => {
          await this.app.workspace.getLeaf().openFile(s);
        }),
        !0)
      : !1;
  }
  resolveProjectPath(t) {
    var e;
    return t || ((e = this.manager) == null ? void 0 : e.activeProject) || null;
  }
  getDraftsFolderName(t) {
    var i;
    const e = this.app.vault.getAbstractFileByPath(t),
      n = oe((i = this.manager) == null ? void 0 : i.settings);
    if (e && e instanceof j.TFolder) {
      for (const a of e.children)
        if (a instanceof j.TFolder && a.name.toLowerCase() === n.toLowerCase()) return a.name;
    }
    return null;
  }
}
class Os {
  constructor(t, e, n) {
    ((this.chapters = new cu(t)),
      (this.backups = new lu(t, n)),
      (this.drafts = new uu(t, this.chapters, e, this.backups)));
  }
}
class ia {
  constructor(t) {
    ((this.app = t), (this.tpl = new Go(t)), (this.projectFileService = new Os(t, this)));
  }
  async createProject(t, e, n, i, a) {
    if (!t) return (new j.Notice("Project name is required."), null);
    const o = i && i !== "" ? `${i}/${t}` : t,
      s = `${o}/${oe(a)}`;
    (this.app.vault.getAbstractFileByPath(o) || (await this.app.vault.createFolder(o)),
      this.app.vault.getAbstractFileByPath(s) || (await this.app.vault.createFolder(s)));
    const l = `${o}/${Gn(a)}`;
    if (!this.app.vault.getAbstractFileByPath(l)) {
      const p = e ? "single-file" : "multi-file",
        d = e
          ? ((a == null ? void 0 : a.defaultSingleTargetWordCount) ?? 2e4)
          : ((a == null ? void 0 : a.defaultMultiTargetWordCount) ?? 5e4),
        v = `---
project_type: ${p}
target_word_count: ${d}
---
`;
      await this.app.vault.create(l, v);
    }
    const c = n || "Draft 1";
    return (await this.projectFileService.drafts.createDraft(c, void 0, o, a), o);
  }
  async openProject(t) {
    const e = `${t}/meta.md`,
      n = this.app.vault.getAbstractFileByPath(e);
    if (n && n instanceof j.TFile) return (await this.app.workspace.getLeaf().openFile(n), !0);
    const i = [
      `${t}/${t}.md`,
      `${t}/Chapter 1.md`,
      `${t}/Chapter 01.md`,
      `${t}/outline.md`,
      `${t}/${oe()}/Draft 1/outline.md`,
    ];
    for (const a of i) {
      const o = this.app.vault.getAbstractFileByPath(a);
      if (o && o instanceof j.TFile) return (await this.app.workspace.getLeaf().openFile(o), !0);
    }
    return (new j.Notice("Could not find a file to open in the project."), !1);
  }
  listAllFolders() {
    const t = this.app.vault.getRoot(),
      e = [""];
    function n(i) {
      for (const a of i.children) a instanceof j.TFolder && (e.push(a.path), n(a));
    }
    return (n(t), e);
  }
  async listProjects() {
    const t = this.listAllFolders(),
      e = t.filter((i) => !!i);
    (Z(`${H} allFolders:`, t), Z(`${H} filteredFolders:`, e));
    const n = await Yn(e, (i) => this.isProjectFolder(i));
    return (Z(`${H} found ${e.length} folders, ${n.length} projects:`, n), n);
  }
  async getProjectType(t) {
    const e = `${t}/${Gn()}`,
      n = await An(this.app, e);
    if (n && n.project_type) {
      const i = n.project_type;
      if (Object.values(rn).includes(i)) return i;
    }
    return null;
  }
  getDraftsFolder(t) {
    const e = `${t}/${oe()}`;
    let n = this.app.vault.getAbstractFileByPath(e);
    if (n && n instanceof j.TFolder) return n;
    const i = `${t}/Drafts`;
    return ((n = this.app.vault.getAbstractFileByPath(i)), n && n instanceof j.TFolder ? n : null);
  }
  async getManuscriptsFolder(t) {
    const e = `${t}/${Ns()}`,
      n = this.app.vault.getAbstractFileByPath(e);
    return n && n instanceof j.TFolder ? n : null;
  }
  async isProjectFolder(t) {
    if (!t || typeof t != "string") return !1;
    const e = t.trim().replace(/\\/g, "/").replace(/\/+$/, "");
    try {
      const n = j.normalizePath(`${e}/${Gn()}`),
        i = await this.app.vault.adapter.exists(n),
        a = j.normalizePath(`${e}/${oe()}`);
      let o = await this.app.vault.adapter.exists(a);
      if (!o) {
        const s = j.normalizePath(`${e}/Drafts`);
        o = await this.app.vault.adapter.exists(s);
      }
      if (!i && !o) return !1;
      if (i)
        try {
          const { readMetaFile: s } = await Promise.resolve().then(() => os),
            { VALID_PROJECT_TYPES: l } = await Promise.resolve().then(() => Uc),
            c = await s(this.app, n);
          if (!c || !l.includes(c.project_type)) return !1;
        } catch {
          return !1;
        }
      return !0;
    } catch {
      return !1;
    }
  }
}
class uu {
  constructor(t, e, n, i) {
    var a, o, s;
    ((this.app = t),
      (this.tpl = new Go(t)),
      (this.projectSvc = n),
      (this.backupSvc = i),
      (this.chapters = e),
      (this.manager =
        ((s =
          (o = (a = this.app.plugins).getPlugin) == null
            ? void 0
            : o.call(a, "obsidian-writeaid-plugin")) == null
          ? void 0
          : s.manager) ?? null));
  }
  resolveProjectPath(t) {
    var e;
    return t || ((e = this.manager) == null ? void 0 : e.activeProject) || null;
  }
  getDraftsFolderName(t) {
    var i;
    const e = this.app.vault.getAbstractFileByPath(t),
      n = oe((i = this.manager) == null ? void 0 : i.settings);
    if (e && e instanceof j.TFolder) {
      for (const a of e.children)
        if (a instanceof j.TFolder && a.name.toLowerCase() === n.toLowerCase()) return a.name;
    }
    return null;
  }
  async suggestNextDraftName(t) {
    var a;
    const e = this.resolveProjectPath(t);
    if (!e) return "Draft 1";
    const n = `${e}/${Gn((a = this.manager) == null ? void 0 : a.settings)}`;
    let i = 0;
    return (
      await ge(async () => {
        const o = await An(this.app, n);
        o && typeof o.total_drafts == "number" && (i = o.total_drafts);
      }),
      `Draft ${i + 1}`
    );
  }
  async createDraft(t, e, n, i) {
    var d, v;
    const a = this.resolveProjectPath(n);
    if (!a) {
      new j.Notice("No project folder detected. Please open a folder named after your project.");
      return;
    }
    const s = this.getDraftsFolderName(a) || oe((d = this.manager) == null ? void 0 : d.settings),
      l = `${a}/${s}`,
      c = `${l}/${t}`,
      p = a.split("/").pop() || a;
    if (
      (this.app.vault.getAbstractFileByPath(l) || (await this.app.vault.createFolder(l)),
      this.app.vault.getAbstractFileByPath(c) || (await this.app.vault.createFolder(c)),
      e)
    ) {
      const u = `${l}/${e}`,
        f = this.app.vault.getFiles().filter((g) => g.path.startsWith(u)),
        b = `${Ke(e, i == null ? void 0 : i.slugStyle)}.md`;
      for (const g of f) {
        let _ = g.path.substring(u.length + 1);
        _ === b && (_ = `${Ke(t, i == null ? void 0 : i.slugStyle)}.md`);
        const y = `${c}/${_}`,
          k = y.substring(0, y.lastIndexOf("/"));
        k !== c &&
          !this.app.vault.getAbstractFileByPath(k) &&
          (await this.app.vault.createFolder(k));
        let P = await this.app.vault.read(g);
        ((P = hu(P, t, p)), await this.app.vault.create(y, P));
      }
    } else {
      if ((i == null ? void 0 : i.includeDraftOutline) === !0) {
        const h = (i == null ? void 0 : i.draftOutlineTemplate) ?? "",
          b = await this.tpl.render(h, { draftName: t });
        await this.app.vault.create(`${c}/outline.md`, b);
      }
      if ((await this.projectSvc.getProjectType(a)) === rn.SINGLE) {
        const b = `${Ke(t, i == null ? void 0 : i.slugStyle)}.md`,
          g = `${c}/${b}`;
        if (!this.app.vault.getAbstractFileByPath(g)) {
          const _ = `---
draft: ${t}
project: ${p}
created: ${new Date().toISOString()}
---

`,
            y = await this.tpl.render("# {{draftName}}", { draftName: t });
          await this.app.vault.create(g, _ + y);
        }
      } else {
        const h = this.app.vault.getAbstractFileByPath(c);
        let b = !1;
        if (h && h instanceof j.TFolder) {
          for (const g of h.children)
            if (
              g instanceof j.TFile &&
              g.extension === "md" &&
              (await ge(async () => {
                const y = (await this.app.vault.read(g)).match(/^---\n([\s\S]*?)\n---/);
                if (y) {
                  const k = y[1].split(/\r?\n/);
                  for (const P of k) {
                    const D = P.match(/^order:\s*(\d+)/i);
                    if (D && !isNaN(parseInt(D[1], 10))) {
                      b = !0;
                      break;
                    }
                  }
                }
              }),
              b)
            )
              break;
        }
        b || (await this.chapters.createChapter(a, t, "Chapter 1", i));
      }
    }
    await Hn(this.app, a, t, void 0, (v = this.manager) == null ? void 0 : v.settings);
  }
  listDrafts(t) {
    var i;
    const e = this.resolveProjectPath(t);
    if ((Z(`${H} listDrafts called with projectPath:`, t, "resolved to:", e), !e)) return [];
    const n = this.projectSvc.getDraftsFolder(e);
    if (
      (Z(
        `${H} getDraftsFolder for ${e} returned:`,
        n == null ? void 0 : n.path,
        (i = n == null ? void 0 : n.children) == null ? void 0 : i.length,
      ),
      n && n instanceof j.TFolder)
    ) {
      const a = n.children.filter((o) => o instanceof j.TFolder).map((o) => o.name);
      return (Z(`${H} found drafts:`, a), a);
    }
    return [];
  }
  async openDraft(t, e) {
    var p;
    const n = this.resolveProjectPath(t);
    if (!n) return !1;
    const i = this.getDraftsFolderName(n);
    if (!i) return !1;
    const a = `${n}/${i}/${e}/${Zo((p = this.manager) == null ? void 0 : p.settings)}`,
      o = this.app.vault.getAbstractFileByPath(a);
    if (
      await ge(async () =>
        o && o instanceof j.TFile ? (await this.app.workspace.getLeaf().openFile(o), !0) : !1,
      )
    )
      return !0;
    const l = `${n}/${i}/${e}`,
      c = this.app.vault.getFiles().filter((d) => d.path.startsWith(l));
    return c.length > 0 ? (await this.app.workspace.getLeaf().openFile(c[0]), !0) : !1;
  }
  async renameDraft(t, e, n, i = !1, a) {
    var p;
    const o = this.resolveProjectPath(t);
    if (!o) return !1;
    const s = this.getDraftsFolderName(o);
    if (!s) return !1;
    const l = `${o}/${s}/${e}`,
      c = `${o}/${s}/${n}`;
    try {
      this.app.vault.getAbstractFileByPath(c) || (await this.app.vault.createFolder(c));
      const d = this.app.vault.getFiles().filter((g) => g.path.startsWith(l));
      let v = "",
        u = "";
      if (i) {
        const g = a == null ? void 0 : a.slugStyle;
        ((v = Ke(e, g)), (u = Ke(n, g)));
      }
      for (const g of d) {
        let _ = g.path.substring(l.length + 1),
          y = `${c}/${_}`;
        i && v && u && _ === `${v}.md` && ((_ = `${u}.md`), (y = `${c}/${_}`));
        let k = await this.app.vault.read(g);
        (g.extension === "md" &&
          (k = k.replace(/^(---\s*\n[\s\S]*?\n)(draft:.*\n)?/m, (P, D) =>
            D.replace(/^draft:.*\n/m, "").replace(
              /^(---\s*\n)/,
              `$1draft: ${n}
`,
            ),
          )),
          await this.app.vault.create(y, k),
          await this.app.vault.delete(g));
      }
      const f = this.app.vault.getAbstractFileByPath(l);
      (f && f instanceof j.TFolder && (await this.app.vault.delete(f, !0)),
        await ge(async () => {
          await Promise.resolve()
            .then(() => os)
            .then((g) => {
              var _;
              return g.updateMetaStats(
                this.app,
                o,
                n,
                void 0,
                (_ = this.manager) == null ? void 0 : _.settings,
              );
            });
        }));
      const h = `${c}/${Gn((p = this.manager) == null ? void 0 : p.settings)}`;
      return (
        this.app.vault.getAbstractFileByPath(h) &&
          (await ge(async () => {
            const { readMetaFile: g, writeMetaFile: _ } = await Promise.resolve().then(() => os),
              y = await g(this.app, h);
            y && ((y.draft = n), await _(this.app, h, y));
          })),
        !0
      );
    } catch {
      return !1;
    }
  }
  async deleteDraft(t, e, n = !0) {
    var s;
    const i = this.resolveProjectPath(t);
    if (!i) return !1;
    const a = this.getDraftsFolderName(i);
    if (!a) return !1;
    const o = `${i}/${a}/${e}`;
    try {
      const l = this.app.vault.getFiles().filter((p) => p.path.startsWith(o));
      n && (await this.backupSvc.createBackup(o, (s = this.manager) == null ? void 0 : s.settings));
      for (const p of l)
        await ge(async () => {
          await this.app.vault.delete(p);
        });
      const c = this.app.vault.getAbstractFileByPath(o);
      return (
        c &&
          c instanceof j.TFolder &&
          (await ge(async () => {
            await this.app.vault.delete(c);
          })),
        !0
      );
    } catch {
      return !1;
    }
  }
  async generateManuscript(t, e, n) {
    var h;
    const i = this.resolveProjectPath(t);
    if (!i) return !1;
    const a = this.getDraftsFolderName(i);
    if (!a) return !1;
    const o = await this.projectSvc.getProjectType(i),
      s = `${i}/${a}/${e}`;
    if (!this.app.vault.getAbstractFileByPath(s))
      return (new j.Notice(`Draft folder ${s} does not exist.`), !1);
    const l = `${i}/${Ns((h = this.manager) == null ? void 0 : h.settings)}`;
    this.app.vault.getAbstractFileByPath(l) || (await this.app.vault.createFolder(l));
    const c = i.split("/").pop() || i,
      p = (n == null ? void 0 : n.manuscriptNameTemplate) || "{{draftName}}";
    (Z(`${H} DraftFileService.generateManuscript - manuscriptNameTemplate: "${p}"`),
      Z(`${H} DraftFileService.generateManuscript - settings object:`, n));
    const d = Ke(e, n == null ? void 0 : n.slugStyle),
      v = await this.tpl.render(p, { draftName: e, projectName: c, draftSlug: d }),
      u = `${l}/${v}.md`;
    let f = `# Manuscript for ${e}

`;
    if (o === rn.SINGLE) {
      const b = `${d}.md`,
        g = `${s}/${b}`,
        _ = this.app.vault.getAbstractFileByPath(g);
      if (_ && _ instanceof j.TFile) {
        const y = await this.app.vault.read(_);
        f += du(fu(y));
        const k = this.app.vault.getAbstractFileByPath(u);
        if (k && k instanceof j.TFile) {
          if (!(await new qo(this.app, u).open())) return !1;
          (Z(`${H} Overwriting existing manuscript: ${u}`), await this.app.vault.modify(k, f));
        } else (Z(`${H} Creating new manuscript: ${u}`), await this.app.vault.create(u, f));
      } else return (new j.Notice(`Main draft file ${g} not found.`), !1);
    }
    return !0;
  }
}
function fu(r) {
  return r.replace(/^---\n([\s\S]*?)\n---/, "").trim();
}
function du(r) {
  return r.replace(/^#{1,6} .*\n/, "").trim();
}
function hu(r, t, e) {
  const n = r.match(/^---\n([\s\S]*?)\n---/);
  if (!n) return r;
  const i = n[1],
    a = r.substring(n[0].length),
    o = i.split(`
`),
    s = [];
  for (const c of o)
    c.match(/^draft:/i)
      ? s.push(`draft: ${t}`)
      : c.match(/^project:/i)
        ? s.push(`project: ${e}`)
        : c.match(/^created:/i)
          ? s.push(`created: ${new Date().toISOString()}`)
          : s.push(c);
  return `---
${s.join(`
`)}
---${a}`;
}
const Ko = "pen-tool",
  pu = "5";
var Ho;
typeof window < "u" &&
  ((Ho = window.__svelte ?? (window.__svelte = {})).v ?? (Ho.v = new Set())).add(pu);
let ui = !1,
  vu = !1;
function mu() {
  ui = !0;
}
mu();
const wa = 1,
  _a = 2,
  Xo = 4,
  gu = 8,
  bu = 16,
  wu = 1,
  _u = 2,
  yu = 4,
  ku = 8,
  xu = 16,
  Su = 1,
  Cu = 2,
  Jo = "[",
  ya = "[!",
  Bs = "]",
  ni = {},
  de = Symbol(),
  $u = "http://www.w3.org/1999/xhtml",
  Eu = "http://www.w3.org/2000/svg",
  Pu = "@attach",
  Qo = !1;
var fi = Array.isArray,
  Au = Array.prototype.indexOf,
  Is = Array.from,
  aa = Object.keys,
  ii = Object.defineProperty,
  wr = Object.getOwnPropertyDescriptor,
  tl = Object.getOwnPropertyDescriptors,
  Fu = Object.prototype,
  Tu = Array.prototype,
  Rs = Object.getPrototypeOf,
  vo = Object.isExtensible;
function Un(r) {
  return typeof r == "function";
}
const Se = () => {};
function Du(r) {
  return r();
}
function ls(r) {
  for (var t = 0; t < r.length; t++) r[t]();
}
function el() {
  var r,
    t,
    e = new Promise((n, i) => {
      ((r = n), (t = i));
    });
  return { promise: e, resolve: r, reject: t };
}
function Nu(r, t) {
  if (Array.isArray(r)) return r;
  if (!(Symbol.iterator in r)) return Array.from(r);
  const e = [];
  for (const n of r) if ((e.push(n), e.length === t)) break;
  return e;
}
const Oe = 2,
  zs = 4,
  ka = 8,
  Fn = 16,
  Ir = 32,
  on = 64,
  Ls = 128,
  Xe = 256,
  sa = 512,
  be = 1024,
  We = 2048,
  Rr = 4096,
  ir = 8192,
  Tn = 16384,
  Ms = 32768,
  di = 65536,
  mo = 1 << 17,
  ju = 1 << 18,
  Dn = 1 << 19,
  rl = 1 << 20,
  cs = 1 << 21,
  xa = 1 << 22,
  wn = 1 << 23,
  _r = Symbol("$state"),
  Ws = Symbol("legacy props"),
  Ou = Symbol(""),
  Si = new (class extends Error {
    constructor() {
      super(...arguments);
      ye(this, "name", "StaleReactionError");
      ye(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
    }
  })(),
  Bu = 1,
  Sa = 3,
  hi = 8;
function Ca(r) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function Iu() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Ru(r) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function zu() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Lu(r) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Mu() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Wu() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function Uu(r) {
  throw new Error("https://svelte.dev/e/lifecycle_legacy_only");
}
function Vu(r) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function Hu() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Zu() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function qu() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Gu() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
function $a(r) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
function Yu() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Ku() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
let mt = !1;
function Te(r) {
  mt = r;
}
let Ct;
function he(r) {
  if (r === null) throw ($a(), ni);
  return (Ct = r);
}
function Sn() {
  return he($r(Ct));
}
function gt(r) {
  if (mt) {
    if ($r(Ct) !== null) throw ($a(), ni);
    Ct = r;
  }
}
function Gr(r = 1) {
  if (mt) {
    for (var t = r, e = Ct; t--; ) e = $r(e);
    Ct = e;
  }
}
function oa(r = !0) {
  for (var t = 0, e = Ct; ; ) {
    if (e.nodeType === hi) {
      var n = e.data;
      if (n === Bs) {
        if (t === 0) return e;
        t -= 1;
      } else (n === Jo || n === ya) && (t += 1);
    }
    var i = $r(e);
    (r && e.remove(), (e = i));
  }
}
function nl(r) {
  if (!r || r.nodeType !== hi) throw ($a(), ni);
  return r.data;
}
function il(r) {
  return r === this.v;
}
function al(r, t) {
  return r != r
    ? t == t
    : r !== t || (r !== null && typeof r == "object") || typeof r == "function";
}
function sl(r) {
  return !al(r, this.v);
}
let Mt = null;
function ai(r) {
  Mt = r;
}
function Be(r, t = !1, e) {
  Mt = { p: Mt, c: null, e: null, s: r, x: null, l: ui && !t ? { s: null, u: null, $: [] } : null };
}
function Ie(r) {
  var t = Mt,
    e = t.e;
  if (e !== null) {
    t.e = null;
    for (var n of e) $l(n);
  }
  return (r !== void 0 && (t.x = r), (Mt = t.p), r ?? {});
}
function Oi() {
  return !ui || (Mt !== null && Mt.l === null);
}
let hn = [];
function ol() {
  var r = hn;
  ((hn = []), ls(r));
}
function kr(r) {
  if (hn.length === 0 && !Ci) {
    var t = hn;
    queueMicrotask(() => {
      t === hn && ol();
    });
  }
  hn.push(r);
}
function Xu() {
  for (; hn.length > 0; ) ol();
}
const Ju = new WeakMap();
function ll(r) {
  var t = Et;
  if (t === null) return ((Pt.f |= wn), r);
  if (t.f & Ms) si(r, t);
  else {
    if (!(t.f & Ls)) throw (!t.parent && r instanceof Error && cl(r), r);
    t.b.error(r);
  }
}
function si(r, t) {
  for (; t !== null; ) {
    if (t.f & Ls)
      try {
        t.b.error(r);
        return;
      } catch (e) {
        r = e;
      }
    t = t.parent;
  }
  throw (r instanceof Error && cl(r), r);
}
function cl(r) {
  const t = Ju.get(r);
  t && (ii(r, "message", { value: t.message }), ii(r, "stack", { value: t.stack }));
}
const Vi = new Set();
let Yt = null,
  Ji = null,
  us = new Set(),
  mr = [],
  Ea = null,
  fs = !1,
  Ci = !1;
var Jn, Qn, pn, Ti, ti, ei, vn, ri, Di, Ni, Je, ds, Qi, hs;
const qn = class qn {
  constructor() {
    It(this, Je);
    ye(this, "current", new Map());
    It(this, Jn, new Map());
    It(this, Qn, new Set());
    It(this, pn, 0);
    It(this, Ti, null);
    It(this, ti, []);
    It(this, ei, []);
    It(this, vn, []);
    It(this, ri, []);
    It(this, Di, []);
    It(this, Ni, []);
    ye(this, "skipped_effects", new Set());
  }
  process(t) {
    var a;
    ((mr = []), (Ji = null));
    var e = qn.apply(this);
    for (const o of t) fe(this, Je, ds).call(this, o);
    if (tt(this, pn) === 0) {
      fe(this, Je, hs).call(this);
      var n = tt(this, ei),
        i = tt(this, vn);
      (bt(this, ei, []),
        bt(this, vn, []),
        bt(this, ri, []),
        (Ji = this),
        (Yt = null),
        go(n),
        go(i),
        (Ji = null),
        (a = tt(this, Ti)) == null || a.resolve());
    } else
      (fe(this, Je, Qi).call(this, tt(this, ei)),
        fe(this, Je, Qi).call(this, tt(this, vn)),
        fe(this, Je, Qi).call(this, tt(this, ri)));
    e();
    for (const o of tt(this, ti)) li(o);
    bt(this, ti, []);
  }
  capture(t, e) {
    (tt(this, Jn).has(t) || tt(this, Jn).set(t, e), this.current.set(t, t.v));
  }
  activate() {
    Yt = this;
  }
  deactivate() {
    Yt = null;
  }
  flush() {
    if (mr.length > 0) {
      if ((this.activate(), ul(), Yt !== null && Yt !== this)) return;
    } else tt(this, pn) === 0 && fe(this, Je, hs).call(this);
    this.deactivate();
    for (const t of us) if ((us.delete(t), t(), Yt !== null)) break;
  }
  increment() {
    bt(this, pn, tt(this, pn) + 1);
  }
  decrement() {
    bt(this, pn, tt(this, pn) - 1);
    for (const t of tt(this, Di)) (Ce(t, We), Cn(t));
    for (const t of tt(this, Ni)) (Ce(t, Rr), Cn(t));
    this.flush();
  }
  add_callback(t) {
    tt(this, Qn).add(t);
  }
  settled() {
    return (tt(this, Ti) ?? bt(this, Ti, el())).promise;
  }
  static ensure() {
    if (Yt === null) {
      const t = (Yt = new qn());
      (Vi.add(Yt),
        Ci ||
          qn.enqueue(() => {
            Yt === t && t.flush();
          }));
    }
    return Yt;
  }
  static enqueue(t) {
    kr(t);
  }
  static apply(t) {
    return Se;
  }
};
((Jn = new WeakMap()),
  (Qn = new WeakMap()),
  (pn = new WeakMap()),
  (Ti = new WeakMap()),
  (ti = new WeakMap()),
  (ei = new WeakMap()),
  (vn = new WeakMap()),
  (ri = new WeakMap()),
  (Di = new WeakMap()),
  (Ni = new WeakMap()),
  (Je = new WeakSet()),
  (ds = function (t) {
    var c;
    t.f ^= be;
    for (var e = t.first; e !== null; ) {
      var n = e.f,
        i = (n & (Ir | on)) !== 0,
        a = i && (n & be) !== 0,
        o = a || (n & ir) !== 0 || this.skipped_effects.has(e);
      if (!o && e.fn !== null) {
        i
          ? (e.f ^= be)
          : n & zs
            ? tt(this, vn).push(e)
            : n & be ||
              (n & xa && (c = e.b) != null && c.is_pending()
                ? tt(this, ti).push(e)
                : Ii(e) && (e.f & Fn && tt(this, ri).push(e), li(e)));
        var s = e.first;
        if (s !== null) {
          e = s;
          continue;
        }
      }
      var l = e.parent;
      for (e = e.next; e === null && l !== null; ) ((e = l.next), (l = l.parent));
    }
  }),
  (Qi = function (t) {
    for (const e of t) ((e.f & We ? tt(this, Di) : tt(this, Ni)).push(e), Ce(e, be));
    t.length = 0;
  }),
  (hs = function () {
    var t;
    for (const e of tt(this, Qn)) e();
    if ((tt(this, Qn).clear(), Vi.size > 1)) {
      tt(this, Jn).clear();
      let e = !0;
      for (const n of Vi) {
        if (n === this) {
          e = !1;
          continue;
        }
        for (const [i, a] of this.current) {
          if (n.current.has(i))
            if (e) n.current.set(i, a);
            else continue;
          fl(i);
        }
        if (mr.length > 0) {
          Yt = n;
          const i = qn.apply(n);
          for (const a of mr) fe((t = n), Je, ds).call(t, a);
          ((mr = []), i());
        }
      }
      Yt = null;
    }
    Vi.delete(this);
  }));
let br = qn;
function ot(r) {
  var t = Ci;
  Ci = !0;
  try {
    for (var e; ; ) {
      if ((Xu(), mr.length === 0 && (Yt == null || Yt.flush(), mr.length === 0)))
        return ((Ea = null), e);
      ul();
    }
  } finally {
    Ci = t;
  }
}
function ul() {
  var r = Kn;
  fs = !0;
  try {
    var t = 0;
    for (_o(!0); mr.length > 0; ) {
      var e = br.ensure();
      if (t++ > 1e3) {
        var n, i;
        Qu();
      }
      (e.process(mr), nn.clear());
    }
  } finally {
    ((fs = !1), _o(r), (Ea = null));
  }
}
function Qu() {
  try {
    Mu();
  } catch (r) {
    si(r, Ea);
  }
}
let Nr = null;
function go(r) {
  var t = r.length;
  if (t !== 0) {
    for (var e = 0; e < t; ) {
      var n = r[e++];
      if (
        !(n.f & (Tn | ir)) &&
        Ii(n) &&
        ((Nr = []),
        li(n),
        n.deps === null &&
          n.first === null &&
          n.nodes_start === null &&
          (n.teardown === null && n.ac === null ? Al(n) : (n.fn = null)),
        (Nr == null ? void 0 : Nr.length) > 0)
      ) {
        nn.clear();
        for (const i of Nr) li(i);
        Nr = [];
      }
    }
    Nr = null;
  }
}
function fl(r) {
  if (r.reactions !== null)
    for (const t of r.reactions) {
      const e = t.f;
      e & Oe ? fl(t) : e & (xa | Fn) && (Ce(t, We), Cn(t));
    }
}
function Cn(r) {
  for (var t = (Ea = r); t.parent !== null; ) {
    t = t.parent;
    var e = t.f;
    if (fs && t === Et && e & Fn) return;
    if (e & (on | Ir)) {
      if (!(e & be)) return;
      t.f ^= be;
    }
  }
  mr.push(t);
}
function tf(r) {
  let t = 0,
    e = $n(0),
    n;
  return () => {
    pf() &&
      (A(e),
      Nn(
        () => (
          t === 0 && (n = Vt(() => r(() => $i(e)))),
          (t += 1),
          () => {
            kr(() => {
              ((t -= 1), t === 0 && (n == null || n(), (n = void 0), $i(e)));
            });
          }
        ),
      ));
  };
}
var ef = di | Dn | Ls;
function rf(r, t, e) {
  new nf(r, t, e);
}
var rr, Le, ji, hr, mn, pr, Ge, Ne, vr, Xr, gn, Jr, bn, Qr, ma, ga, we, dl, hl, ta, ea, ps;
class nf {
  constructor(t, e, n) {
    It(this, we);
    ye(this, "parent");
    It(this, rr, !1);
    It(this, Le);
    It(this, ji, mt ? Ct : null);
    It(this, hr);
    It(this, mn);
    It(this, pr);
    It(this, Ge, null);
    It(this, Ne, null);
    It(this, vr, null);
    It(this, Xr, null);
    It(this, gn, 0);
    It(this, Jr, 0);
    It(this, bn, !1);
    It(this, Qr, null);
    It(this, ma, () => {
      tt(this, Qr) && oi(tt(this, Qr), tt(this, gn));
    });
    It(
      this,
      ga,
      tf(
        () => (
          bt(this, Qr, $n(tt(this, gn))),
          () => {
            bt(this, Qr, null);
          }
        ),
      ),
    );
    (bt(this, Le, t),
      bt(this, hr, e),
      bt(this, mn, n),
      (this.parent = Et.b),
      bt(this, rr, !!tt(this, hr).pending),
      bt(
        this,
        pr,
        jn(() => {
          if (((Et.b = this), mt)) {
            const i = tt(this, ji);
            (Sn(),
              i.nodeType === hi && i.data === ya
                ? fe(this, we, hl).call(this)
                : fe(this, we, dl).call(this));
          } else {
            try {
              bt(
                this,
                Ge,
                xe(() => n(tt(this, Le))),
              );
            } catch (i) {
              this.error(i);
            }
            tt(this, Jr) > 0 ? fe(this, we, ea).call(this) : bt(this, rr, !1);
          }
        }, ef),
      ),
      mt && bt(this, Le, Ct));
  }
  is_pending() {
    return tt(this, rr) || (!!this.parent && this.parent.is_pending());
  }
  has_pending_snippet() {
    return !!tt(this, hr).pending;
  }
  update_pending_count(t) {
    (fe(this, we, ps).call(this, t), bt(this, gn, tt(this, gn) + t), us.add(tt(this, ma)));
  }
  get_effect_pending() {
    return (tt(this, ga).call(this), A(tt(this, Qr)));
  }
  error(t) {
    var e = tt(this, hr).onerror;
    let n = tt(this, hr).failed;
    if (tt(this, bn) || (!e && !n)) throw t;
    (tt(this, Ge) && (pe(tt(this, Ge)), bt(this, Ge, null)),
      tt(this, Ne) && (pe(tt(this, Ne)), bt(this, Ne, null)),
      tt(this, vr) && (pe(tt(this, vr)), bt(this, vr, null)),
      mt && (he(tt(this, ji)), Gr(), he(oa())));
    var i = !1,
      a = !1;
    const o = () => {
      if (i) {
        Ku();
        return;
      }
      ((i = !0),
        a && Gu(),
        br.ensure(),
        bt(this, gn, 0),
        tt(this, vr) !== null &&
          _n(tt(this, vr), () => {
            bt(this, vr, null);
          }),
        bt(this, rr, this.has_pending_snippet()),
        bt(
          this,
          Ge,
          fe(this, we, ta).call(
            this,
            () => (bt(this, bn, !1), xe(() => tt(this, mn).call(this, tt(this, Le)))),
          ),
        ),
        tt(this, Jr) > 0 ? fe(this, we, ea).call(this) : bt(this, rr, !1));
    };
    var s = Pt;
    try {
      (je(null), (a = !0), e == null || e(t, o), (a = !1));
    } catch (l) {
      si(l, tt(this, pr) && tt(this, pr).parent);
    } finally {
      je(s);
    }
    n &&
      kr(() => {
        bt(
          this,
          vr,
          fe(this, we, ta).call(this, () => {
            bt(this, bn, !0);
            try {
              return xe(() => {
                n(
                  tt(this, Le),
                  () => t,
                  () => o,
                );
              });
            } catch (l) {
              return (si(l, tt(this, pr).parent), null);
            } finally {
              bt(this, bn, !1);
            }
          }),
        );
      });
  }
}
((rr = new WeakMap()),
  (Le = new WeakMap()),
  (ji = new WeakMap()),
  (hr = new WeakMap()),
  (mn = new WeakMap()),
  (pr = new WeakMap()),
  (Ge = new WeakMap()),
  (Ne = new WeakMap()),
  (vr = new WeakMap()),
  (Xr = new WeakMap()),
  (gn = new WeakMap()),
  (Jr = new WeakMap()),
  (bn = new WeakMap()),
  (Qr = new WeakMap()),
  (ma = new WeakMap()),
  (ga = new WeakMap()),
  (we = new WeakSet()),
  (dl = function () {
    try {
      bt(
        this,
        Ge,
        xe(() => tt(this, mn).call(this, tt(this, Le))),
      );
    } catch (t) {
      this.error(t);
    }
    bt(this, rr, !1);
  }),
  (hl = function () {
    const t = tt(this, hr).pending;
    t &&
      (bt(
        this,
        Ne,
        xe(() => t(tt(this, Le))),
      ),
      br.enqueue(() => {
        (bt(
          this,
          Ge,
          fe(this, we, ta).call(
            this,
            () => (br.ensure(), xe(() => tt(this, mn).call(this, tt(this, Le)))),
          ),
        ),
          tt(this, Jr) > 0
            ? fe(this, we, ea).call(this)
            : (_n(tt(this, Ne), () => {
                bt(this, Ne, null);
              }),
              bt(this, rr, !1)));
      }));
  }),
  (ta = function (t) {
    var e = Et,
      n = Pt,
      i = Mt;
    (Sr(tt(this, pr)), je(tt(this, pr)), ai(tt(this, pr).ctx));
    try {
      return t();
    } catch (a) {
      return (ll(a), null);
    } finally {
      (Sr(e), je(n), ai(i));
    }
  }),
  (ea = function () {
    const t = tt(this, hr).pending;
    (tt(this, Ge) !== null &&
      (bt(this, Xr, document.createDocumentFragment()), af(tt(this, Ge), tt(this, Xr))),
      tt(this, Ne) === null &&
        bt(
          this,
          Ne,
          xe(() => t(tt(this, Le))),
        ));
  }),
  (ps = function (t) {
    var e;
    if (!this.has_pending_snippet()) {
      this.parent && fe((e = this.parent), we, ps).call(e, t);
      return;
    }
    (bt(this, Jr, tt(this, Jr) + t),
      tt(this, Jr) === 0 &&
        (bt(this, rr, !1),
        tt(this, Ne) &&
          _n(tt(this, Ne), () => {
            bt(this, Ne, null);
          }),
        tt(this, Xr) && (tt(this, Le).before(tt(this, Xr)), bt(this, Xr, null)),
        kr(() => {
          br.ensure().flush();
        })));
  }));
function af(r, t) {
  for (var e = r.nodes_start, n = r.nodes_end; e !== null; ) {
    var i = e === n ? null : $r(e);
    (t.append(e), (e = i));
  }
}
function pl(r, t, e) {
  const n = Oi() ? Bi : Ei;
  if (t.length === 0) {
    e(r.map(n));
    return;
  }
  var i = Yt,
    a = Et,
    o = sf(),
    s = mt;
  Promise.all(t.map((l) => of(l)))
    .then((l) => {
      o();
      try {
        e([...r.map(n), ...l]);
      } catch (c) {
        a.f & Tn || si(c, a);
      }
      (s && Te(!1), i == null || i.deactivate(), vl());
    })
    .catch((l) => {
      si(l, a);
    });
}
function sf() {
  var r = Et,
    t = Pt,
    e = Mt,
    n = Yt,
    i = mt;
  if (i) var a = Ct;
  return function () {
    (Sr(r), je(t), ai(e), n == null || n.activate(), i && (Te(!0), he(a)));
  };
}
function vl() {
  (Sr(null), je(null), ai(null));
}
function Bi(r) {
  var t = Oe | We,
    e = Pt !== null && Pt.f & Oe ? Pt : null;
  return (
    Et === null || (e !== null && e.f & Xe) ? (t |= Xe) : (Et.f |= Dn),
    {
      ctx: Mt,
      deps: null,
      effects: null,
      equals: il,
      f: t,
      fn: r,
      reactions: null,
      rv: 0,
      v: de,
      wv: 0,
      parent: e ?? Et,
      ac: null,
    }
  );
}
function of(r, t) {
  let e = Et;
  e === null && Iu();
  var n = e.b,
    i = void 0,
    a = $n(de),
    o = !Pt,
    s = new Map();
  return (
    wf(() => {
      var v;
      var l = el();
      i = l.promise;
      try {
        Promise.resolve(r()).then(l.resolve, l.reject);
      } catch (u) {
        l.reject(u);
      }
      var c = Yt,
        p = n.is_pending();
      o &&
        (n.update_pending_count(1),
        p || (c.increment(), (v = s.get(c)) == null || v.reject(Si), s.set(c, l)));
      const d = (u, f = void 0) => {
        (p || c.activate(),
          f ? f !== Si && ((a.f |= wn), oi(a, f)) : (a.f & wn && (a.f ^= wn), oi(a, u)),
          o && (n.update_pending_count(-1), p || c.decrement()),
          vl());
      };
      l.promise.then(d, (u) => d(null, u || "unknown"));
    }),
    Aa(() => {
      for (const l of s.values()) l.reject(Si);
    }),
    new Promise((l) => {
      function c(p) {
        function d() {
          p === i ? l(a) : c(i);
        }
        p.then(d, d);
      }
      c(i);
    })
  );
}
function lf(r) {
  const t = Bi(r);
  return (Dl(t), t);
}
function Ei(r) {
  const t = Bi(r);
  return ((t.equals = sl), t);
}
function ml(r) {
  var t = r.effects;
  if (t !== null) {
    r.effects = null;
    for (var e = 0; e < t.length; e += 1) pe(t[e]);
  }
}
function cf(r) {
  for (var t = r.parent; t !== null; ) {
    if (!(t.f & Oe)) return t;
    t = t.parent;
  }
  return null;
}
function Us(r) {
  var t,
    e = Et;
  Sr(cf(r));
  try {
    (ml(r), (t = Bl(r)));
  } finally {
    Sr(e);
  }
  return t;
}
function gl(r) {
  var t = Us(r);
  if ((r.equals(t) || ((r.v = t), (r.wv = jl())), !On)) {
    var e = (tn || r.f & Xe) && r.deps !== null ? Rr : be;
    Ce(r, e);
  }
}
const nn = new Map();
function $n(r, t) {
  var e = { f: 0, v: r, reactions: null, equals: il, rv: 0, wv: 0 };
  return e;
}
function qr(r, t) {
  const e = $n(r);
  return (Dl(e), e);
}
function Ft(r, t = !1, e = !0) {
  var i;
  const n = $n(r);
  return (
    t || (n.equals = sl),
    ui && e && Mt !== null && Mt.l !== null && ((i = Mt.l).s ?? (i.s = [])).push(n),
    n
  );
}
function Hi(r, t) {
  return (
    Q(
      r,
      Vt(() => A(r)),
    ),
    t
  );
}
function Q(r, t, e = !1) {
  Pt !== null &&
    (!nr || Pt.f & mo) &&
    Oi() &&
    Pt.f & (Oe | Fn | xa | mo) &&
    !(De != null && De.includes(r)) &&
    qu();
  let n = e ? Zn(t) : t;
  return oi(r, n);
}
function oi(r, t) {
  if (!r.equals(t)) {
    var e = r.v;
    (On ? nn.set(r, t) : nn.set(r, e), (r.v = t));
    var n = br.ensure();
    (n.capture(r, e),
      r.f & Oe && (r.f & We && Us(r), Ce(r, r.f & Xe ? Rr : be)),
      (r.wv = jl()),
      bl(r, We),
      Oi() &&
        Et !== null &&
        Et.f & be &&
        !(Et.f & (Ir | on)) &&
        (qe === null ? kf([r]) : qe.push(r)));
  }
  return t;
}
function $i(r) {
  Q(r, r.v + 1);
}
function bl(r, t) {
  var e = r.reactions;
  if (e !== null)
    for (var n = Oi(), i = e.length, a = 0; a < i; a++) {
      var o = e[a],
        s = o.f;
      if (!(!n && o === Et)) {
        var l = (s & We) === 0;
        (l && Ce(o, t), s & Oe ? bl(o, Rr) : l && (s & Fn && Nr !== null && Nr.push(o), Cn(o)));
      }
    }
}
function Zn(r) {
  if (typeof r != "object" || r === null || _r in r) return r;
  const t = Rs(r);
  if (t !== Fu && t !== Tu) return r;
  var e = new Map(),
    n = fi(r),
    i = qr(0),
    a = yn,
    o = (s) => {
      if (yn === a) return s();
      var l = Pt,
        c = yn;
      (je(null), ko(a));
      var p = s();
      return (je(l), ko(c), p);
    };
  return (
    n && e.set("length", qr(r.length)),
    new Proxy(r, {
      defineProperty(s, l, c) {
        (!("value" in c) || c.configurable === !1 || c.enumerable === !1 || c.writable === !1) &&
          Hu();
        var p = e.get(l);
        return (
          p === void 0
            ? (p = o(() => {
                var d = qr(c.value);
                return (e.set(l, d), d);
              }))
            : Q(p, c.value, !0),
          !0
        );
      },
      deleteProperty(s, l) {
        var c = e.get(l);
        if (c === void 0) {
          if (l in s) {
            const p = o(() => qr(de));
            (e.set(l, p), $i(i));
          }
        } else (Q(c, de), $i(i));
        return !0;
      },
      get(s, l, c) {
        var u;
        if (l === _r) return r;
        var p = e.get(l),
          d = l in s;
        if (
          (p === void 0 &&
            (!d || ((u = wr(s, l)) != null && u.writable)) &&
            ((p = o(() => {
              var f = Zn(d ? s[l] : de),
                h = qr(f);
              return h;
            })),
            e.set(l, p)),
          p !== void 0)
        ) {
          var v = A(p);
          return v === de ? void 0 : v;
        }
        return Reflect.get(s, l, c);
      },
      getOwnPropertyDescriptor(s, l) {
        var c = Reflect.getOwnPropertyDescriptor(s, l);
        if (c && "value" in c) {
          var p = e.get(l);
          p && (c.value = A(p));
        } else if (c === void 0) {
          var d = e.get(l),
            v = d == null ? void 0 : d.v;
          if (d !== void 0 && v !== de)
            return { enumerable: !0, configurable: !0, value: v, writable: !0 };
        }
        return c;
      },
      has(s, l) {
        var v;
        if (l === _r) return !0;
        var c = e.get(l),
          p = (c !== void 0 && c.v !== de) || Reflect.has(s, l);
        if (c !== void 0 || (Et !== null && (!p || ((v = wr(s, l)) != null && v.writable)))) {
          c === void 0 &&
            ((c = o(() => {
              var u = p ? Zn(s[l]) : de,
                f = qr(u);
              return f;
            })),
            e.set(l, c));
          var d = A(c);
          if (d === de) return !1;
        }
        return p;
      },
      set(s, l, c, p) {
        var y;
        var d = e.get(l),
          v = l in s;
        if (n && l === "length")
          for (var u = c; u < d.v; u += 1) {
            var f = e.get(u + "");
            f !== void 0 ? Q(f, de) : u in s && ((f = o(() => qr(de))), e.set(u + "", f));
          }
        if (d === void 0)
          (!v || ((y = wr(s, l)) != null && y.writable)) &&
            ((d = o(() => qr(void 0))), Q(d, Zn(c)), e.set(l, d));
        else {
          v = d.v !== de;
          var h = o(() => Zn(c));
          Q(d, h);
        }
        var b = Reflect.getOwnPropertyDescriptor(s, l);
        if ((b != null && b.set && b.set.call(p, c), !v)) {
          if (n && typeof l == "string") {
            var g = e.get("length"),
              _ = Number(l);
            Number.isInteger(_) && _ >= g.v && Q(g, _ + 1);
          }
          $i(i);
        }
        return !0;
      },
      ownKeys(s) {
        A(i);
        var l = Reflect.ownKeys(s).filter((d) => {
          var v = e.get(d);
          return v === void 0 || v.v !== de;
        });
        for (var [c, p] of e) p.v !== de && !(c in s) && l.push(c);
        return l;
      },
      setPrototypeOf() {
        Zu();
      },
    })
  );
}
function bo(r) {
  try {
    if (r !== null && typeof r == "object" && _r in r) return r[_r];
  } catch {}
  return r;
}
function uf(r, t) {
  return Object.is(bo(r), bo(t));
}
var la, wl, _l, yl;
function vs() {
  if (la === void 0) {
    ((la = window), (wl = /Firefox/.test(navigator.userAgent)));
    var r = Element.prototype,
      t = Node.prototype,
      e = Text.prototype;
    ((_l = wr(t, "firstChild").get),
      (yl = wr(t, "nextSibling").get),
      vo(r) &&
        ((r.__click = void 0),
        (r.__className = void 0),
        (r.__attributes = null),
        (r.__style = void 0),
        (r.__e = void 0)),
      vo(e) && (e.__t = void 0));
  }
}
function Qe(r = "") {
  return document.createTextNode(r);
}
function xr(r) {
  return _l.call(r);
}
function $r(r) {
  return yl.call(r);
}
function _t(r, t) {
  if (!mt) return xr(r);
  var e = xr(Ct);
  if (e === null) e = Ct.appendChild(Qe());
  else if (t && e.nodeType !== Sa) {
    var n = Qe();
    return (e == null || e.before(n), he(n), n);
  }
  return (he(e), e);
}
function ee(r, t = !1) {
  if (!mt) {
    var e = xr(r);
    return e instanceof Comment && e.data === "" ? $r(e) : e;
  }
  if (t && (Ct == null ? void 0 : Ct.nodeType) !== Sa) {
    var n = Qe();
    return (Ct == null || Ct.before(n), he(n), n);
  }
  return Ct;
}
function wt(r, t = 1, e = !1) {
  let n = mt ? Ct : r;
  for (var i; t--; ) ((i = n), (n = $r(n)));
  if (!mt) return n;
  if (e && (n == null ? void 0 : n.nodeType) !== Sa) {
    var a = Qe();
    return (n === null ? i == null || i.after(a) : n.before(a), he(a), a);
  }
  return (he(n), n);
}
function kl(r) {
  r.textContent = "";
}
function xl() {
  return !1;
}
function ff(r, t) {
  if (t) {
    const e = document.body;
    ((r.autofocus = !0),
      kr(() => {
        document.activeElement === e && r.focus();
      }));
  }
}
let wo = !1;
function Sl() {
  wo ||
    ((wo = !0),
    document.addEventListener(
      "reset",
      (r) => {
        Promise.resolve().then(() => {
          var t;
          if (!r.defaultPrevented)
            for (const e of r.target.elements) (t = e.__on_r) == null || t.call(e);
        });
      },
      { capture: !0 },
    ));
}
function Pa(r) {
  var t = Pt,
    e = Et;
  (je(null), Sr(null));
  try {
    return r();
  } finally {
    (je(t), Sr(e));
  }
}
function df(r, t, e, n = e) {
  r.addEventListener(t, () => Pa(e));
  const i = r.__on_r;
  (i
    ? (r.__on_r = () => {
        (i(), n(!0));
      })
    : (r.__on_r = () => n(!0)),
    Sl());
}
function Cl(r) {
  (Et === null && Pt === null && Lu(), Pt !== null && Pt.f & Xe && Et === null && zu(), On && Ru());
}
function hf(r, t) {
  var e = t.last;
  e === null ? (t.last = t.first = r) : ((e.next = r), (r.prev = e), (t.last = r));
}
function lr(r, t, e, n = !0) {
  var i = Et;
  i !== null && i.f & ir && (r |= ir);
  var a = {
    ctx: Mt,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: r | We,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: i,
    b: i && i.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null,
  };
  if (e)
    try {
      (li(a), (a.f |= Ms));
    } catch (l) {
      throw (pe(a), l);
    }
  else t !== null && Cn(a);
  if (n) {
    var o = a;
    if (
      (e &&
        o.deps === null &&
        o.teardown === null &&
        o.nodes_start === null &&
        o.first === o.last &&
        !(o.f & Dn) &&
        (o = o.first),
      o !== null && ((o.parent = i), i !== null && hf(o, i), Pt !== null && Pt.f & Oe && !(r & on)))
    ) {
      var s = Pt;
      (s.effects ?? (s.effects = [])).push(o);
    }
  }
  return a;
}
function pf() {
  return Pt !== null && !nr;
}
function Aa(r) {
  const t = lr(ka, null, !1);
  return (Ce(t, be), (t.teardown = r), t);
}
function ms(r) {
  Cl();
  var t = Et.f,
    e = !Pt && (t & Ir) !== 0 && (t & Ms) === 0;
  if (e) {
    var n = Mt;
    (n.e ?? (n.e = [])).push(r);
  } else return $l(r);
}
function $l(r) {
  return lr(zs | rl, r, !1);
}
function vf(r) {
  return (Cl(), lr(ka | rl, r, !0));
}
function mf(r) {
  br.ensure();
  const t = lr(on | Dn, r, !0);
  return () => {
    pe(t);
  };
}
function gf(r) {
  br.ensure();
  const t = lr(on | Dn, r, !0);
  return (e = {}) =>
    new Promise((n) => {
      e.outro
        ? _n(t, () => {
            (pe(t), n(void 0));
          })
        : (pe(t), n(void 0));
    });
}
function Br(r) {
  return lr(zs, r, !1);
}
function Ot(r, t) {
  var e = Mt,
    n = { effect: null, ran: !1, deps: r };
  (e.l.$.push(n),
    (n.effect = Nn(() => {
      (r(), !n.ran && ((n.ran = !0), Vt(t)));
    })));
}
function bf() {
  var r = Mt;
  Nn(() => {
    for (var t of r.l.$) {
      t.deps();
      var e = t.effect;
      (e.f & be && Ce(e, Rr), Ii(e) && li(e), (t.ran = !1));
    }
  });
}
function wf(r) {
  return lr(xa | Dn, r, !0);
}
function Nn(r, t = 0) {
  return lr(ka | t, r, !0);
}
function me(r, t = [], e = []) {
  pl(t, e, (n) => {
    lr(ka, () => r(...n.map(A)), !0);
  });
}
function jn(r, t = 0) {
  var e = lr(Fn | t, r, !0);
  return e;
}
function xe(r, t = !0) {
  return lr(Ir | Dn, r, !0, t);
}
function El(r) {
  var t = r.teardown;
  if (t !== null) {
    const e = On,
      n = Pt;
    (yo(!0), je(null));
    try {
      t.call(null);
    } finally {
      (yo(e), je(n));
    }
  }
}
function Pl(r, t = !1) {
  var e = r.first;
  for (r.first = r.last = null; e !== null; ) {
    const i = e.ac;
    i !== null &&
      Pa(() => {
        i.abort(Si);
      });
    var n = e.next;
    (e.f & on ? (e.parent = null) : pe(e, t), (e = n));
  }
}
function _f(r) {
  for (var t = r.first; t !== null; ) {
    var e = t.next;
    (t.f & Ir || pe(t), (t = e));
  }
}
function pe(r, t = !0) {
  var e = !1;
  ((t || r.f & ju) &&
    r.nodes_start !== null &&
    r.nodes_end !== null &&
    (yf(r.nodes_start, r.nodes_end), (e = !0)),
    Pl(r, t && !e),
    ca(r, 0),
    Ce(r, Tn));
  var n = r.transitions;
  if (n !== null) for (const a of n) a.stop();
  El(r);
  var i = r.parent;
  (i !== null && i.first !== null && Al(r),
    (r.next =
      r.prev =
      r.teardown =
      r.ctx =
      r.deps =
      r.fn =
      r.nodes_start =
      r.nodes_end =
      r.ac =
        null));
}
function yf(r, t) {
  for (; r !== null; ) {
    var e = r === t ? null : $r(r);
    (r.remove(), (r = e));
  }
}
function Al(r) {
  var t = r.parent,
    e = r.prev,
    n = r.next;
  (e !== null && (e.next = n),
    n !== null && (n.prev = e),
    t !== null && (t.first === r && (t.first = n), t.last === r && (t.last = e)));
}
function _n(r, t) {
  var e = [];
  (Vs(r, e, !0),
    Fl(e, () => {
      (pe(r), t && t());
    }));
}
function Fl(r, t) {
  var e = r.length;
  if (e > 0) {
    var n = () => --e || t();
    for (var i of r) i.out(n);
  } else t();
}
function Vs(r, t, e) {
  if (!(r.f & ir)) {
    if (((r.f ^= ir), r.transitions !== null))
      for (const o of r.transitions) (o.is_global || e) && t.push(o);
    for (var n = r.first; n !== null; ) {
      var i = n.next,
        a = (n.f & di) !== 0 || (n.f & Ir) !== 0;
      (Vs(n, t, a ? e : !1), (n = i));
    }
  }
}
function Fa(r) {
  Tl(r, !0);
}
function Tl(r, t) {
  if (r.f & ir) {
    ((r.f ^= ir), r.f & be || (Ce(r, We), Cn(r)));
    for (var e = r.first; e !== null; ) {
      var n = e.next,
        i = (e.f & di) !== 0 || (e.f & Ir) !== 0;
      (Tl(e, i ? t : !1), (e = n));
    }
    if (r.transitions !== null) for (const a of r.transitions) (a.is_global || t) && a.in();
  }
}
let Kn = !1;
function _o(r) {
  Kn = r;
}
let On = !1;
function yo(r) {
  On = r;
}
let Pt = null,
  nr = !1;
function je(r) {
  Pt = r;
}
let Et = null;
function Sr(r) {
  Et = r;
}
let De = null;
function Dl(r) {
  Pt !== null && (De === null ? (De = [r]) : De.push(r));
}
let Fe = null,
  ze = 0,
  qe = null;
function kf(r) {
  qe = r;
}
let Nl = 1,
  Pi = 0,
  yn = Pi;
function ko(r) {
  yn = r;
}
let tn = !1;
function jl() {
  return ++Nl;
}
function Ii(r) {
  var d;
  var t = r.f;
  if (t & We) return !0;
  if (t & Rr) {
    var e = r.deps,
      n = (t & Xe) !== 0;
    if (e !== null) {
      var i,
        a,
        o = (t & sa) !== 0,
        s = n && Et !== null && !tn,
        l = e.length;
      if ((o || s) && (Et === null || !(Et.f & Tn))) {
        var c = r,
          p = c.parent;
        for (i = 0; i < l; i++)
          ((a = e[i]),
            (o || !((d = a == null ? void 0 : a.reactions) != null && d.includes(c))) &&
              (a.reactions ?? (a.reactions = [])).push(c));
        (o && (c.f ^= sa), s && p !== null && !(p.f & Xe) && (c.f ^= Xe));
      }
      for (i = 0; i < l; i++) if (((a = e[i]), Ii(a) && gl(a), a.wv > r.wv)) return !0;
    }
    (!n || (Et !== null && !tn)) && Ce(r, be);
  }
  return !1;
}
function Ol(r, t, e = !0) {
  var n = r.reactions;
  if (n !== null && !(De != null && De.includes(r)))
    for (var i = 0; i < n.length; i++) {
      var a = n[i];
      a.f & Oe ? Ol(a, t, !1) : t === a && (e ? Ce(a, We) : a.f & be && Ce(a, Rr), Cn(a));
    }
}
function Bl(r) {
  var h;
  var t = Fe,
    e = ze,
    n = qe,
    i = Pt,
    a = tn,
    o = De,
    s = Mt,
    l = nr,
    c = yn,
    p = r.f;
  ((Fe = null),
    (ze = 0),
    (qe = null),
    (tn = (p & Xe) !== 0 && (nr || !Kn || Pt === null)),
    (Pt = p & (Ir | on) ? null : r),
    (De = null),
    ai(r.ctx),
    (nr = !1),
    (yn = ++Pi),
    r.ac !== null &&
      (Pa(() => {
        r.ac.abort(Si);
      }),
      (r.ac = null)));
  try {
    r.f |= cs;
    var d = r.fn,
      v = d(),
      u = r.deps;
    if (Fe !== null) {
      var f;
      if ((ca(r, ze), u !== null && ze > 0))
        for (u.length = ze + Fe.length, f = 0; f < Fe.length; f++) u[ze + f] = Fe[f];
      else r.deps = u = Fe;
      if (!tn || (p & Oe && r.reactions !== null))
        for (f = ze; f < u.length; f++) ((h = u[f]).reactions ?? (h.reactions = [])).push(r);
    } else u !== null && ze < u.length && (ca(r, ze), (u.length = ze));
    if (Oi() && qe !== null && !nr && u !== null && !(r.f & (Oe | Rr | We)))
      for (f = 0; f < qe.length; f++) Ol(qe[f], r);
    return (
      i !== null && i !== r && (Pi++, qe !== null && (n === null ? (n = qe) : n.push(...qe))),
      r.f & wn && (r.f ^= wn),
      v
    );
  } catch (b) {
    return ll(b);
  } finally {
    ((r.f ^= cs),
      (Fe = t),
      (ze = e),
      (qe = n),
      (Pt = i),
      (tn = a),
      (De = o),
      ai(s),
      (nr = l),
      (yn = c));
  }
}
function xf(r, t) {
  let e = t.reactions;
  if (e !== null) {
    var n = Au.call(e, r);
    if (n !== -1) {
      var i = e.length - 1;
      i === 0 ? (e = t.reactions = null) : ((e[n] = e[i]), e.pop());
    }
  }
  e === null &&
    t.f & Oe &&
    (Fe === null || !Fe.includes(t)) &&
    (Ce(t, Rr), t.f & (Xe | sa) || (t.f ^= sa), ml(t), ca(t, 0));
}
function ca(r, t) {
  var e = r.deps;
  if (e !== null) for (var n = t; n < e.length; n++) xf(r, e[n]);
}
function li(r) {
  var t = r.f;
  if (!(t & Tn)) {
    Ce(r, be);
    var e = Et,
      n = Kn;
    ((Et = r), (Kn = !0));
    try {
      (t & Fn ? _f(r) : Pl(r), El(r));
      var i = Bl(r);
      ((r.teardown = typeof i == "function" ? i : null), (r.wv = Nl));
      var a;
      Qo && vu && r.f & We && r.deps;
    } finally {
      ((Kn = n), (Et = e));
    }
  }
}
async function Sf() {
  (await Promise.resolve(), ot());
}
function A(r) {
  var t = r.f,
    e = (t & Oe) !== 0;
  if (Pt !== null && !nr) {
    var n = Et !== null && (Et.f & Tn) !== 0;
    if (!n && !(De != null && De.includes(r))) {
      var i = Pt.deps;
      if (Pt.f & cs)
        r.rv < Pi &&
          ((r.rv = Pi),
          Fe === null && i !== null && i[ze] === r
            ? ze++
            : Fe === null
              ? (Fe = [r])
              : (!tn || !Fe.includes(r)) && Fe.push(r));
      else {
        (Pt.deps ?? (Pt.deps = [])).push(r);
        var a = r.reactions;
        a === null ? (r.reactions = [Pt]) : a.includes(Pt) || a.push(Pt);
      }
    }
  } else if (e && r.deps === null && r.effects === null) {
    var o = r,
      s = o.parent;
    s !== null && !(s.f & Xe) && (o.f ^= Xe);
  }
  if (On) {
    if (nn.has(r)) return nn.get(r);
    if (e) {
      o = r;
      var l = o.v;
      return (((!(o.f & be) && o.reactions !== null) || Il(o)) && (l = Us(o)), nn.set(o, l), l);
    }
  } else e && ((o = r), Ii(o) && gl(o));
  if (r.f & wn) throw r.v;
  return r.v;
}
function Il(r) {
  if (r.v === de) return !0;
  if (r.deps === null) return !1;
  for (const t of r.deps) if (nn.has(t) || (t.f & Oe && Il(t))) return !0;
  return !1;
}
function Vt(r) {
  var t = nr;
  try {
    return ((nr = !0), r());
  } finally {
    nr = t;
  }
}
const Cf = -7169;
function Ce(r, t) {
  r.f = (r.f & Cf) | t;
}
function nt(r) {
  if (!(typeof r != "object" || !r || r instanceof EventTarget)) {
    if (_r in r) gs(r);
    else if (!Array.isArray(r))
      for (let t in r) {
        const e = r[t];
        typeof e == "object" && e && _r in e && gs(e);
      }
  }
}
function gs(r, t = new Set()) {
  if (typeof r == "object" && r !== null && !(r instanceof EventTarget) && !t.has(r)) {
    (t.add(r), r instanceof Date && r.getTime());
    for (let n in r)
      try {
        gs(r[n], t);
      } catch {}
    const e = Rs(r);
    if (
      e !== Object.prototype &&
      e !== Array.prototype &&
      e !== Map.prototype &&
      e !== Set.prototype &&
      e !== Date.prototype
    ) {
      const n = tl(e);
      for (let i in n) {
        const a = n[i].get;
        if (a)
          try {
            a.call(r);
          } catch {}
      }
    }
  }
}
const Rl = new Set(),
  bs = new Set();
function zl(r, t, e, n = {}) {
  function i(a) {
    if ((n.capture || ki.call(t, a), !a.cancelBubble))
      return Pa(() => (e == null ? void 0 : e.call(this, a)));
  }
  return (
    r.startsWith("pointer") || r.startsWith("touch") || r === "wheel"
      ? kr(() => {
          t.addEventListener(r, i, n);
        })
      : t.addEventListener(r, i, n),
    i
  );
}
function se(r, t, e, n, i) {
  var a = { capture: n, passive: i },
    o = zl(r, t, e, a);
  (t === document.body || t === window || t === document || t instanceof HTMLMediaElement) &&
    Aa(() => {
      t.removeEventListener(r, o, a);
    });
}
function Hs(r) {
  for (var t = 0; t < r.length; t++) Rl.add(r[t]);
  for (var e of bs) e(r);
}
let xo = null;
function ki(r) {
  var _;
  var t = this,
    e = t.ownerDocument,
    n = r.type,
    i = ((_ = r.composedPath) == null ? void 0 : _.call(r)) || [],
    a = i[0] || r.target;
  xo = r;
  var o = 0,
    s = xo === r && r.__root;
  if (s) {
    var l = i.indexOf(s);
    if (l !== -1 && (t === document || t === window)) {
      r.__root = t;
      return;
    }
    var c = i.indexOf(t);
    if (c === -1) return;
    l <= c && (o = l);
  }
  if (((a = i[o] || r.target), a !== t)) {
    ii(r, "currentTarget", {
      configurable: !0,
      get() {
        return a || e;
      },
    });
    var p = Pt,
      d = Et;
    (je(null), Sr(null));
    try {
      for (var v, u = []; a !== null; ) {
        var f = a.assignedSlot || a.parentNode || a.host || null;
        try {
          var h = a["__" + n];
          if (h != null && (!a.disabled || r.target === a))
            if (fi(h)) {
              var [b, ...g] = h;
              b.apply(a, [r, ...g]);
            } else h.call(a, r);
        } catch (y) {
          v ? u.push(y) : (v = y);
        }
        if (r.cancelBubble || f === t || f === null) break;
        a = f;
      }
      if (v) {
        for (let y of u)
          queueMicrotask(() => {
            throw y;
          });
        throw v;
      }
    } finally {
      ((r.__root = t), delete r.currentTarget, je(p), Sr(d));
    }
  }
}
function Ll(r) {
  var t = document.createElement("template");
  return ((t.innerHTML = r.replaceAll("<!>", "<!---->")), t.content);
}
function ar(r, t) {
  var e = Et;
  e.nodes_start === null && ((e.nodes_start = r), (e.nodes_end = t));
}
function Rt(r, t) {
  var e = (t & Su) !== 0,
    n = (t & Cu) !== 0,
    i,
    a = !r.startsWith("<!>");
  return () => {
    if (mt) return (ar(Ct, null), Ct);
    i === void 0 && ((i = Ll(a ? r : "<!>" + r)), e || (i = xr(i)));
    var o = n || wl ? document.importNode(i, !0) : i.cloneNode(!0);
    if (e) {
      var s = xr(o),
        l = o.lastChild;
      ar(s, l);
    } else ar(o, o);
    return o;
  };
}
function $f(r, t, e = "svg") {
  var n = !r.startsWith("<!>"),
    i = `<${e}>${n ? r : "<!>" + r}</${e}>`,
    a;
  return () => {
    if (mt) return (ar(Ct, null), Ct);
    if (!a) {
      var o = Ll(i),
        s = xr(o);
      a = xr(s);
    }
    var l = a.cloneNode(!0);
    return (ar(l, l), l);
  };
}
function Ta(r, t) {
  return $f(r, t, "svg");
}
function dr(r = "") {
  if (!mt) {
    var t = Qe(r + "");
    return (ar(t, t), t);
  }
  var e = Ct;
  return (e.nodeType !== Sa && (e.before((e = Qe())), he(e)), ar(e, e), e);
}
function ie() {
  if (mt) return (ar(Ct, null), Ct);
  var r = document.createDocumentFragment(),
    t = document.createComment(""),
    e = Qe();
  return (r.append(t, e), ar(t, e), r);
}
function ct(r, t) {
  if (mt) {
    ((Et.nodes_end = Ct), Sn());
    return;
  }
  r !== null && r.before(t);
}
function Ef(r) {
  return r.endsWith("capture") && r !== "gotpointercapture" && r !== "lostpointercapture";
}
const Pf = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart",
];
function Af(r) {
  return Pf.includes(r);
}
const Ff = {
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly",
  defaultvalue: "defaultValue",
  defaultchecked: "defaultChecked",
  srcobject: "srcObject",
  novalidate: "noValidate",
  allowfullscreen: "allowFullscreen",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback",
};
function Tf(r) {
  return ((r = r.toLowerCase()), Ff[r] ?? r);
}
const Df = ["touchstart", "touchmove"];
function Nf(r) {
  return Df.includes(r);
}
const jf = ["textarea", "script", "style", "title"];
function Of(r) {
  return jf.includes(r);
}
function Yr(r, t) {
  var e = t == null ? "" : typeof t == "object" ? t + "" : t;
  e !== (r.__t ?? (r.__t = r.nodeValue)) && ((r.__t = e), (r.nodeValue = e + ""));
}
function Zs(r, t) {
  return Ml(r, t);
}
function Bf(r, t) {
  (vs(), (t.intro = t.intro ?? !1));
  const e = t.target,
    n = mt,
    i = Ct;
  try {
    for (var a = xr(e); a && (a.nodeType !== hi || a.data !== Jo); ) a = $r(a);
    if (!a) throw ni;
    (Te(!0), he(a));
    const o = Ml(r, { ...t, anchor: a });
    return (Te(!1), o);
  } catch (o) {
    if (
      o instanceof Error &&
      o.message
        .split(
          `
`,
        )
        .some((s) => s.startsWith("https://svelte.dev/e/"))
    )
      throw o;
    return (
      o !== ni && console.warn("Failed to hydrate: ", o),
      t.recover === !1 && Wu(),
      vs(),
      kl(e),
      Te(!1),
      Zs(r, t)
    );
  } finally {
    (Te(n), he(i));
  }
}
const Ln = new Map();
function Ml(r, { target: t, anchor: e, props: n = {}, events: i, context: a, intro: o = !0 }) {
  vs();
  var s = new Set(),
    l = (d) => {
      for (var v = 0; v < d.length; v++) {
        var u = d[v];
        if (!s.has(u)) {
          s.add(u);
          var f = Nf(u);
          t.addEventListener(u, ki, { passive: f });
          var h = Ln.get(u);
          h === void 0
            ? (document.addEventListener(u, ki, { passive: f }), Ln.set(u, 1))
            : Ln.set(u, h + 1);
        }
      }
    };
  (l(Is(Rl)), bs.add(l));
  var c = void 0,
    p = gf(() => {
      var d = e ?? t.appendChild(Qe());
      return (
        rf(d, { pending: () => {} }, (v) => {
          if (a) {
            Be({});
            var u = Mt;
            u.c = a;
          }
          if (
            (i && (n.$$events = i),
            mt && ar(v, null),
            (c = r(v, n) || {}),
            mt && ((Et.nodes_end = Ct), Ct === null || Ct.nodeType !== hi || Ct.data !== Bs))
          )
            throw ($a(), ni);
          a && Ie();
        }),
        () => {
          var f;
          for (var v of s) {
            t.removeEventListener(v, ki);
            var u = Ln.get(v);
            --u === 0 ? (document.removeEventListener(v, ki), Ln.delete(v)) : Ln.set(v, u);
          }
          (bs.delete(l), d !== e && ((f = d.parentNode) == null || f.removeChild(d)));
        }
      );
    });
  return (ws.set(c, p), c);
}
let ws = new WeakMap();
function If(r, t) {
  const e = ws.get(r);
  return e ? (ws.delete(r), e(t)) : Promise.resolve();
}
function zr(r, t, ...e) {
  var n = r,
    i = Se,
    a;
  (jn(() => {
    i !== (i = t()) && (a && (pe(a), (a = null)), (a = xe(() => i(n, ...e))));
  }, di),
    mt && (n = Ct));
}
function qs(r) {
  (Mt === null && Ca(),
    ui && Mt.l !== null
      ? Wl(Mt).m.push(r)
      : ms(() => {
          const t = Vt(r);
          if (typeof t == "function") return t;
        }));
}
function Gs(r) {
  (Mt === null && Ca(), qs(() => () => Vt(r)));
}
function Rf(r, t, { bubbles: e = !1, cancelable: n = !1 } = {}) {
  return new CustomEvent(r, { detail: t, bubbles: e, cancelable: n });
}
function zf() {
  const r = Mt;
  return (
    r === null && Ca(),
    (t, e, n) => {
      var a;
      const i = (a = r.s.$$events) == null ? void 0 : a[t];
      if (i) {
        const o = fi(i) ? i.slice() : [i],
          s = Rf(t, e, n);
        for (const l of o) l.call(r.x, s);
        return !s.defaultPrevented;
      }
      return !0;
    }
  );
}
function Lf(r) {
  (Mt === null && Ca(), Mt.l === null && Uu(), Wl(Mt).b.push(r));
}
function Wl(r) {
  var t = r.l;
  return t.u ?? (t.u = { a: [], b: [], m: [] });
}
function Ut(r, t, e = !1) {
  mt && Sn();
  var n = r,
    i = null,
    a = null,
    o = de,
    s = e ? di : 0,
    l = !1;
  const c = (u, f = !0) => {
    ((l = !0), v(f, u));
  };
  var p = null;
  function d() {
    p !== null && (p.lastChild.remove(), n.before(p), (p = null));
    var u = o ? i : a,
      f = o ? a : i;
    (u && Fa(u),
      f &&
        _n(f, () => {
          o ? (a = null) : (i = null);
        }));
  }
  const v = (u, f) => {
    if (o === (o = u)) return;
    let h = !1;
    if (mt) {
      const P = nl(n) === ya;
      !!o === P && ((n = oa()), he(n), Te(!1), (h = !0));
    }
    var b = xl(),
      g = n;
    if (
      (b && ((p = document.createDocumentFragment()), p.append((g = Qe()))),
      o ? (i ?? (i = f && xe(() => f(g)))) : (a ?? (a = f && xe(() => f(g)))),
      b)
    ) {
      var _ = Yt,
        y = o ? i : a,
        k = o ? a : i;
      (y && _.skipped_effects.delete(y), k && _.skipped_effects.add(k), _.add_callback(d));
    } else d();
    h && Te(!0);
  };
  (jn(() => {
    ((l = !1), t(c), l || v(null, null));
  }, s),
    mt && (n = Ct));
}
let kn = null;
function So(r) {
  kn = r;
}
function ua(r, t) {
  return t;
}
function Mf(r, t, e) {
  for (var n = r.items, i = [], a = t.length, o = 0; o < a; o++) Vs(t[o].e, i, !0);
  var s = a > 0 && i.length === 0 && e !== null;
  if (s) {
    var l = e.parentNode;
    (kl(l), l.append(e), n.clear(), fr(r, t[0].prev, t[a - 1].next));
  }
  Fl(i, () => {
    for (var c = 0; c < a; c++) {
      var p = t[c];
      (s || (n.delete(p.k), fr(r, p.prev, p.next)), pe(p.e, !s));
    }
  });
}
function Ai(r, t, e, n, i, a = null) {
  var o = r,
    s = { flags: t, items: new Map(), first: null },
    l = (t & Xo) !== 0;
  if (l) {
    var c = r;
    o = mt ? he(xr(c)) : c.appendChild(Qe());
  }
  mt && Sn();
  var p = null,
    d = !1,
    v = new Map(),
    u = Ei(() => {
      var g = e();
      return fi(g) ? g : g == null ? [] : Is(g);
    }),
    f,
    h;
  function b() {
    (Wf(h, f, s, v, o, i, t, n, e),
      a !== null &&
        (f.length === 0
          ? p
            ? Fa(p)
            : (p = xe(() => a(o)))
          : p !== null &&
            _n(p, () => {
              p = null;
            })));
  }
  (jn(() => {
    (h ?? (h = Et), (f = A(u)));
    var g = f.length;
    if (d && g === 0) return;
    d = g === 0;
    let _ = !1;
    if (mt) {
      var y = nl(o) === ya;
      y !== (g === 0) && ((o = oa()), he(o), Te(!1), (_ = !0));
    }
    if (mt) {
      for (var k = null, P, D = 0; D < g; D++) {
        if (Ct.nodeType === hi && Ct.data === Bs) {
          ((o = Ct), (_ = !0), Te(!1));
          break;
        }
        var T = f[D],
          S = n(T, D);
        ((P = _s(Ct, s, k, null, T, S, D, i, t, e)), s.items.set(S, P), (k = P));
      }
      g > 0 && he(oa());
    }
    if (mt) g === 0 && a && (p = xe(() => a(o)));
    else if (xl()) {
      var O = new Set(),
        V = Yt;
      for (D = 0; D < g; D += 1) {
        ((T = f[D]), (S = n(T, D)));
        var at = s.items.get(S) ?? v.get(S);
        (at
          ? t & (wa | _a) && Ul(at, T, D, t)
          : ((P = _s(null, s, null, null, T, S, D, i, t, e, !0)), v.set(S, P)),
          O.add(S));
      }
      for (const [E, B] of s.items) O.has(E) || V.skipped_effects.add(B.e);
      V.add_callback(b);
    } else b();
    (_ && Te(!0), A(u));
  }),
    mt && (o = Ct));
}
function Wf(r, t, e, n, i, a, o, s, l) {
  var Y, dt, R, I;
  var c = (o & gu) !== 0,
    p = (o & (wa | _a)) !== 0,
    d = t.length,
    v = e.items,
    u = e.first,
    f = u,
    h,
    b = null,
    g,
    _ = [],
    y = [],
    k,
    P,
    D,
    T;
  if (c)
    for (T = 0; T < d; T += 1)
      ((k = t[T]),
        (P = s(k, T)),
        (D = v.get(P)),
        D !== void 0 && ((Y = D.a) == null || Y.measure(), (g ?? (g = new Set())).add(D)));
  for (T = 0; T < d; T += 1) {
    if (((k = t[T]), (P = s(k, T)), (D = v.get(P)), D === void 0)) {
      var S = n.get(P);
      if (S !== void 0) {
        (n.delete(P), v.set(P, S));
        var O = b ? b.next : f;
        (fr(e, b, S), fr(e, S, O), Xa(S, O, i), (b = S));
      } else {
        var V = f ? f.e.nodes_start : i;
        b = _s(V, e, b, b === null ? e.first : b.next, k, P, T, a, o, l);
      }
      (v.set(P, b), (_ = []), (y = []), (f = b.next));
      continue;
    }
    if (
      (p && Ul(D, k, T, o),
      D.e.f & ir &&
        (Fa(D.e), c && ((dt = D.a) == null || dt.unfix(), (g ?? (g = new Set())).delete(D))),
      D !== f)
    ) {
      if (h !== void 0 && h.has(D)) {
        if (_.length < y.length) {
          var at = y[0],
            E;
          b = at.prev;
          var B = _[0],
            w = _[_.length - 1];
          for (E = 0; E < _.length; E += 1) Xa(_[E], at, i);
          for (E = 0; E < y.length; E += 1) h.delete(y[E]);
          (fr(e, B.prev, w.next),
            fr(e, b, B),
            fr(e, w, at),
            (f = at),
            (b = w),
            (T -= 1),
            (_ = []),
            (y = []));
        } else
          (h.delete(D),
            Xa(D, f, i),
            fr(e, D.prev, D.next),
            fr(e, D, b === null ? e.first : b.next),
            fr(e, b, D),
            (b = D));
        continue;
      }
      for (_ = [], y = []; f !== null && f.k !== P; )
        (f.e.f & ir || (h ?? (h = new Set())).add(f), y.push(f), (f = f.next));
      if (f === null) continue;
      D = f;
    }
    (_.push(D), (b = D), (f = D.next));
  }
  if (f !== null || h !== void 0) {
    for (var U = h === void 0 ? [] : Is(h); f !== null; ) (f.e.f & ir || U.push(f), (f = f.next));
    var ft = U.length;
    if (ft > 0) {
      var J = o & Xo && d === 0 ? i : null;
      if (c) {
        for (T = 0; T < ft; T += 1) (R = U[T].a) == null || R.measure();
        for (T = 0; T < ft; T += 1) (I = U[T].a) == null || I.fix();
      }
      Mf(e, U, J);
    }
  }
  (c &&
    kr(() => {
      var ut;
      if (g !== void 0) for (D of g) (ut = D.a) == null || ut.apply();
    }),
    (r.first = e.first && e.first.e),
    (r.last = b && b.e));
  for (var rt of n.values()) pe(rt.e);
  n.clear();
}
function Ul(r, t, e, n) {
  (n & wa && oi(r.v, t), n & _a ? oi(r.i, e) : (r.i = e));
}
function _s(r, t, e, n, i, a, o, s, l, c, p) {
  var d = kn,
    v = (l & wa) !== 0,
    u = (l & bu) === 0,
    f = v ? (u ? Ft(i, !1, !1) : $n(i)) : i,
    h = l & _a ? $n(o) : o,
    b = { i: h, v: f, k: a, a: null, e: null, prev: e, next: n };
  kn = b;
  try {
    if (r === null) {
      var g = document.createDocumentFragment();
      g.append((r = Qe()));
    }
    return (
      (b.e = xe(() => s(r, f, h, c), mt)),
      (b.e.prev = e && e.e),
      (b.e.next = n && n.e),
      e === null ? p || (t.first = b) : ((e.next = b), (e.e.next = b.e)),
      n !== null && ((n.prev = b), (n.e.prev = b.e)),
      b
    );
  } finally {
    kn = d;
  }
}
function Xa(r, t, e) {
  for (
    var n = r.next ? r.next.e.nodes_start : e, i = t ? t.e.nodes_start : e, a = r.e.nodes_start;
    a !== null && a !== n;

  ) {
    var o = $r(a);
    (i.before(a), (a = o));
  }
}
function fr(r, t, e) {
  (t === null ? (r.first = e) : ((t.next = e), (t.e.next = e && e.e)),
    e !== null && ((e.prev = t), (e.e.prev = t && t.e)));
}
function ke(r, t, e, n, i) {
  var s;
  mt && Sn();
  var a = (s = t.$$slots) == null ? void 0 : s[e],
    o = !1;
  (a === !0 && ((a = t[e === "default" ? "children" : e]), (o = !0)),
    a === void 0 ? i !== null && i(r) : a(r, o ? () => n : n));
}
function Uf(r) {
  const t = {};
  r.children && (t.default = !0);
  for (const e in r.$$slots) t[e] = !0;
  return t;
}
function Vf(r, t, e, n, i, a) {
  let o = mt;
  mt && Sn();
  var s,
    l,
    c = null;
  mt && Ct.nodeType === Bu && ((c = Ct), Sn());
  var p = mt ? Ct : r,
    d,
    v = kn;
  (jn(() => {
    const u = t() || null;
    var f = Eu;
    if (u !== s) {
      var h = kn;
      (So(v),
        d &&
          (u === null
            ? _n(d, () => {
                ((d = null), (l = null));
              })
            : u === l
              ? Fa(d)
              : pe(d)),
        u &&
          u !== l &&
          (d = xe(() => {
            if (((c = mt ? c : document.createElementNS(f, u)), ar(c, c), n)) {
              mt && Of(u) && c.append(document.createComment(""));
              var b = mt ? xr(c) : c.appendChild(Qe());
              (mt && (b === null ? Te(!1) : he(b)), n(c, b));
            }
            ((Et.nodes_end = c), p.before(c));
          })),
        (s = u),
        s && (l = s),
        So(h));
    }
  }, di),
    o && (Te(!0), he(p)));
}
function pi(r, t) {
  Br(() => {
    var e = r.getRootNode(),
      n = e.host ? e : (e.head ?? e.ownerDocument.head);
    if (!n.querySelector("#" + t.hash)) {
      const i = document.createElement("style");
      ((i.id = t.hash), (i.textContent = t.code), n.appendChild(i));
    }
  });
}
function Zi(r, t, e) {
  Br(() => {
    var n = Vt(() => t(r, e == null ? void 0 : e()) || {});
    if (e && n != null && n.update) {
      var i = !1,
        a = {};
      (Nn(() => {
        var o = e();
        (nt(o), i && al(a, o) && ((a = o), n.update(o)));
      }),
        (i = !0));
    }
    if (n != null && n.destroy) return () => n.destroy();
  });
}
function Hf(r, t) {
  var e = void 0,
    n;
  jn(() => {
    e !== (e = t()) &&
      (n && (pe(n), (n = null)),
      e &&
        (n = xe(() => {
          Br(() => e(r));
        })));
  });
}
function Vl(r) {
  var t,
    e,
    n = "";
  if (typeof r == "string" || typeof r == "number") n += r;
  else if (typeof r == "object")
    if (Array.isArray(r)) {
      var i = r.length;
      for (t = 0; t < i; t++) r[t] && (e = Vl(r[t])) && (n && (n += " "), (n += e));
    } else for (e in r) r[e] && (n && (n += " "), (n += e));
  return n;
}
function Zf() {
  for (var r, t, e = 0, n = "", i = arguments.length; e < i; e++)
    (r = arguments[e]) && (t = Vl(r)) && (n && (n += " "), (n += t));
  return n;
}
function Hl(r) {
  return typeof r == "object" ? Zf(r) : (r ?? "");
}
const Co = [
  ...` 	
\r\f \v\uFEFF`,
];
function qf(r, t, e) {
  var n = r == null ? "" : "" + r;
  if ((t && (n = n ? n + " " + t : t), e)) {
    for (var i in e)
      if (e[i]) n = n ? n + " " + i : i;
      else if (n.length)
        for (var a = i.length, o = 0; (o = n.indexOf(i, o)) >= 0; ) {
          var s = o + a;
          (o === 0 || Co.includes(n[o - 1])) && (s === n.length || Co.includes(n[s]))
            ? (n = (o === 0 ? "" : n.substring(0, o)) + n.substring(s + 1))
            : (o = s);
        }
  }
  return n === "" ? null : n;
}
function $o(r, t = !1) {
  var e = t ? " !important;" : ";",
    n = "";
  for (var i in r) {
    var a = r[i];
    a != null && a !== "" && (n += " " + i + ": " + a + e);
  }
  return n;
}
function Ja(r) {
  return r[0] !== "-" || r[1] !== "-" ? r.toLowerCase() : r;
}
function Gf(r, t) {
  if (t) {
    var e = "",
      n,
      i;
    if ((Array.isArray(t) ? ((n = t[0]), (i = t[1])) : (n = t), r)) {
      r = String(r)
        .replaceAll(/\s*\/\*.*?\*\/\s*/g, "")
        .trim();
      var a = !1,
        o = 0,
        s = !1,
        l = [];
      (n && l.push(...Object.keys(n).map(Ja)), i && l.push(...Object.keys(i).map(Ja)));
      var c = 0,
        p = -1;
      const h = r.length;
      for (var d = 0; d < h; d++) {
        var v = r[d];
        if (
          (s
            ? v === "/" && r[d - 1] === "*" && (s = !1)
            : a
              ? a === v && (a = !1)
              : v === "/" && r[d + 1] === "*"
                ? (s = !0)
                : v === '"' || v === "'"
                  ? (a = v)
                  : v === "("
                    ? o++
                    : v === ")" && o--,
          !s && a === !1 && o === 0)
        ) {
          if (v === ":" && p === -1) p = d;
          else if (v === ";" || d === h - 1) {
            if (p !== -1) {
              var u = Ja(r.substring(c, p).trim());
              if (!l.includes(u)) {
                v !== ";" && d++;
                var f = r.substring(c, d).trim();
                e += " " + f + ";";
              }
            }
            ((c = d + 1), (p = -1));
          }
        }
      }
    }
    return (n && (e += $o(n)), i && (e += $o(i, !0)), (e = e.trim()), e === "" ? null : e);
  }
  return r == null ? null : String(r);
}
function gr(r, t, e, n, i, a) {
  var o = r.__className;
  if (mt || o !== e || o === void 0) {
    var s = qf(e, n, a);
    ((!mt || s !== r.getAttribute("class")) &&
      (s == null ? r.removeAttribute("class") : t ? (r.className = s) : r.setAttribute("class", s)),
      (r.__className = e));
  } else if (a && i !== a)
    for (var l in a) {
      var c = !!a[l];
      (i == null || c !== !!i[l]) && r.classList.toggle(l, c);
    }
  return a;
}
function Qa(r, t = {}, e, n) {
  for (var i in e) {
    var a = e[i];
    t[i] !== a && (e[i] == null ? r.style.removeProperty(i) : r.style.setProperty(i, a, n));
  }
}
function Ys(r, t, e, n) {
  var i = r.__style;
  if (mt || i !== t) {
    var a = Gf(t, n);
    ((!mt || a !== r.getAttribute("style")) &&
      (a == null ? r.removeAttribute("style") : (r.style.cssText = a)),
      (r.__style = t));
  } else
    n &&
      (Array.isArray(n)
        ? (Qa(r, e == null ? void 0 : e[0], n[0]),
          Qa(r, e == null ? void 0 : e[1], n[1], "important"))
        : Qa(r, e, n));
  return n;
}
function ys(r, t, e = !1) {
  if (r.multiple) {
    if (t == null) return;
    if (!fi(t)) return Yu();
    for (var n of r.options) n.selected = t.includes(Eo(n));
    return;
  }
  for (n of r.options) {
    var i = Eo(n);
    if (uf(i, t)) {
      n.selected = !0;
      return;
    }
  }
  (!e || t !== void 0) && (r.selectedIndex = -1);
}
function Yf(r) {
  var t = new MutationObserver(() => {
    ys(r, r.__value);
  });
  (t.observe(r, { childList: !0, subtree: !0, attributes: !0, attributeFilter: ["value"] }),
    Aa(() => {
      t.disconnect();
    }));
}
function Eo(r) {
  return "__value" in r ? r.__value : r.value;
}
const _i = Symbol("class"),
  yi = Symbol("style"),
  Zl = Symbol("is custom element"),
  ql = Symbol("is html");
function fa(r) {
  if (mt) {
    var t = !1,
      e = () => {
        if (!t) {
          if (((t = !0), r.hasAttribute("value"))) {
            var n = r.value;
            (an(r, "value", null), (r.value = n));
          }
          if (r.hasAttribute("checked")) {
            var i = r.checked;
            (an(r, "checked", null), (r.checked = i));
          }
        }
      };
    ((r.__on_r = e), kr(e), Sl());
  }
}
function ks(r, t) {
  var e = Ks(r);
  e.value === (e.value = t ?? void 0) ||
    (r.value === t && (t !== 0 || r.nodeName !== "PROGRESS")) ||
    (r.value = t ?? "");
}
function Kf(r, t) {
  t ? r.hasAttribute("selected") || r.setAttribute("selected", "") : r.removeAttribute("selected");
}
function an(r, t, e, n) {
  var i = Ks(r);
  (mt &&
    ((i[t] = r.getAttribute(t)),
    t === "src" || t === "srcset" || (t === "href" && r.nodeName === "LINK"))) ||
    (i[t] !== (i[t] = e) &&
      (t === "loading" && (r[Ou] = e),
      e == null
        ? r.removeAttribute(t)
        : typeof e != "string" && Gl(r).includes(t)
          ? (r[t] = e)
          : r.setAttribute(t, e)));
}
function Xf(r, t, e, n, i = !1, a = !1) {
  if (mt && i && r.tagName === "INPUT") {
    var o = r,
      s = o.type === "checkbox" ? "defaultChecked" : "defaultValue";
    s in e || fa(o);
  }
  var l = Ks(r),
    c = l[Zl],
    p = !l[ql];
  let d = mt && c;
  d && Te(!1);
  var v = t || {},
    u = r.tagName === "OPTION";
  for (var f in t) f in e || (e[f] = null);
  (e.class ? (e.class = Hl(e.class)) : (n || e[_i]) && (e.class = null),
    e[yi] && (e.style ?? (e.style = null)));
  var h = Gl(r);
  for (const D in e) {
    let T = e[D];
    if (u && D === "value" && T == null) {
      ((r.value = r.__value = ""), (v[D] = T));
      continue;
    }
    if (D === "class") {
      var b = r.namespaceURI === "http://www.w3.org/1999/xhtml";
      (gr(r, b, T, n, t == null ? void 0 : t[_i], e[_i]), (v[D] = T), (v[_i] = e[_i]));
      continue;
    }
    if (D === "style") {
      (Ys(r, T, t == null ? void 0 : t[yi], e[yi]), (v[D] = T), (v[yi] = e[yi]));
      continue;
    }
    var g = v[D];
    if (!(T === g && !(T === void 0 && r.hasAttribute(D)))) {
      v[D] = T;
      var _ = D[0] + D[1];
      if (_ !== "$$")
        if (_ === "on") {
          const S = {},
            O = "$$" + D;
          let V = D.slice(2);
          var y = Af(V);
          if ((Ef(V) && ((V = V.slice(0, -7)), (S.capture = !0)), !y && g)) {
            if (T != null) continue;
            (r.removeEventListener(V, v[O], S), (v[O] = null));
          }
          if (T != null)
            if (y) ((r[`__${V}`] = T), Hs([V]));
            else {
              let at = function (E) {
                v[D].call(this, E);
              };
              v[O] = zl(V, r, at, S);
            }
          else y && (r[`__${V}`] = void 0);
        } else if (D === "style") an(r, D, T);
        else if (D === "autofocus") ff(r, !!T);
        else if (!c && (D === "__value" || (D === "value" && T != null))) r.value = r.__value = T;
        else if (D === "selected" && u) Kf(r, T);
        else {
          var k = D;
          p || (k = Tf(k));
          var P = k === "defaultValue" || k === "defaultChecked";
          if (T == null && !c && !P)
            if (((l[D] = null), k === "value" || k === "checked")) {
              let S = r;
              const O = t === void 0;
              if (k === "value") {
                let V = S.defaultValue;
                (S.removeAttribute(k), (S.defaultValue = V), (S.value = S.__value = O ? V : null));
              } else {
                let V = S.defaultChecked;
                (S.removeAttribute(k), (S.defaultChecked = V), (S.checked = O ? V : !1));
              }
            } else r.removeAttribute(D);
          else
            P || (h.includes(k) && (c || typeof T != "string"))
              ? ((r[k] = T), k in l && (l[k] = de))
              : typeof T != "function" && an(r, k, T);
        }
    }
  }
  return (d && Te(!0), v);
}
function xs(r, t, e = [], n = [], i, a = !1, o = !1) {
  pl(e, n, (s) => {
    var l = void 0,
      c = {},
      p = r.nodeName === "SELECT",
      d = !1;
    if (
      (jn(() => {
        var u = t(...s.map(A)),
          f = Xf(r, l, u, i, a, o);
        d && p && "value" in u && ys(r, u.value);
        for (let b of Object.getOwnPropertySymbols(c)) u[b] || pe(c[b]);
        for (let b of Object.getOwnPropertySymbols(u)) {
          var h = u[b];
          (b.description === Pu &&
            (!l || h !== l[b]) &&
            (c[b] && pe(c[b]), (c[b] = xe(() => Hf(r, () => h)))),
            (f[b] = h));
        }
        l = f;
      }),
      p)
    ) {
      var v = r;
      Br(() => {
        (ys(v, l.value, !0), Yf(v));
      });
    }
    d = !0;
  });
}
function Ks(r) {
  return (
    r.__attributes ??
    (r.__attributes = { [Zl]: r.nodeName.includes("-"), [ql]: r.namespaceURI === $u })
  );
}
var Po = new Map();
function Gl(r) {
  var t = r.getAttribute("is") || r.nodeName,
    e = Po.get(t);
  if (e) return e;
  Po.set(t, (e = []));
  for (var n, i = r, a = Element.prototype; a !== i; ) {
    n = tl(i);
    for (var o in n) n[o].set && e.push(o);
    i = Rs(i);
  }
  return e;
}
const Jf = () => performance.now(),
  Or = { tick: (r) => requestAnimationFrame(r), now: () => Jf(), tasks: new Set() };
function Yl() {
  const r = Or.now();
  (Or.tasks.forEach((t) => {
    t.c(r) || (Or.tasks.delete(t), t.f());
  }),
    Or.tasks.size !== 0 && Or.tick(Yl));
}
function Qf(r) {
  let t;
  return (
    Or.tasks.size === 0 && Or.tick(Yl),
    {
      promise: new Promise((e) => {
        Or.tasks.add((t = { c: r, f: e }));
      }),
      abort() {
        Or.tasks.delete(t);
      },
    }
  );
}
function td(r) {
  if (r === "float") return "cssFloat";
  if (r === "offset") return "cssOffset";
  if (r.startsWith("--")) return r;
  const t = r.split("-");
  return t.length === 1
    ? t[0]
    : t[0] +
        t
          .slice(1)
          .map((e) => e[0].toUpperCase() + e.slice(1))
          .join("");
}
function Ao(r) {
  const t = {},
    e = r.split(";");
  for (const n of e) {
    const [i, a] = n.split(":");
    if (!i || a === void 0) break;
    const o = td(i.trim());
    t[o] = a.trim();
  }
  return t;
}
const ed = (r) => r;
function rd(r, t, e) {
  var n = kn,
    i,
    a,
    o,
    s = null;
  (n.a ??
    (n.a = {
      element: r,
      measure() {
        i = this.element.getBoundingClientRect();
      },
      apply() {
        if (
          (o == null || o.abort(),
          (a = this.element.getBoundingClientRect()),
          i.left !== a.left || i.right !== a.right || i.top !== a.top || i.bottom !== a.bottom)
        ) {
          const l = t()(this.element, { from: i, to: a }, e == null ? void 0 : e());
          o = Kl(this.element, l, void 0, 1, () => {
            (o == null || o.abort(), (o = void 0));
          });
        }
      },
      fix() {
        if (!r.getAnimations().length) {
          var { position: l, width: c, height: p } = getComputedStyle(r);
          if (l !== "absolute" && l !== "fixed") {
            var d = r.style;
            ((s = {
              position: d.position,
              width: d.width,
              height: d.height,
              transform: d.transform,
            }),
              (d.position = "absolute"),
              (d.width = c),
              (d.height = p));
            var v = r.getBoundingClientRect();
            if (i.left !== v.left || i.top !== v.top) {
              var u = `translate(${i.left - v.left}px, ${i.top - v.top}px)`;
              d.transform = d.transform ? `${d.transform} ${u}` : u;
            }
          }
        }
      },
      unfix() {
        if (s) {
          var l = r.style;
          ((l.position = s.position),
            (l.width = s.width),
            (l.height = s.height),
            (l.transform = s.transform));
        }
      },
    }),
    (n.a.element = r));
}
function Kl(r, t, e, n, i) {
  if (Un(t)) {
    var a,
      o = !1;
    return (
      kr(() => {
        if (!o) {
          var h = t({ direction: "in" });
          a = Kl(r, h, e, n, i);
        }
      }),
      {
        abort: () => {
          ((o = !0), a == null || a.abort());
        },
        deactivate: () => a.deactivate(),
        reset: () => a.reset(),
        t: () => a.t(),
      }
    );
  }
  if (!(t != null && t.duration))
    return (i(), { abort: Se, deactivate: Se, reset: Se, t: () => n });
  const { delay: s = 0, css: l, tick: c, easing: p = ed } = t;
  var d = [];
  if ((c && c(0, 1), l)) {
    var v = Ao(l(0, 1));
    d.push(v, v);
  }
  var u = () => 1 - n,
    f = r.animate(d, { duration: s, fill: "forwards" });
  return (
    (f.onfinish = () => {
      f.cancel();
      var h = 1 - n,
        b = n - h,
        g = t.duration * Math.abs(b),
        _ = [];
      if (g > 0) {
        var y = !1;
        if (l)
          for (var k = Math.ceil(g / 16.666666666666668), P = 0; P <= k; P += 1) {
            var D = h + b * p(P / k),
              T = Ao(l(D, 1 - D));
            (_.push(T), y || (y = T.overflow === "hidden"));
          }
        (y && (r.style.overflow = "hidden"),
          (u = () => {
            var S = f.currentTime;
            return h + b * p(S / g);
          }),
          c &&
            Qf(() => {
              if (f.playState !== "running") return !1;
              var S = u();
              return (c(S, 1 - S), !0);
            }));
      }
      ((f = r.animate(_, { duration: g, fill: "forwards" })),
        (f.onfinish = () => {
          ((u = () => n), c == null || c(n, 1 - n), i());
        }));
    }),
    {
      abort: () => {
        f && (f.cancel(), (f.effect = null), (f.onfinish = Se));
      },
      deactivate: () => {
        i = Se;
      },
      reset: () => {},
      t: () => u(),
    }
  );
}
function nd(r, t, e = t) {
  var n = new WeakSet();
  (df(r, "input", async (i) => {
    var a = i ? r.defaultValue : r.value;
    if (((a = ts(r) ? es(a) : a), e(a), Yt !== null && n.add(Yt), await Sf(), a !== (a = t()))) {
      var o = r.selectionStart,
        s = r.selectionEnd,
        l = r.value.length;
      if (((r.value = a ?? ""), s !== null)) {
        var c = r.value.length;
        o === s && s === l && c > l
          ? ((r.selectionStart = c), (r.selectionEnd = c))
          : ((r.selectionStart = o), (r.selectionEnd = Math.min(s, c)));
      }
    }
  }),
    ((mt && r.defaultValue !== r.value) || (Vt(t) == null && r.value)) &&
      (e(ts(r) ? es(r.value) : r.value), Yt !== null && n.add(Yt)),
    Nn(() => {
      var i = t();
      if (r === document.activeElement) {
        var a = Ji ?? Yt;
        if (n.has(a)) return;
      }
      (ts(r) && i === es(r.value)) ||
        (r.type === "date" && !i && !r.value) ||
        (i !== r.value && (r.value = i ?? ""));
    }));
}
function ts(r) {
  var t = r.type;
  return t === "number" || t === "range";
}
function es(r) {
  return r === "" ? null : +r;
}
function Fo(r, t, e) {
  var n = wr(r, t);
  n &&
    n.set &&
    ((r[t] = e),
    Aa(() => {
      r[t] = null;
    }));
}
function To(r, t) {
  return r === t || (r == null ? void 0 : r[_r]) === t;
}
function rs(r = {}, t, e, n) {
  return (
    Br(() => {
      var i, a;
      return (
        Nn(() => {
          ((i = a),
            (a = []),
            Vt(() => {
              r !== e(...a) && (t(r, ...a), i && To(e(...i), r) && t(null, ...i));
            }));
        }),
        () => {
          kr(() => {
            a && To(e(...a), r) && t(null, ...a);
          });
        }
      );
    }),
    r
  );
}
function Mn(r) {
  return function (...t) {
    var e = t[0];
    return (e.stopPropagation(), r == null ? void 0 : r.apply(this, t));
  };
}
function dn(r) {
  return function (...t) {
    var e = t[0];
    return (e.preventDefault(), r == null ? void 0 : r.apply(this, t));
  };
}
function Xl(r = !1) {
  const t = Mt,
    e = t.l.u;
  if (!e) return;
  let n = () => nt(t.s);
  if (r) {
    let i = 0,
      a = {};
    const o = Bi(() => {
      let s = !1;
      const l = t.s;
      for (const c in l) l[c] !== a[c] && ((a[c] = l[c]), (s = !0));
      return (s && i++, i);
    });
    n = () => A(o);
  }
  (e.b.length &&
    vf(() => {
      (Do(t, n), ls(e.b));
    }),
    ms(() => {
      const i = Vt(() => e.m.map(Du));
      return () => {
        for (const a of i) typeof a == "function" && a();
      };
    }),
    e.a.length &&
      ms(() => {
        (Do(t, n), ls(e.a));
      }));
}
function Do(r, t) {
  if (r.l.s) for (const e of r.l.s) A(e);
  t();
}
function qi(r, t) {
  var a;
  var e = (a = r.$$events) == null ? void 0 : a[t.type],
    n = fi(e) ? e.slice() : e == null ? [] : [e];
  for (var i of n) i.call(this, t);
}
let Gi = !1;
function id(r) {
  var t = Gi;
  try {
    return ((Gi = !1), [r(), Gi]);
  } finally {
    Gi = t;
  }
}
const ad = {
  get(r, t) {
    if (!r.exclude.includes(t)) return r.props[t];
  },
  set(r, t) {
    return !1;
  },
  getOwnPropertyDescriptor(r, t) {
    if (!r.exclude.includes(t) && t in r.props)
      return { enumerable: !0, configurable: !0, value: r.props[t] };
  },
  has(r, t) {
    return r.exclude.includes(t) ? !1 : t in r.props;
  },
  ownKeys(r) {
    return Reflect.ownKeys(r.props).filter((t) => !r.exclude.includes(t));
  },
};
function Lr(r, t, e) {
  return new Proxy({ props: r, exclude: t }, ad);
}
const sd = {
  get(r, t) {
    let e = r.props.length;
    for (; e--; ) {
      let n = r.props[e];
      if ((Un(n) && (n = n()), typeof n == "object" && n !== null && t in n)) return n[t];
    }
  },
  set(r, t, e) {
    let n = r.props.length;
    for (; n--; ) {
      let i = r.props[n];
      Un(i) && (i = i());
      const a = wr(i, t);
      if (a && a.set) return (a.set(e), !0);
    }
    return !1;
  },
  getOwnPropertyDescriptor(r, t) {
    let e = r.props.length;
    for (; e--; ) {
      let n = r.props[e];
      if ((Un(n) && (n = n()), typeof n == "object" && n !== null && t in n)) {
        const i = wr(n, t);
        return (i && !i.configurable && (i.configurable = !0), i);
      }
    }
  },
  has(r, t) {
    if (t === _r || t === Ws) return !1;
    for (let e of r.props) if ((Un(e) && (e = e()), e != null && t in e)) return !0;
    return !1;
  },
  ownKeys(r) {
    const t = [];
    for (let e of r.props)
      if ((Un(e) && (e = e()), !!e)) {
        for (const n in e) t.includes(n) || t.push(n);
        for (const n of Object.getOwnPropertySymbols(e)) t.includes(n) || t.push(n);
      }
    return t;
  },
};
function ln(...r) {
  return new Proxy({ props: r }, sd);
}
function lt(r, t, e, n) {
  var y;
  var i = !ui || (e & _u) !== 0,
    a = (e & ku) !== 0,
    o = (e & xu) !== 0,
    s = n,
    l = !0,
    c = () => (l && ((l = !1), (s = o ? Vt(n) : n)), s),
    p;
  if (a) {
    var d = _r in r || Ws in r;
    p = ((y = wr(r, t)) == null ? void 0 : y.set) ?? (d && t in r ? (k) => (r[t] = k) : void 0);
  }
  var v,
    u = !1;
  (a ? ([v, u] = id(() => r[t])) : (v = r[t]),
    v === void 0 && n !== void 0 && ((v = c()), p && (i && Vu(), p(v))));
  var f;
  if (
    (i
      ? (f = () => {
          var k = r[t];
          return k === void 0 ? c() : ((l = !0), k);
        })
      : (f = () => {
          var k = r[t];
          return (k !== void 0 && (s = void 0), k === void 0 ? s : k);
        }),
    i && !(e & yu))
  )
    return f;
  if (p) {
    var h = r.$$legacy;
    return function (k, P) {
      return arguments.length > 0 ? ((!i || !P || h || u) && p(P ? f() : k), k) : f();
    };
  }
  var b = !1,
    g = (e & wu ? Bi : Ei)(() => ((b = !1), f()));
  a && A(g);
  var _ = Et;
  return function (k, P) {
    if (arguments.length > 0) {
      const D = P ? A(g) : i && a ? Zn(k) : k;
      return (Q(g, D), (b = !0), s !== void 0 && (s = D), k);
    }
    return (On && b) || _.f & Tn ? g.v : A(g);
  };
}
function od(r) {
  return new ld(r);
}
var jr, Ye;
class ld {
  constructor(t) {
    It(this, jr);
    It(this, Ye);
    var a;
    var e = new Map(),
      n = (o, s) => {
        var l = Ft(s, !1, !1);
        return (e.set(o, l), l);
      };
    const i = new Proxy(
      { ...(t.props || {}), $$events: {} },
      {
        get(o, s) {
          return A(e.get(s) ?? n(s, Reflect.get(o, s)));
        },
        has(o, s) {
          return s === Ws ? !0 : (A(e.get(s) ?? n(s, Reflect.get(o, s))), Reflect.has(o, s));
        },
        set(o, s, l) {
          return (Q(e.get(s) ?? n(s, l), l), Reflect.set(o, s, l));
        },
      },
    );
    (bt(
      this,
      Ye,
      (t.hydrate ? Bf : Zs)(t.component, {
        target: t.target,
        anchor: t.anchor,
        props: i,
        context: t.context,
        intro: t.intro ?? !1,
        recover: t.recover,
      }),
    ),
      (!((a = t == null ? void 0 : t.props) != null && a.$$host) || t.sync === !1) && ot(),
      bt(this, jr, i.$$events));
    for (const o of Object.keys(tt(this, Ye)))
      o === "$set" ||
        o === "$destroy" ||
        o === "$on" ||
        ii(this, o, {
          get() {
            return tt(this, Ye)[o];
          },
          set(s) {
            tt(this, Ye)[o] = s;
          },
          enumerable: !0,
        });
    ((tt(this, Ye).$set = (o) => {
      Object.assign(i, o);
    }),
      (tt(this, Ye).$destroy = () => {
        If(tt(this, Ye));
      }));
  }
  $set(t) {
    tt(this, Ye).$set(t);
  }
  $on(t, e) {
    tt(this, jr)[t] = tt(this, jr)[t] || [];
    const n = (...i) => e.call(this, ...i);
    return (
      tt(this, jr)[t].push(n),
      () => {
        tt(this, jr)[t] = tt(this, jr)[t].filter((i) => i !== n);
      }
    );
  }
  $destroy() {
    tt(this, Ye).$destroy();
  }
}
((jr = new WeakMap()), (Ye = new WeakMap()));
let Jl;
typeof HTMLElement == "function" &&
  (Jl = class extends HTMLElement {
    constructor(t, e, n) {
      super();
      ye(this, "$$ctor");
      ye(this, "$$s");
      ye(this, "$$c");
      ye(this, "$$cn", !1);
      ye(this, "$$d", {});
      ye(this, "$$r", !1);
      ye(this, "$$p_d", {});
      ye(this, "$$l", {});
      ye(this, "$$l_u", new Map());
      ye(this, "$$me");
      ((this.$$ctor = t), (this.$$s = e), n && this.attachShadow({ mode: "open" }));
    }
    addEventListener(t, e, n) {
      if (((this.$$l[t] = this.$$l[t] || []), this.$$l[t].push(e), this.$$c)) {
        const i = this.$$c.$on(t, e);
        this.$$l_u.set(e, i);
      }
      super.addEventListener(t, e, n);
    }
    removeEventListener(t, e, n) {
      if ((super.removeEventListener(t, e, n), this.$$c)) {
        const i = this.$$l_u.get(e);
        i && (i(), this.$$l_u.delete(e));
      }
    }
    async connectedCallback() {
      if (((this.$$cn = !0), !this.$$c)) {
        let t = function (i) {
          return (a) => {
            const o = document.createElement("slot");
            (i !== "default" && (o.name = i), ct(a, o));
          };
        };
        if ((await Promise.resolve(), !this.$$cn || this.$$c)) return;
        const e = {},
          n = cd(this);
        for (const i of this.$$s)
          i in n &&
            (i === "default" && !this.$$d.children
              ? ((this.$$d.children = t(i)), (e.default = !0))
              : (e[i] = t(i)));
        for (const i of this.attributes) {
          const a = this.$$g_p(i.name);
          a in this.$$d || (this.$$d[a] = ra(a, i.value, this.$$p_d, "toProp"));
        }
        for (const i in this.$$p_d)
          !(i in this.$$d) && this[i] !== void 0 && ((this.$$d[i] = this[i]), delete this[i]);
        ((this.$$c = od({
          component: this.$$ctor,
          target: this.shadowRoot || this,
          props: { ...this.$$d, $$slots: e, $$host: this },
        })),
          (this.$$me = mf(() => {
            Nn(() => {
              var i;
              this.$$r = !0;
              for (const a of aa(this.$$c)) {
                if (!((i = this.$$p_d[a]) != null && i.reflect)) continue;
                this.$$d[a] = this.$$c[a];
                const o = ra(a, this.$$d[a], this.$$p_d, "toAttribute");
                o == null
                  ? this.removeAttribute(this.$$p_d[a].attribute || a)
                  : this.setAttribute(this.$$p_d[a].attribute || a, o);
              }
              this.$$r = !1;
            });
          })));
        for (const i in this.$$l)
          for (const a of this.$$l[i]) {
            const o = this.$$c.$on(i, a);
            this.$$l_u.set(a, o);
          }
        this.$$l = {};
      }
    }
    attributeChangedCallback(t, e, n) {
      var i;
      this.$$r ||
        ((t = this.$$g_p(t)),
        (this.$$d[t] = ra(t, n, this.$$p_d, "toProp")),
        (i = this.$$c) == null || i.$set({ [t]: this.$$d[t] }));
    }
    disconnectedCallback() {
      ((this.$$cn = !1),
        Promise.resolve().then(() => {
          !this.$$cn && this.$$c && (this.$$c.$destroy(), this.$$me(), (this.$$c = void 0));
        }));
    }
    $$g_p(t) {
      return (
        aa(this.$$p_d).find(
          (e) =>
            this.$$p_d[e].attribute === t || (!this.$$p_d[e].attribute && e.toLowerCase() === t),
        ) || t
      );
    }
  });
function ra(r, t, e, n) {
  var a;
  const i = (a = e[r]) == null ? void 0 : a.type;
  if (((t = i === "Boolean" && typeof t != "boolean" ? t != null : t), !n || !e[r])) return t;
  if (n === "toAttribute")
    switch (i) {
      case "Object":
      case "Array":
        return t == null ? null : JSON.stringify(t);
      case "Boolean":
        return t ? "" : null;
      case "Number":
        return t ?? null;
      default:
        return t;
    }
  else
    switch (i) {
      case "Object":
      case "Array":
        return t && JSON.parse(t);
      case "Boolean":
        return t;
      case "Number":
        return t != null ? +t : t;
      default:
        return t;
    }
}
function cd(r) {
  const t = {};
  return (
    r.childNodes.forEach((e) => {
      t[e.slot || "default"] = !0;
    }),
    t
  );
}
function $e(r, t, e, n, i, a) {
  let o = class extends Jl {
    constructor() {
      (super(r, e, i), (this.$$p_d = t));
    }
    static get observedAttributes() {
      return aa(t).map((s) => (t[s].attribute || s).toLowerCase());
    }
  };
  return (
    aa(t).forEach((s) => {
      ii(o.prototype, s, {
        get() {
          return this.$$c && s in this.$$c ? this.$$c[s] : this.$$d[s];
        },
        set(l) {
          var d;
          ((l = ra(s, l, t)), (this.$$d[s] = l));
          var c = this.$$c;
          if (c) {
            var p = (d = wr(c, s)) == null ? void 0 : d.get;
            p ? (c[s] = l) : c.$set({ [s]: l });
          }
        },
      });
    }),
    n.forEach((s) => {
      ii(o.prototype, s, {
        get() {
          var l;
          return (l = this.$$c) == null ? void 0 : l[s];
        },
      });
    }),
    (r.element = o),
    o
  );
}
var ud = Rt("<button><!></button>");
function ur(r, t) {
  Be(t, !1);
  let e = lt(t, "variant", 12, "default"),
    n = lt(t, "disabled", 12, !1),
    i = lt(t, "style", 12, ""),
    a = lt(t, "title", 12, ""),
    o = lt(t, "onclick", 12, void 0);
  var s = {
      get variant() {
        return e();
      },
      set variant(p) {
        (e(p), ot());
      },
      get disabled() {
        return n();
      },
      set disabled(p) {
        (n(p), ot());
      },
      get style() {
        return i();
      },
      set style(p) {
        (i(p), ot());
      },
      get title() {
        return a();
      },
      set title(p) {
        (a(p), ot());
      },
      get onclick() {
        return o();
      },
      set onclick(p) {
        (o(p), ot());
      },
    },
    l = ud();
  l.__click = function (...p) {
    var d;
    (d = o()) == null || d.apply(this, p);
  };
  var c = _t(l);
  return (
    ke(c, t, "default", {}, null),
    gt(l),
    me(() => {
      (gr(l, 1, `wa-button ${e() === "primary" ? "primary" : e() === "ghost" ? "ghost" : ""}`),
        an(l, "aria-label", a()),
        (l.disabled = n()),
        Ys(l, i()));
    }),
    ct(r, l),
    Ie(s)
  );
}
Hs(["click"]);
$e(ur, { variant: {}, disabled: {}, style: {}, title: {}, onclick: {} }, ["default"], [], !0);
var fd = Rt("<button><span><!></span></button>");
const dd = {
  hash: "svelte-f3n0ii",
  code: `.spinning.svelte-f3n0ii {
    animation: svelte-f3n0ii-spin 1s linear infinite;}
  @keyframes svelte-f3n0ii-spin {
    100% {
      transform: rotate(360deg);
    }
  }`,
};
function Ze(r, t) {
  (Be(t, !1), pi(r, dd));
  let e = lt(t, "ariaLabel", 12, ""),
    n = lt(t, "variant", 12, "default"),
    i = lt(t, "disabled", 12, !1),
    a = lt(t, "title", 12),
    o = lt(t, "onclick", 12, void 0),
    s = lt(t, "spinning", 12, !1);
  var l = {
      get ariaLabel() {
        return e();
      },
      set ariaLabel(v) {
        (e(v), ot());
      },
      get variant() {
        return n();
      },
      set variant(v) {
        (n(v), ot());
      },
      get disabled() {
        return i();
      },
      set disabled(v) {
        (i(v), ot());
      },
      get title() {
        return a();
      },
      set title(v) {
        (a(v), ot());
      },
      get onclick() {
        return o();
      },
      set onclick(v) {
        (o(v), ot());
      },
      get spinning() {
        return s();
      },
      set spinning(v) {
        (s(v), ot());
      },
    },
    c = fd();
  c.__click = function (...v) {
    var u;
    (u = o()) == null || u.apply(this, v);
  };
  var p = _t(c),
    d = _t(p);
  return (
    ke(d, t, "default", {}, null),
    gt(p),
    gt(c),
    me(() => {
      (gr(c, 1, `wa-icon-btn clickable-icon ${n() === "ghost" ? "ghost" : ""}`, "svelte-f3n0ii"),
        an(c, "aria-label", e()),
        (c.disabled = i()),
        an(c, "title", a()),
        gr(p, 1, Hl(s() ? "spinning" : ""), "svelte-f3n0ii"));
    }),
    ct(r, c),
    Ie(l)
  );
}
Hs(["click"]);
$e(
  Ze,
  { ariaLabel: {}, variant: {}, disabled: {}, title: {}, onclick: {}, spinning: {} },
  ["default"],
  [],
  !0,
);
class No extends j.Modal {
  constructor(t, e, n, i = "draft") {
    (super(t), (this.name = e), (this.onConfirm = n), (this.type = i));
  }
  onOpen() {
    const { contentEl: t } = this;
    t.addClass("wa-centered-modal");
    const e = this.type === "chapter" ? "chapter" : "draft";
    (t.createEl("h3", { text: `Delete ${e} '${this.name}'?` }),
      this.type === "draft" &&
        t.createEl("p", { text: "This will create a backup copy before deleting." }));
    const n = t.createDiv({ cls: "modal-button-row wa-button-group" }),
      i = n.createEl("button", { text: "Delete", cls: "mod-cta wa-button" }),
      a = n.createEl("button", { text: "Cancel", cls: "wa-button" });
    ((i.onclick = async () => {
      (this.close(), await this.onConfirm());
    }),
      (a.onclick = () => {
        this.close();
      }));
  }
}
class hd extends j.Modal {
  constructor(t, e) {
    (super(t), (this.props = e));
  }
  onOpen() {
    const { contentEl: t } = this;
    t.createEl("h2", { text: `Duplicate Draft: ${this.props.sourceDraftName}` });
    let e = "";
    (new j.Setting(t).setName("New draft name").addText((n) =>
      n
        .setPlaceholder(this.props.suggestedName)
        .setValue(this.props.suggestedName)
        .onChange((i) => (e = i)),
    ),
      new j.Setting(t).addButton((n) =>
        n
          .setButtonText("Duplicate")
          .setCta()
          .onClick(() => {
            this.close();
            const i = e && e.trim() ? e.trim() : this.props.suggestedName;
            this.props.onSubmit(i);
          }),
      ));
  }
  onClose() {
    this.contentEl.empty();
  }
}
class pd extends j.Modal {
  constructor(t, e, n) {
    (super(t), (this.oldName = e), (this.onSubmit = n));
  }
  onOpen() {
    var a;
    const { contentEl: t } = this;
    (t.empty(),
      t.createEl("h3", { text: "Rename Chapter" }),
      t.createEl("div", { text: `Current name: '${this.oldName}'`, cls: "wa-rename-info" }));
    const e = t.createEl("label", { text: "New chapter name", cls: "wa-rename-label" });
    ((this.inputEl = t.createEl("input", {
      type: "text",
      value: this.oldName,
      placeholder: "Enter new chapter name",
      cls: "wa-rename-input",
      attr: { "aria-label": "New chapter name" },
    })),
      e.appendChild(this.inputEl),
      (this.errorEl = t.createEl("div", { cls: "wa-rename-error" })),
      (this.errorEl.style.color = "var(--color-red, #d43c3c)"),
      (this.errorEl.style.display = "none"));
    const n = t.createEl("div", { cls: "wa-rename-btn-row" }),
      i = n.createEl("button", { text: "Rename", cls: "mod-cta" });
    ((this.cancelBtn = n.createEl("button", { text: "Cancel", cls: "mod-cancel" })),
      setTimeout(() => {
        var o, s;
        ((o = this.inputEl) == null || o.focus(), (s = this.inputEl) == null || s.select());
      }, 0),
      (a = this.inputEl) == null ||
        a.addEventListener("keydown", (o) => {
          o.key === "Enter" ? this.submit() : o.key === "Escape" && this.close();
        }),
      i.addEventListener("click", () => this.submit()),
      this.cancelBtn.addEventListener("click", () => this.close()));
  }
  submit() {
    var e, n, i;
    const t = (e = this.inputEl) == null ? void 0 : e.value.trim();
    if (!t) {
      (this.errorEl &&
        ((this.errorEl.textContent = "Chapter name cannot be empty."),
        (this.errorEl.style.display = "")),
        (n = this.inputEl) == null || n.focus());
      return;
    }
    if (t === this.oldName) {
      (this.errorEl &&
        ((this.errorEl.textContent = "Please enter a different name."),
        (this.errorEl.style.display = "")),
        (i = this.inputEl) == null || i.focus());
      return;
    }
    (this.errorEl && (this.errorEl.style.display = "none"), this.onSubmit(t), this.close());
  }
}
/**
 * @license @lucide/svelte v0.545.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2023 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */ const vd = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};
var md = Ta("<svg><!><!></svg>");
function Mr(r, t) {
  Be(t, !0);
  const e = lt(t, "name", 7),
    n = lt(t, "color", 7, "currentColor"),
    i = lt(t, "size", 7, 24),
    a = lt(t, "strokeWidth", 7, 2),
    o = lt(t, "absoluteStrokeWidth", 7, !1),
    s = lt(t, "iconNode", 23, () => []),
    l = lt(t, "children", 7),
    c = Lr(t, [
      "$$slots",
      "$$events",
      "$$legacy",
      "$$host",
      "name",
      "color",
      "size",
      "strokeWidth",
      "absoluteStrokeWidth",
      "iconNode",
      "children",
    ]);
  var p = {
      get name() {
        return e();
      },
      set name(f) {
        (e(f), ot());
      },
      get color() {
        return n();
      },
      set color(f = "currentColor") {
        (n(f), ot());
      },
      get size() {
        return i();
      },
      set size(f = 24) {
        (i(f), ot());
      },
      get strokeWidth() {
        return a();
      },
      set strokeWidth(f = 2) {
        (a(f), ot());
      },
      get absoluteStrokeWidth() {
        return o();
      },
      set absoluteStrokeWidth(f = !1) {
        (o(f), ot());
      },
      get iconNode() {
        return s();
      },
      set iconNode(f = []) {
        (s(f), ot());
      },
      get children() {
        return l();
      },
      set children(f) {
        (l(f), ot());
      },
    },
    d = md();
  xs(
    d,
    (f) => ({
      ...vd,
      ...c,
      width: i(),
      height: i(),
      stroke: n(),
      "stroke-width": f,
      class: ["lucide-icon lucide", e() && `lucide-${e()}`, t.class],
    }),
    [() => (o() ? (Number(a()) * 24) / Number(i()) : a())],
  );
  var v = _t(d);
  Ai(v, 17, s, ua, (f, h) => {
    var b = lf(() => Nu(A(h), 2));
    let g = () => A(b)[0],
      _ = () => A(b)[1];
    var y = ie(),
      k = ee(y);
    (Vf(k, g, !0, (P, D) => {
      xs(P, () => ({ ..._() }));
    }),
      ct(f, y));
  });
  var u = wt(v);
  return (zr(u, () => l() ?? Se), gt(d), ct(r, d), Ie(p));
}
$e(
  Mr,
  {
    name: {},
    color: {},
    size: {},
    strokeWidth: {},
    absoluteStrokeWidth: {},
    iconNode: {},
    children: {},
  },
  [],
  [],
  !0,
);
function Ss(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "m19 12-7 7-7-7" }],
  ];
  (Mr(
    r,
    ln({ name: "arrow-down" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(Ss, {}, [], [], !0);
function Cs(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    ["path", { d: "m5 12 7-7 7 7" }],
    ["path", { d: "M12 19V5" }],
  ];
  (Mr(
    r,
    ln({ name: "arrow-up" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(Cs, {}, [], [], !0);
function Ql(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    ["path", { d: "M12 21V7" }],
    ["path", { d: "m16 12 2 2 4-4" }],
    [
      "path",
      {
        d: "M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3",
      },
    ],
  ];
  (Mr(
    r,
    ln({ name: "book-open-check" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(Ql, {}, [], [], !0);
function tc(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
  ];
  (Mr(
    r,
    ln({ name: "copy" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(tc, {}, [], [], !0);
function $s(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      },
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }],
  ];
  (Mr(
    r,
    ln({ name: "eye" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e($s, {}, [], [], !0);
function Es(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      },
    ],
    ["path", { d: "m15 5 4 4" }],
  ];
  (Mr(
    r,
    ln({ name: "pencil" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(Es, {}, [], [], !0);
function Ps(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
  ];
  (Mr(
    r,
    ln({ name: "rotate-ccw" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(Ps, {}, [], [], !0);
function As(r, t) {
  Be(t, !0);
  /**
   * @license @lucide/svelte v0.545.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */ let e = Lr(t, ["$$slots", "$$events", "$$legacy", "$$host"]);
  const n = [
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }],
  ];
  (Mr(
    r,
    ln({ name: "trash" }, () => e, {
      get iconNode() {
        return n;
      },
      children: (i, a) => {
        var o = ie(),
          s = ee(o);
        (zr(s, () => t.children ?? Se), ct(i, o));
      },
      $$slots: { default: !0 },
    }),
  ),
    Ie());
}
$e(As, {}, [], [], !0);
const da = Math.min,
  xn = Math.max,
  ha = Math.round,
  Yi = Math.floor,
  yr = (r) => ({ x: r, y: r }),
  gd = { left: "right", right: "left", bottom: "top", top: "bottom" },
  bd = { start: "end", end: "start" };
function jo(r, t, e) {
  return xn(r, da(t, e));
}
function Da(r, t) {
  return typeof r == "function" ? r(t) : r;
}
function En(r) {
  return r.split("-")[0];
}
function Na(r) {
  return r.split("-")[1];
}
function ec(r) {
  return r === "x" ? "y" : "x";
}
function rc(r) {
  return r === "y" ? "height" : "width";
}
const wd = new Set(["top", "bottom"]);
function en(r) {
  return wd.has(En(r)) ? "y" : "x";
}
function nc(r) {
  return ec(en(r));
}
function _d(r, t, e) {
  e === void 0 && (e = !1);
  const n = Na(r),
    i = nc(r),
    a = rc(i);
  let o =
    i === "x" ? (n === (e ? "end" : "start") ? "right" : "left") : n === "start" ? "bottom" : "top";
  return (t.reference[a] > t.floating[a] && (o = pa(o)), [o, pa(o)]);
}
function yd(r) {
  const t = pa(r);
  return [Fs(r), t, Fs(t)];
}
function Fs(r) {
  return r.replace(/start|end/g, (t) => bd[t]);
}
const Oo = ["left", "right"],
  Bo = ["right", "left"],
  kd = ["top", "bottom"],
  xd = ["bottom", "top"];
function Sd(r, t, e) {
  switch (r) {
    case "top":
    case "bottom":
      return e ? (t ? Bo : Oo) : t ? Oo : Bo;
    case "left":
    case "right":
      return t ? kd : xd;
    default:
      return [];
  }
}
function Cd(r, t, e, n) {
  const i = Na(r);
  let a = Sd(En(r), e === "start", n);
  return (i && ((a = a.map((o) => o + "-" + i)), t && (a = a.concat(a.map(Fs)))), a);
}
function pa(r) {
  return r.replace(/left|right|bottom|top/g, (t) => gd[t]);
}
function $d(r) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...r };
}
function Ed(r) {
  return typeof r != "number" ? $d(r) : { top: r, right: r, bottom: r, left: r };
}
function va(r) {
  const { x: t, y: e, width: n, height: i } = r;
  return { width: n, height: i, top: e, left: t, right: t + n, bottom: e + i, x: t, y: e };
}
function Io(r, t, e) {
  let { reference: n, floating: i } = r;
  const a = en(t),
    o = nc(t),
    s = rc(o),
    l = En(t),
    c = a === "y",
    p = n.x + n.width / 2 - i.width / 2,
    d = n.y + n.height / 2 - i.height / 2,
    v = n[s] / 2 - i[s] / 2;
  let u;
  switch (l) {
    case "top":
      u = { x: p, y: n.y - i.height };
      break;
    case "bottom":
      u = { x: p, y: n.y + n.height };
      break;
    case "right":
      u = { x: n.x + n.width, y: d };
      break;
    case "left":
      u = { x: n.x - i.width, y: d };
      break;
    default:
      u = { x: n.x, y: n.y };
  }
  switch (Na(t)) {
    case "start":
      u[o] -= v * (e && c ? -1 : 1);
      break;
    case "end":
      u[o] += v * (e && c ? -1 : 1);
      break;
  }
  return u;
}
const Pd = async (r, t, e) => {
  const { placement: n = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = e,
    s = a.filter(Boolean),
    l = await (o.isRTL == null ? void 0 : o.isRTL(t));
  let c = await o.getElementRects({ reference: r, floating: t, strategy: i }),
    { x: p, y: d } = Io(c, n, l),
    v = n,
    u = {},
    f = 0;
  for (let h = 0; h < s.length; h++) {
    const { name: b, fn: g } = s[h],
      {
        x: _,
        y,
        data: k,
        reset: P,
      } = await g({
        x: p,
        y: d,
        initialPlacement: n,
        placement: v,
        strategy: i,
        middlewareData: u,
        rects: c,
        platform: o,
        elements: { reference: r, floating: t },
      });
    ((p = _ ?? p),
      (d = y ?? d),
      (u = { ...u, [b]: { ...u[b], ...k } }),
      P &&
        f <= 50 &&
        (f++,
        typeof P == "object" &&
          (P.placement && (v = P.placement),
          P.rects &&
            (c =
              P.rects === !0
                ? await o.getElementRects({ reference: r, floating: t, strategy: i })
                : P.rects),
          ({ x: p, y: d } = Io(c, v, l))),
        (h = -1)));
  }
  return { x: p, y: d, placement: v, strategy: i, middlewareData: u };
};
async function ic(r, t) {
  var e;
  t === void 0 && (t = {});
  const { x: n, y: i, platform: a, rects: o, elements: s, strategy: l } = r,
    {
      boundary: c = "clippingAncestors",
      rootBoundary: p = "viewport",
      elementContext: d = "floating",
      altBoundary: v = !1,
      padding: u = 0,
    } = Da(t, r),
    f = Ed(u),
    b = s[v ? (d === "floating" ? "reference" : "floating") : d],
    g = va(
      await a.getClippingRect({
        element:
          (e = await (a.isElement == null ? void 0 : a.isElement(b))) == null || e
            ? b
            : b.contextElement ||
              (await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(s.floating))),
        boundary: c,
        rootBoundary: p,
        strategy: l,
      }),
    ),
    _ =
      d === "floating"
        ? { x: n, y: i, width: o.floating.width, height: o.floating.height }
        : o.reference,
    y = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(s.floating)),
    k = (await (a.isElement == null ? void 0 : a.isElement(y)))
      ? (await (a.getScale == null ? void 0 : a.getScale(y))) || { x: 1, y: 1 }
      : { x: 1, y: 1 },
    P = va(
      a.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: s,
            rect: _,
            offsetParent: y,
            strategy: l,
          })
        : _,
    );
  return {
    top: (g.top - P.top + f.top) / k.y,
    bottom: (P.bottom - g.bottom + f.bottom) / k.y,
    left: (g.left - P.left + f.left) / k.x,
    right: (P.right - g.right + f.right) / k.x,
  };
}
const Ad = function (r) {
    return (
      r === void 0 && (r = {}),
      {
        name: "flip",
        options: r,
        async fn(t) {
          var e, n;
          const {
              placement: i,
              middlewareData: a,
              rects: o,
              initialPlacement: s,
              platform: l,
              elements: c,
            } = t,
            {
              mainAxis: p = !0,
              crossAxis: d = !0,
              fallbackPlacements: v,
              fallbackStrategy: u = "bestFit",
              fallbackAxisSideDirection: f = "none",
              flipAlignment: h = !0,
              ...b
            } = Da(r, t);
          if ((e = a.arrow) != null && e.alignmentOffset) return {};
          const g = En(i),
            _ = en(s),
            y = En(s) === s,
            k = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)),
            P = v || (y || !h ? [pa(s)] : yd(s)),
            D = f !== "none";
          !v && D && P.push(...Cd(s, h, f, k));
          const T = [s, ...P],
            S = await ic(t, b),
            O = [];
          let V = ((n = a.flip) == null ? void 0 : n.overflows) || [];
          if ((p && O.push(S[g]), d)) {
            const w = _d(i, o, k);
            O.push(S[w[0]], S[w[1]]);
          }
          if (((V = [...V, { placement: i, overflows: O }]), !O.every((w) => w <= 0))) {
            var at, E;
            const w = (((at = a.flip) == null ? void 0 : at.index) || 0) + 1,
              U = T[w];
            if (
              U &&
              (!(d === "alignment" ? _ !== en(U) : !1) ||
                V.every((rt) => (en(rt.placement) === _ ? rt.overflows[0] > 0 : !0)))
            )
              return { data: { index: w, overflows: V }, reset: { placement: U } };
            let ft =
              (E = V.filter((J) => J.overflows[0] <= 0).sort(
                (J, rt) => J.overflows[1] - rt.overflows[1],
              )[0]) == null
                ? void 0
                : E.placement;
            if (!ft)
              switch (u) {
                case "bestFit": {
                  var B;
                  const J =
                    (B = V.filter((rt) => {
                      if (D) {
                        const Y = en(rt.placement);
                        return Y === _ || Y === "y";
                      }
                      return !0;
                    })
                      .map((rt) => [
                        rt.placement,
                        rt.overflows.filter((Y) => Y > 0).reduce((Y, dt) => Y + dt, 0),
                      ])
                      .sort((rt, Y) => rt[1] - Y[1])[0]) == null
                      ? void 0
                      : B[0];
                  J && (ft = J);
                  break;
                }
                case "initialPlacement":
                  ft = s;
                  break;
              }
            if (i !== ft) return { reset: { placement: ft } };
          }
          return {};
        },
      }
    );
  },
  Fd = new Set(["left", "top"]);
async function Td(r, t) {
  const { placement: e, platform: n, elements: i } = r,
    a = await (n.isRTL == null ? void 0 : n.isRTL(i.floating)),
    o = En(e),
    s = Na(e),
    l = en(e) === "y",
    c = Fd.has(o) ? -1 : 1,
    p = a && l ? -1 : 1,
    d = Da(t, r);
  let {
    mainAxis: v,
    crossAxis: u,
    alignmentAxis: f,
  } = typeof d == "number"
    ? { mainAxis: d, crossAxis: 0, alignmentAxis: null }
    : { mainAxis: d.mainAxis || 0, crossAxis: d.crossAxis || 0, alignmentAxis: d.alignmentAxis };
  return (
    s && typeof f == "number" && (u = s === "end" ? f * -1 : f),
    l ? { x: u * p, y: v * c } : { x: v * c, y: u * p }
  );
}
const Dd = function (r) {
    return (
      r === void 0 && (r = 0),
      {
        name: "offset",
        options: r,
        async fn(t) {
          var e, n;
          const { x: i, y: a, placement: o, middlewareData: s } = t,
            l = await Td(t, r);
          return o === ((e = s.offset) == null ? void 0 : e.placement) &&
            (n = s.arrow) != null &&
            n.alignmentOffset
            ? {}
            : { x: i + l.x, y: a + l.y, data: { ...l, placement: o } };
        },
      }
    );
  },
  Nd = function (r) {
    return (
      r === void 0 && (r = {}),
      {
        name: "shift",
        options: r,
        async fn(t) {
          const { x: e, y: n, placement: i } = t,
            {
              mainAxis: a = !0,
              crossAxis: o = !1,
              limiter: s = {
                fn: (b) => {
                  let { x: g, y: _ } = b;
                  return { x: g, y: _ };
                },
              },
              ...l
            } = Da(r, t),
            c = { x: e, y: n },
            p = await ic(t, l),
            d = en(En(i)),
            v = ec(d);
          let u = c[v],
            f = c[d];
          if (a) {
            const b = v === "y" ? "top" : "left",
              g = v === "y" ? "bottom" : "right",
              _ = u + p[b],
              y = u - p[g];
            u = jo(_, u, y);
          }
          if (o) {
            const b = d === "y" ? "top" : "left",
              g = d === "y" ? "bottom" : "right",
              _ = f + p[b],
              y = f - p[g];
            f = jo(_, f, y);
          }
          const h = s.fn({ ...t, [v]: u, [d]: f });
          return { ...h, data: { x: h.x - e, y: h.y - n, enabled: { [v]: a, [d]: o } } };
        },
      }
    );
  };
function ja() {
  return typeof window < "u";
}
function vi(r) {
  return ac(r) ? (r.nodeName || "").toLowerCase() : "#document";
}
function Me(r) {
  var t;
  return (r == null || (t = r.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Er(r) {
  var t;
  return (t = (ac(r) ? r.ownerDocument : r.document) || window.document) == null
    ? void 0
    : t.documentElement;
}
function ac(r) {
  return ja() ? r instanceof Node || r instanceof Me(r).Node : !1;
}
function sr(r) {
  return ja() ? r instanceof Element || r instanceof Me(r).Element : !1;
}
function Cr(r) {
  return ja() ? r instanceof HTMLElement || r instanceof Me(r).HTMLElement : !1;
}
function Ro(r) {
  return !ja() || typeof ShadowRoot > "u"
    ? !1
    : r instanceof ShadowRoot || r instanceof Me(r).ShadowRoot;
}
const jd = new Set(["inline", "contents"]);
function Ri(r) {
  const { overflow: t, overflowX: e, overflowY: n, display: i } = or(r);
  return /auto|scroll|overlay|hidden|clip/.test(t + n + e) && !jd.has(i);
}
const Od = new Set(["table", "td", "th"]);
function Bd(r) {
  return Od.has(vi(r));
}
const Id = [":popover-open", ":modal"];
function Oa(r) {
  return Id.some((t) => {
    try {
      return r.matches(t);
    } catch {
      return !1;
    }
  });
}
const Rd = ["transform", "translate", "scale", "rotate", "perspective"],
  zd = ["transform", "translate", "scale", "rotate", "perspective", "filter"],
  Ld = ["paint", "layout", "strict", "content"];
function Xs(r) {
  const t = Js(),
    e = sr(r) ? or(r) : r;
  return (
    Rd.some((n) => (e[n] ? e[n] !== "none" : !1)) ||
    (e.containerType ? e.containerType !== "normal" : !1) ||
    (!t && (e.backdropFilter ? e.backdropFilter !== "none" : !1)) ||
    (!t && (e.filter ? e.filter !== "none" : !1)) ||
    zd.some((n) => (e.willChange || "").includes(n)) ||
    Ld.some((n) => (e.contain || "").includes(n))
  );
}
function Md(r) {
  let t = sn(r);
  for (; Cr(t) && !ci(t); ) {
    if (Xs(t)) return t;
    if (Oa(t)) return null;
    t = sn(t);
  }
  return null;
}
function Js() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
const Wd = new Set(["html", "body", "#document"]);
function ci(r) {
  return Wd.has(vi(r));
}
function or(r) {
  return Me(r).getComputedStyle(r);
}
function Ba(r) {
  return sr(r)
    ? { scrollLeft: r.scrollLeft, scrollTop: r.scrollTop }
    : { scrollLeft: r.scrollX, scrollTop: r.scrollY };
}
function sn(r) {
  if (vi(r) === "html") return r;
  const t = r.assignedSlot || r.parentNode || (Ro(r) && r.host) || Er(r);
  return Ro(t) ? t.host : t;
}
function sc(r) {
  const t = sn(r);
  return ci(t) ? (r.ownerDocument ? r.ownerDocument.body : r.body) : Cr(t) && Ri(t) ? t : sc(t);
}
function Fi(r, t, e) {
  var n;
  (t === void 0 && (t = []), e === void 0 && (e = !0));
  const i = sc(r),
    a = i === ((n = r.ownerDocument) == null ? void 0 : n.body),
    o = Me(i);
  if (a) {
    const s = Ts(o);
    return t.concat(o, o.visualViewport || [], Ri(i) ? i : [], s && e ? Fi(s) : []);
  }
  return t.concat(i, Fi(i, [], e));
}
function Ts(r) {
  return r.parent && Object.getPrototypeOf(r.parent) ? r.frameElement : null;
}
function oc(r) {
  const t = or(r);
  let e = parseFloat(t.width) || 0,
    n = parseFloat(t.height) || 0;
  const i = Cr(r),
    a = i ? r.offsetWidth : e,
    o = i ? r.offsetHeight : n,
    s = ha(e) !== a || ha(n) !== o;
  return (s && ((e = a), (n = o)), { width: e, height: n, $: s });
}
function Qs(r) {
  return sr(r) ? r : r.contextElement;
}
function Xn(r) {
  const t = Qs(r);
  if (!Cr(t)) return yr(1);
  const e = t.getBoundingClientRect(),
    { width: n, height: i, $: a } = oc(t);
  let o = (a ? ha(e.width) : e.width) / n,
    s = (a ? ha(e.height) : e.height) / i;
  return (
    (!o || !Number.isFinite(o)) && (o = 1),
    (!s || !Number.isFinite(s)) && (s = 1),
    { x: o, y: s }
  );
}
const Ud = yr(0);
function lc(r) {
  const t = Me(r);
  return !Js() || !t.visualViewport
    ? Ud
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function Vd(r, t, e) {
  return (t === void 0 && (t = !1), !e || (t && e !== Me(r)) ? !1 : t);
}
function Pn(r, t, e, n) {
  (t === void 0 && (t = !1), e === void 0 && (e = !1));
  const i = r.getBoundingClientRect(),
    a = Qs(r);
  let o = yr(1);
  t && (n ? sr(n) && (o = Xn(n)) : (o = Xn(r)));
  const s = Vd(a, e, n) ? lc(a) : yr(0);
  let l = (i.left + s.x) / o.x,
    c = (i.top + s.y) / o.y,
    p = i.width / o.x,
    d = i.height / o.y;
  if (a) {
    const v = Me(a),
      u = n && sr(n) ? Me(n) : n;
    let f = v,
      h = Ts(f);
    for (; h && n && u !== f; ) {
      const b = Xn(h),
        g = h.getBoundingClientRect(),
        _ = or(h),
        y = g.left + (h.clientLeft + parseFloat(_.paddingLeft)) * b.x,
        k = g.top + (h.clientTop + parseFloat(_.paddingTop)) * b.y;
      ((l *= b.x),
        (c *= b.y),
        (p *= b.x),
        (d *= b.y),
        (l += y),
        (c += k),
        (f = Me(h)),
        (h = Ts(f)));
    }
  }
  return va({ width: p, height: d, x: l, y: c });
}
function Ia(r, t) {
  const e = Ba(r).scrollLeft;
  return t ? t.left + e : Pn(Er(r)).left + e;
}
function cc(r, t) {
  const e = r.getBoundingClientRect(),
    n = e.left + t.scrollLeft - Ia(r, e),
    i = e.top + t.scrollTop;
  return { x: n, y: i };
}
function Hd(r) {
  let { elements: t, rect: e, offsetParent: n, strategy: i } = r;
  const a = i === "fixed",
    o = Er(n),
    s = t ? Oa(t.floating) : !1;
  if (n === o || (s && a)) return e;
  let l = { scrollLeft: 0, scrollTop: 0 },
    c = yr(1);
  const p = yr(0),
    d = Cr(n);
  if ((d || (!d && !a)) && ((vi(n) !== "body" || Ri(o)) && (l = Ba(n)), Cr(n))) {
    const u = Pn(n);
    ((c = Xn(n)), (p.x = u.x + n.clientLeft), (p.y = u.y + n.clientTop));
  }
  const v = o && !d && !a ? cc(o, l) : yr(0);
  return {
    width: e.width * c.x,
    height: e.height * c.y,
    x: e.x * c.x - l.scrollLeft * c.x + p.x + v.x,
    y: e.y * c.y - l.scrollTop * c.y + p.y + v.y,
  };
}
function Zd(r) {
  return Array.from(r.getClientRects());
}
function qd(r) {
  const t = Er(r),
    e = Ba(r),
    n = r.ownerDocument.body,
    i = xn(t.scrollWidth, t.clientWidth, n.scrollWidth, n.clientWidth),
    a = xn(t.scrollHeight, t.clientHeight, n.scrollHeight, n.clientHeight);
  let o = -e.scrollLeft + Ia(r);
  const s = -e.scrollTop;
  return (
    or(n).direction === "rtl" && (o += xn(t.clientWidth, n.clientWidth) - i),
    { width: i, height: a, x: o, y: s }
  );
}
const zo = 25;
function Gd(r, t) {
  const e = Me(r),
    n = Er(r),
    i = e.visualViewport;
  let a = n.clientWidth,
    o = n.clientHeight,
    s = 0,
    l = 0;
  if (i) {
    ((a = i.width), (o = i.height));
    const p = Js();
    (!p || (p && t === "fixed")) && ((s = i.offsetLeft), (l = i.offsetTop));
  }
  const c = Ia(n);
  if (c <= 0) {
    const p = n.ownerDocument,
      d = p.body,
      v = getComputedStyle(d),
      u =
        (p.compatMode === "CSS1Compat" && parseFloat(v.marginLeft) + parseFloat(v.marginRight)) ||
        0,
      f = Math.abs(n.clientWidth - d.clientWidth - u);
    f <= zo && (a -= f);
  } else c <= zo && (a += c);
  return { width: a, height: o, x: s, y: l };
}
const Yd = new Set(["absolute", "fixed"]);
function Kd(r, t) {
  const e = Pn(r, !0, t === "fixed"),
    n = e.top + r.clientTop,
    i = e.left + r.clientLeft,
    a = Cr(r) ? Xn(r) : yr(1),
    o = r.clientWidth * a.x,
    s = r.clientHeight * a.y,
    l = i * a.x,
    c = n * a.y;
  return { width: o, height: s, x: l, y: c };
}
function Lo(r, t, e) {
  let n;
  if (t === "viewport") n = Gd(r, e);
  else if (t === "document") n = qd(Er(r));
  else if (sr(t)) n = Kd(t, e);
  else {
    const i = lc(r);
    n = { x: t.x - i.x, y: t.y - i.y, width: t.width, height: t.height };
  }
  return va(n);
}
function uc(r, t) {
  const e = sn(r);
  return e === t || !sr(e) || ci(e) ? !1 : or(e).position === "fixed" || uc(e, t);
}
function Xd(r, t) {
  const e = t.get(r);
  if (e) return e;
  let n = Fi(r, [], !1).filter((s) => sr(s) && vi(s) !== "body"),
    i = null;
  const a = or(r).position === "fixed";
  let o = a ? sn(r) : r;
  for (; sr(o) && !ci(o); ) {
    const s = or(o),
      l = Xs(o);
    (!l && s.position === "fixed" && (i = null),
      (
        a
          ? !l && !i
          : (!l && s.position === "static" && !!i && Yd.has(i.position)) ||
            (Ri(o) && !l && uc(r, o))
      )
        ? (n = n.filter((p) => p !== o))
        : (i = s),
      (o = sn(o)));
  }
  return (t.set(r, n), n);
}
function Jd(r) {
  let { element: t, boundary: e, rootBoundary: n, strategy: i } = r;
  const o = [...(e === "clippingAncestors" ? (Oa(t) ? [] : Xd(t, this._c)) : [].concat(e)), n],
    s = o[0],
    l = o.reduce(
      (c, p) => {
        const d = Lo(t, p, i);
        return (
          (c.top = xn(d.top, c.top)),
          (c.right = da(d.right, c.right)),
          (c.bottom = da(d.bottom, c.bottom)),
          (c.left = xn(d.left, c.left)),
          c
        );
      },
      Lo(t, s, i),
    );
  return { width: l.right - l.left, height: l.bottom - l.top, x: l.left, y: l.top };
}
function Qd(r) {
  const { width: t, height: e } = oc(r);
  return { width: t, height: e };
}
function th(r, t, e) {
  const n = Cr(t),
    i = Er(t),
    a = e === "fixed",
    o = Pn(r, !0, a, t);
  let s = { scrollLeft: 0, scrollTop: 0 };
  const l = yr(0);
  function c() {
    l.x = Ia(i);
  }
  if (n || (!n && !a))
    if (((vi(t) !== "body" || Ri(i)) && (s = Ba(t)), n)) {
      const u = Pn(t, !0, a, t);
      ((l.x = u.x + t.clientLeft), (l.y = u.y + t.clientTop));
    } else i && c();
  a && !n && i && c();
  const p = i && !n && !a ? cc(i, s) : yr(0),
    d = o.left + s.scrollLeft - l.x - p.x,
    v = o.top + s.scrollTop - l.y - p.y;
  return { x: d, y: v, width: o.width, height: o.height };
}
function ns(r) {
  return or(r).position === "static";
}
function Mo(r, t) {
  if (!Cr(r) || or(r).position === "fixed") return null;
  if (t) return t(r);
  let e = r.offsetParent;
  return (Er(r) === e && (e = e.ownerDocument.body), e);
}
function fc(r, t) {
  const e = Me(r);
  if (Oa(r)) return e;
  if (!Cr(r)) {
    let i = sn(r);
    for (; i && !ci(i); ) {
      if (sr(i) && !ns(i)) return i;
      i = sn(i);
    }
    return e;
  }
  let n = Mo(r, t);
  for (; n && Bd(n) && ns(n); ) n = Mo(n, t);
  return n && ci(n) && ns(n) && !Xs(n) ? e : n || Md(r) || e;
}
const eh = async function (r) {
  const t = this.getOffsetParent || fc,
    e = this.getDimensions,
    n = await e(r.floating);
  return {
    reference: th(r.reference, await t(r.floating), r.strategy),
    floating: { x: 0, y: 0, width: n.width, height: n.height },
  };
};
function rh(r) {
  return or(r).direction === "rtl";
}
const nh = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Hd,
  getDocumentElement: Er,
  getClippingRect: Jd,
  getOffsetParent: fc,
  getElementRects: eh,
  getClientRects: Zd,
  getDimensions: Qd,
  getScale: Xn,
  isElement: sr,
  isRTL: rh,
};
function dc(r, t) {
  return r.x === t.x && r.y === t.y && r.width === t.width && r.height === t.height;
}
function ih(r, t) {
  let e = null,
    n;
  const i = Er(r);
  function a() {
    var s;
    (clearTimeout(n), (s = e) == null || s.disconnect(), (e = null));
  }
  function o(s, l) {
    (s === void 0 && (s = !1), l === void 0 && (l = 1), a());
    const c = r.getBoundingClientRect(),
      { left: p, top: d, width: v, height: u } = c;
    if ((s || t(), !v || !u)) return;
    const f = Yi(d),
      h = Yi(i.clientWidth - (p + v)),
      b = Yi(i.clientHeight - (d + u)),
      g = Yi(p),
      y = {
        rootMargin: -f + "px " + -h + "px " + -b + "px " + -g + "px",
        threshold: xn(0, da(1, l)) || 1,
      };
    let k = !0;
    function P(D) {
      const T = D[0].intersectionRatio;
      if (T !== l) {
        if (!k) return o();
        T
          ? o(!1, T)
          : (n = setTimeout(() => {
              o(!1, 1e-7);
            }, 1e3));
      }
      (T === 1 && !dc(c, r.getBoundingClientRect()) && o(), (k = !1));
    }
    try {
      e = new IntersectionObserver(P, { ...y, root: i.ownerDocument });
    } catch {
      e = new IntersectionObserver(P, y);
    }
    e.observe(r);
  }
  return (o(!0), a);
}
function ah(r, t, e, n) {
  n === void 0 && (n = {});
  const {
      ancestorScroll: i = !0,
      ancestorResize: a = !0,
      elementResize: o = typeof ResizeObserver == "function",
      layoutShift: s = typeof IntersectionObserver == "function",
      animationFrame: l = !1,
    } = n,
    c = Qs(r),
    p = i || a ? [...(c ? Fi(c) : []), ...Fi(t)] : [];
  p.forEach((g) => {
    (i && g.addEventListener("scroll", e, { passive: !0 }), a && g.addEventListener("resize", e));
  });
  const d = c && s ? ih(c, e) : null;
  let v = -1,
    u = null;
  o &&
    ((u = new ResizeObserver((g) => {
      let [_] = g;
      (_ &&
        _.target === c &&
        u &&
        (u.unobserve(t),
        cancelAnimationFrame(v),
        (v = requestAnimationFrame(() => {
          var y;
          (y = u) == null || y.observe(t);
        }))),
        e());
    })),
    c && !l && u.observe(c),
    u.observe(t));
  let f,
    h = l ? Pn(r) : null;
  l && b();
  function b() {
    const g = Pn(r);
    (h && !dc(h, g) && e(), (h = g), (f = requestAnimationFrame(b)));
  }
  return (
    e(),
    () => {
      var g;
      (p.forEach((_) => {
        (i && _.removeEventListener("scroll", e), a && _.removeEventListener("resize", e));
      }),
        d == null || d(),
        (g = u) == null || g.disconnect(),
        (u = null),
        l && cancelAnimationFrame(f));
    }
  );
}
const sh = Dd,
  oh = Nd,
  lh = Ad,
  ch = (r, t, e) => {
    const n = new Map(),
      i = { platform: nh, ...e },
      a = { ...i.platform, _c: n };
    return Pd(r, t, { ...i, platform: a });
  };
function uh(r) {
  let t, e;
  const n = { autoUpdate: !0 };
  let i = r;
  const a = (p) => ({ ...n, ...(r || {}), ...(p || {}) }),
    o = (p) => {
      t &&
        e &&
        ((i = a(p)),
        ch(t, e, i).then((d) => {
          (Object.assign(e.style, { position: d.strategy, left: `${d.x}px`, top: `${d.y}px` }),
            i != null && i.onComputed && i.onComputed(d));
        }));
    },
    s = (p) => {
      if ("subscribe" in p) return (c(p), {});
      ((t = p), o());
    },
    l = (p, d) => {
      let v;
      ((e = p), (i = a(d)), setTimeout(() => o(d), 0), o(d));
      const u = () => {
          v && (v(), (v = void 0));
        },
        f = ({ autoUpdate: h } = i || {}) => {
          if ((u(), h !== !1)) return ah(t, e, () => o(i), h === !0 ? {} : h);
        };
      return (
        (v = f()),
        {
          update(h) {
            (o(h), (v = f(h)));
          },
          destroy() {
            u();
          },
        }
      );
    },
    c = (p) => {
      const d = p.subscribe((v) => {
        t === void 0 ? ((t = v), o()) : (Object.assign(t, v), o());
      });
      Gs(d);
    };
  return [s, l, o];
}
function fh({
  loadOptions: r,
  filterText: t,
  items: e,
  multiple: n,
  value: i,
  itemId: a,
  groupBy: o,
  filterSelectedItems: s,
  itemFilter: l,
  convertStringItemsToObjects: c,
  filterGroupedItems: p,
  label: d,
}) {
  if (e && r) return e;
  if (!e) return [];
  e && e.length > 0 && typeof e[0] != "object" && (e = c(e));
  let v = e.filter((u) => {
    let f = l(u[d], t, u);
    return (f && n && i != null && i.length && (f = !i.some((h) => (s ? h[a] === u[a] : !1))), f);
  });
  return (o && (v = p(v)), v);
}
async function dh({ dispatch: r, loadOptions: t, convertStringItemsToObjects: e, filterText: n }) {
  let i = await t(n).catch((a) => {
    (console.warn("svelte-select loadOptions error :>> ", a),
      r("error", { type: "loadOptions", details: a }));
  });
  if (i && !i.cancelled)
    return (
      i
        ? (i && i.length > 0 && typeof i[0] != "object" && (i = e(i)), r("loaded", { items: i }))
        : (i = []),
      { filteredItems: i, loading: !1, focused: !0, listOpen: !0 }
    );
}
var hh =
  Ta(`<svg width="100%" height="100%" viewBox="0 0 20 20" focusable="false" aria-hidden="true" class="svelte-1cjxppd"><path fill="currentColor" d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747
          3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0
          1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502
          0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0
          0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg>`);
const ph = {
  hash: "svelte-1cjxppd",
  code: "svg.svelte-1cjxppd {width:var(--chevron-icon-width, 20px);height:var(--chevron-icon-width, 20px);color:var(--chevron-icon-colour, currentColor);}",
};
function hc(r) {
  pi(r, ph);
  var t = hh();
  ct(r, t);
}
$e(hc, {}, [], [], !0);
var vh =
  Ta(`<svg width="100%" height="100%" viewBox="-2 -2 50 50" focusable="false" aria-hidden="true" role="presentation" class="svelte-1tqf49v"><path fill="currentColor" d="M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124
    l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z"></path></svg>`);
const mh = {
  hash: "svelte-1tqf49v",
  code: "svg.svelte-1tqf49v {width:var(--clear-icon-width, 20px);height:var(--clear-icon-width, 20px);color:var(--clear-icon-color, currentColor);}",
};
function na(r) {
  pi(r, mh);
  var t = vh();
  ct(r, t);
}
$e(na, {}, [], [], !0);
var gh = Ta(
  '<svg class="loading svelte-5svtgc" viewBox="25 25 50 50"><circle class="circle_path svelte-5svtgc" cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-miterlimit="10"></circle></svg>',
);
const bh = {
  hash: "svelte-5svtgc",
  code: `.loading.svelte-5svtgc {width:var(--spinner-width, 20px);height:var(--spinner-height, 20px);color:var(--spinner-color, var(--icons-color));
        animation: svelte-5svtgc-rotate 0.75s linear infinite;transform-origin:center center;transform:none;}.circle_path.svelte-5svtgc {stroke-dasharray:90;stroke-linecap:round;}

    @keyframes svelte-5svtgc-rotate {
        100% {
            transform: rotate(360deg);
        }
    }`,
};
function pc(r) {
  pi(r, bh);
  var t = gh();
  ct(r, t);
}
$e(pc, {}, [], [], !0);
var wh = Rt('<div class="list-item svelte-di53br" tabindex="-1" role="none"><div><!></div></div>'),
  _h = Rt('<div class="empty svelte-di53br">No options</div>'),
  yh = Rt("<div><!> <!> <!></div>"),
  kh = Rt(
    '<span id="aria-selection" class="svelte-di53br"> </span> <span id="aria-context" class="svelte-di53br"> </span>',
    1,
  ),
  xh = Rt('<div class="multi-item-clear svelte-di53br"><!></div>'),
  Sh = Rt('<div role="none"><span class="multi-item-text svelte-di53br"><!></span> <!></div>'),
  Ch = Rt("<div><!></div>"),
  $h = Rt('<div class="icon loading svelte-di53br" aria-hidden="true"><!></div>'),
  Eh = Rt('<button type="button" class="icon clear-select svelte-di53br"><!></button>'),
  Ph = Rt('<div class="icon chevron svelte-di53br" aria-hidden="true"><!></div>'),
  Ah = Rt('<input type="hidden" class="svelte-di53br"/>'),
  Fh = Rt(
    '<select class="required svelte-di53br" required tabindex="-1" aria-hidden="true"></select>',
  ),
  Th = Rt(
    '<div role="none"><!> <span aria-live="polite" aria-atomic="false" aria-relevant="additions text" class="a11y-text svelte-di53br"><!></span> <div class="prepend svelte-di53br"><!></div> <div class="value-container svelte-di53br"><!> <input/></div> <div class="indicators svelte-di53br"><!> <!> <!></div> <!> <!></div>',
  );
const Dh = {
  hash: "svelte-di53br",
  code: `.svelte-select.svelte-di53br {
        /* deprecating camelCase custom props in favour of kebab-case for v5 */--borderRadius: var(--border-radius);--clearSelectColor: var(--clear-select-color);--clearSelectWidth: var(--clear-select-width);--disabledBackground: var(--disabled-background);--disabledBorderColor: var(--disabled-border-color);--disabledColor: var(--disabled-color);--disabledPlaceholderColor: var(--disabled-placeholder-color);--disabledPlaceholderOpacity: var(--disabled-placeholder-opacity);--errorBackground: var(--error-background);--errorBorder: var(--error-border);--groupItemPaddingLeft: var(--group-item-padding-left);--groupTitleColor: var(--group-title-color);--groupTitleFontSize: var(--group-title-font-size);--groupTitleFontWeight: var(--group-title-font-weight);--groupTitlePadding: var(--group-title-padding);--groupTitleTextTransform: var(--group-title-text-transform);--groupTitleBorderColor: var(--group-title-border-color);--groupTitleBorderWidth: var(--group-title-border-width);--groupTitleBorderStyle: var(--group-title-border-style);--indicatorColor: var(--chevron-color);--indicatorHeight: var(--chevron-height);--indicatorWidth: var(--chevron-width);--inputColor: var(--input-color);--inputLeft: var(--input-left);--inputLetterSpacing: var(--input-letter-spacing);--inputMargin: var(--input-margin);--inputPadding: var(--input-padding);--itemActiveBackground: var(--item-active-background);--itemColor: var(--item-color);--itemFirstBorderRadius: var(--item-first-border-radius);--itemHoverBG: var(--item-hover-bg);--itemHoverColor: var(--item-hover-color);--itemIsActiveBG: var(--item-is-active-bg);--itemIsActiveColor: var(--item-is-active-color);--itemIsNotSelectableColor: var(--item-is-not-selectable-color);--itemPadding: var(--item-padding);--listBackground: var(--list-background);--listBorder: var(--list-border);--listBorderRadius: var(--list-border-radius);--listEmptyColor: var(--list-empty-color);--listEmptyPadding: var(--list-empty-padding);--listEmptyTextAlign: var(--list-empty-text-align);--listMaxHeight: var(--list-max-height);--listPosition: var(--list-position);--listShadow: var(--list-shadow);--listZIndex: var(--list-z-index);--multiItemBG: var(--multi-item-bg);--multiItemBorderRadius: var(--multi-item-border-radius);--multiItemDisabledHoverBg: var(--multi-item-disabled-hover-bg);--multiItemDisabledHoverColor: var(--multi-item-disabled-hover-color);--multiItemHeight: var(--multi-item-height);--multiItemMargin: var(--multi-item-margin);--multiItemPadding: var(--multi-item-padding);--multiSelectInputMargin: var(--multi-select-input-margin);--multiSelectInputPadding: var(--multi-select-input-padding);--multiSelectPadding: var(--multi-select-padding);--placeholderColor: var(--placeholder-color);--placeholderOpacity: var(--placeholder-opacity);--selectedItemPadding: var(--selected-item-padding);--spinnerColor: var(--spinner-color);--spinnerHeight: var(--spinner-height);--spinnerWidth: var(--spinner-width);--internal-padding: 0 0 0 16px;border:var(--border, 1px solid #d8dbdf);border-radius:var(--border-radius, 6px);min-height:var(--height, 42px);position:relative;display:flex;align-items:stretch;padding:var(--padding, var(--internal-padding));background:var(--background, #fff);margin:var(--margin, 0);width:var(--width, 100%);font-size:var(--font-size, 16px);max-height:var(--max-height);}.svelte-di53br {box-sizing:var(--box-sizing, border-box);}.svelte-select.svelte-di53br:hover {border:var(--border-hover, 1px solid #b2b8bf);}.value-container.svelte-di53br {display:flex;flex:1 1 0%;flex-wrap:wrap;align-items:center;gap:5px 10px;padding:var(--value-container-padding, 5px 0);position:relative;overflow:var(--value-container-overflow, hidden);align-self:stretch;}.prepend.svelte-di53br,
    .indicators.svelte-di53br {display:flex;flex-shrink:0;align-items:center;}.indicators.svelte-di53br {position:var(--indicators-position);top:var(--indicators-top);right:var(--indicators-right);bottom:var(--indicators-bottom);}input.svelte-di53br {position:absolute;cursor:default;border:none;color:var(--input-color, var(--item-color));padding:var(--input-padding, 0);letter-spacing:var(--input-letter-spacing, inherit);margin:var(--input-margin, 0);min-width:10px;top:0;right:0;bottom:0;left:0;background:transparent;font-size:var(--font-size, 16px);}.svelte-di53br:not(.multi) > .value-container:where(.svelte-di53br) > input:where(.svelte-di53br) {width:100%;height:100%;}input.svelte-di53br::placeholder {color:var(--placeholder-color, #78848f);opacity:var(--placeholder-opacity, 1);}input.svelte-di53br:focus {outline:none;}.svelte-select.focused.svelte-di53br {border:var(--border-focused, 1px solid #006fe8);border-radius:var(--border-radius-focused, var(--border-radius, 6px));}.disabled.svelte-di53br {background:var(--disabled-background, #ebedef);border-color:var(--disabled-border-color, #ebedef);color:var(--disabled-color, #c1c6cc);}.disabled.svelte-di53br input:where(.svelte-di53br)::placeholder {color:var(--disabled-placeholder-color, #c1c6cc);opacity:var(--disabled-placeholder-opacity, 1);}.selected-item.svelte-di53br {position:relative;overflow:var(--selected-item-overflow, hidden);padding:var(--selected-item-padding, 0 20px 0 0);text-overflow:ellipsis;white-space:nowrap;color:var(--selected-item-color, inherit);font-size:var(--font-size, 16px);}.multi.svelte-di53br .selected-item:where(.svelte-di53br) {position:absolute;line-height:var(--height, 42px);height:var(--height, 42px);}.selected-item.svelte-di53br:focus {outline:none;}.hide-selected-item.svelte-di53br {opacity:0;}.icon.svelte-di53br {display:flex;align-items:center;justify-content:center;}.clear-select.svelte-di53br {all:unset;display:flex;align-items:center;justify-content:center;width:var(--clear-select-width, 40px);height:var(--clear-select-height, 100%);color:var(--clear-select-color, var(--icons-color));margin:var(--clear-select-margin, 0);pointer-events:all;flex-shrink:0;}.clear-select.svelte-di53br:focus {outline:var(--clear-select-focus-outline, 1px solid #006fe8);}.loading.svelte-di53br {width:var(--loading-width, 40px);height:var(--loading-height);color:var(--loading-color, var(--icons-color));margin:var(--loading--margin, 0);flex-shrink:0;}.chevron.svelte-di53br {width:var(--chevron-width, 40px);height:var(--chevron-height, 40px);background:var(--chevron-background, transparent);pointer-events:var(--chevron-pointer-events, none);color:var(--chevron-color, var(--icons-color));border:var(--chevron-border, 0 0 0 1px solid #d8dbdf);flex-shrink:0;}.multi.svelte-di53br {padding:var(--multi-select-padding, var(--internal-padding));}.multi.svelte-di53br input:where(.svelte-di53br) {padding:var(--multi-select-input-padding, 0);position:relative;margin:var(--multi-select-input-margin, 5px 0);flex:1 1 40px;}.svelte-select.error.svelte-di53br {border:var(--error-border, 1px solid #ff2d55);background:var(--error-background, #fff);}.a11y-text.svelte-di53br {z-index:9999;border:0px;clip:rect(1px, 1px, 1px, 1px);height:1px;width:1px;position:absolute;overflow:hidden;padding:0px;white-space:nowrap;}.multi-item.svelte-di53br {background:var(--multi-item-bg, #ebedef);margin:var(--multi-item-margin, 0);outline:var(--multi-item-outline, 1px solid #ddd);border-radius:var(--multi-item-border-radius, 4px);height:var(--multi-item-height, 25px);line-height:var(--multi-item-height, 25px);display:flex;cursor:default;padding:var(--multi-item-padding, 0 5px);overflow:hidden;gap:var(--multi-item-gap, 4px);outline-offset:-1px;max-width:var(--multi-max-width, none);color:var(--multi-item-color, var(--item-color));}.multi-item.disabled.svelte-di53br:hover {background:var(--multi-item-disabled-hover-bg, #ebedef);color:var(--multi-item-disabled-hover-color, #c1c6cc);}.multi-item-text.svelte-di53br {overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.multi-item-clear.svelte-di53br {display:flex;align-items:center;justify-content:center;--clear-icon-color: var(--multi-item-clear-icon-color, #000);}.multi-item.active.svelte-di53br {outline:var(--multi-item-active-outline, 1px solid #006fe8);}.svelte-select-list.svelte-di53br {box-shadow:var(--list-shadow, 0 2px 3px 0 rgba(44, 62, 80, 0.24));border-radius:var(--list-border-radius, 4px);max-height:var(--list-max-height, 252px);overflow-y:auto;background:var(--list-background, #fff);position:var(--list-position, absolute);z-index:var(--list-z-index, 2);border:var(--list-border);}.prefloat.svelte-di53br {opacity:0;pointer-events:none;}.list-group-title.svelte-di53br {color:var(--group-title-color, #8f8f8f);cursor:default;font-size:var(--group-title-font-size, 16px);font-weight:var(--group-title-font-weight, 600);height:var(--height, 42px);line-height:var(--height, 42px);padding:var(--group-title-padding, 0 20px);text-overflow:ellipsis;overflow-x:hidden;white-space:nowrap;text-transform:var(--group-title-text-transform, uppercase);border-width:var(--group-title-border-width, medium);border-style:var(--group-title-border-style, none);border-color:var(--group-title-border-color, color);}.empty.svelte-di53br {text-align:var(--list-empty-text-align, center);padding:var(--list-empty-padding, 20px 0);color:var(--list-empty-color, #78848f);}.item.svelte-di53br {cursor:default;height:var(--item-height, var(--height, 42px));line-height:var(--item-line-height, var(--height, 42px));padding:var(--item-padding, 0 20px);color:var(--item-color, inherit);text-overflow:ellipsis;overflow:hidden;white-space:nowrap;transition:var(--item-transition, all 0.2s);align-items:center;width:100%;}.item.group-item.svelte-di53br {padding-left:var(--group-item-padding-left, 40px);}.item.svelte-di53br:active {background:var(--item-active-background, #b9daff);}.item.active.svelte-di53br {background:var(--item-is-active-bg, #007aff);color:var(--item-is-active-color, #fff);}.item.first.svelte-di53br {border-radius:var(--item-first-border-radius, 4px 4px 0 0);}.item.hover.svelte-di53br:not(.active) {background:var(--item-hover-bg, #e7f2ff);color:var(--item-hover-color, inherit);}.item.not-selectable.svelte-di53br,
    .item.hover.item.not-selectable.svelte-di53br,
    .item.active.item.not-selectable.svelte-di53br,
    .item.not-selectable.svelte-di53br:active {color:var(--item-is-not-selectable-color, #999);background:transparent;}.required.svelte-di53br {opacity:0;z-index:-1;position:absolute;top:0;left:0;bottom:0;right:0;}`,
};
function vc(r, t) {
  const e = Uf(t);
  (Be(t, !1), pi(r, Dh));
  const n = Ft(),
    i = Ft(),
    a = Ft(),
    o = Ft(),
    s = Ft(),
    l = Ft(),
    c = Ft(),
    p = Ft(),
    d = Ft(),
    v = zf();
  let u = lt(t, "justValue", 12, null),
    f = lt(t, "filter", 12, fh),
    h = lt(t, "getItems", 12, dh),
    b = lt(t, "id", 12, null),
    g = lt(t, "name", 12, null),
    _ = lt(t, "container", 12, void 0),
    y = lt(t, "input", 12, void 0),
    k = lt(t, "multiple", 12, !1),
    P = lt(t, "multiFullItemClearable", 12, !1),
    D = lt(t, "disabled", 12, !1),
    T = lt(t, "focused", 12, !1),
    S = lt(t, "value", 12, null),
    O = lt(t, "filterText", 12, ""),
    V = lt(t, "placeholder", 12, "Please select"),
    at = lt(t, "placeholderAlwaysShow", 12, !1),
    E = lt(t, "items", 12, null),
    B = lt(t, "label", 12, "label"),
    w = lt(t, "itemFilter", 12, ($, X, kt) => `${$}`.toLowerCase().includes(X.toLowerCase())),
    U = lt(t, "groupBy", 12, void 0),
    ft = lt(t, "groupFilter", 12, ($) => $),
    J = lt(t, "groupHeaderSelectable", 12, !1),
    rt = lt(t, "itemId", 12, "value"),
    Y = lt(t, "loadOptions", 12, void 0),
    dt = lt(t, "containerStyles", 12, ""),
    R = lt(t, "hasError", 12, !1),
    I = lt(t, "filterSelectedItems", 12, !0),
    ut = lt(t, "required", 12, !1),
    st = lt(t, "closeListOnChange", 12, !0),
    et = lt(t, "clearFilterTextOnBlur", 12, !0),
    zt = lt(t, "createGroupHeaderItem", 12, ($, X) => ({ value: $, [B()]: $ }));
  const te = () => A(c);
  let xt = lt(t, "searchable", 12, !0),
    At = lt(t, "inputStyles", 12, ""),
    Xt = lt(t, "clearable", 12, !0),
    Tt = lt(t, "loading", 12, !1),
    pt = lt(t, "listOpen", 12, !1),
    ve,
    m = lt(t, "debounce", 12, ($, X = 1) => {
      (clearTimeout(ve), (ve = setTimeout($, X)));
    }),
    q = lt(t, "debounceWait", 12, 300),
    L = lt(t, "hideEmptyState", 12, !1),
    C = lt(t, "inputAttributes", 28, () => ({})),
    x = lt(t, "listAutoWidth", 12, !0),
    N = lt(t, "showChevron", 12, !1),
    K = lt(t, "listOffset", 12, 5),
    W = lt(t, "hoverItemIndex", 12, 0),
    F = lt(t, "floatingConfig", 28, () => ({})),
    z = lt(t, "class", 12, ""),
    M = Ft(),
    G = Ft(),
    it = Ft(),
    ht = Ft();
  function vt() {
    if (typeof S() == "string") {
      let $ = (E() || []).find((X) => X[rt()] === S());
      S($ || { [rt()]: S(), label: S() });
    } else
      k() &&
        Array.isArray(S()) &&
        S().length > 0 &&
        S(S().map(($) => (typeof $ == "string" ? { value: $, label: $ } : $)));
  }
  let Bt = Ft();
  function $t() {
    (Q(
      Bt,
      Object.assign(
        {
          autocapitalize: "none",
          autocomplete: "off",
          autocorrect: "off",
          spellcheck: !1,
          tabindex: 0,
          type: "text",
          "aria-autocomplete": "list",
        },
        C(),
      ),
    ),
      b() && Hi(Bt, (A(Bt).id = b())),
      xt() || Hi(Bt, (A(Bt).readonly = !0)));
  }
  function Jt($) {
    return $.map((X, kt) => ({ index: kt, value: X, label: `${X}` }));
  }
  function Ee($) {
    const X = [],
      kt = {};
    $.forEach((Pe) => {
      const ne = U()(Pe);
      (X.includes(ne) ||
        (X.push(ne),
        (kt[ne] = []),
        ne &&
          kt[ne].push(Object.assign(zt()(ne, Pe), { id: ne, groupHeader: !0, selectable: J() }))),
        kt[ne].push(Object.assign({ groupItem: !!ne }, Pe)));
    });
    const Qt = [];
    return (
      ft()(X).forEach((Pe) => {
        kt[Pe] && Qt.push(...kt[Pe]);
      }),
      Qt
    );
  }
  function St() {
    if (k()) {
      JSON.stringify(S()) !== JSON.stringify(A(G)) && Dt() && v("input", S());
      return;
    }
    (!A(G) || JSON.stringify(S()[rt()]) !== JSON.stringify(A(G)[rt()])) && v("input", S());
  }
  function le() {
    S() && (Array.isArray(S()) ? S([...S()]) : S([S()]));
  }
  function _e() {
    S() && S(null);
  }
  function ce() {
    const $ = A(c).findIndex((X) => X[rt()] === S()[rt()]);
    Nt($, !0);
  }
  function Ht($) {
    v("hoverItem", $);
  }
  function Nt($ = 0, X) {
    (W($ < 0 ? 0 : $), !X && U() && A(c)[W()] && !A(c)[W()].selectable && zi(1));
  }
  function Zt() {
    (!Y() && O().length === 0) ||
      (Y()
        ? m()(async function () {
            Tt(!0);
            let $ = await h()({
              dispatch: v,
              loadOptions: Y(),
              convertStringItemsToObjects: Jt,
              filterText: O(),
            });
            $
              ? (Tt($.loading),
                pt(pt() ? $.listOpen : O().length > 0),
                T(pt() && $.focused),
                E(U() ? Ee($.filteredItems) : $.filteredItems))
              : (Tt(!1), T(!0), pt(!0));
          }, q())
        : (pt(!0), k() && Q(M, void 0)));
  }
  function qt($) {
    pt() && v("filter", $);
  }
  Lf(async () => {
    (Q(G, S()), Q(it, O()), Q(ht, k()));
  });
  function re() {
    return k() ? (S() ? S().map(($) => $[rt()]) : null) : S() ? S()[rt()] : S();
  }
  function Dt() {
    let $ = !0;
    if (S()) {
      const X = [],
        kt = [];
      (S().forEach((Qt) => {
        X.includes(Qt[rt()]) ? ($ = !1) : (X.push(Qt[rt()]), kt.push(Qt));
      }),
        $ || S(kt));
    }
    return $;
  }
  function Wt($) {
    let X = $ ? $[rt()] : S()[rt()];
    return E().find((kt) => kt[rt()] === X);
  }
  function tr($) {
    !$ ||
      $.length === 0 ||
      $.some((X) => typeof X != "object") ||
      !S() ||
      (k() ? S().some((X) => !X || !X[rt()]) : !S()[rt()]) ||
      (Array.isArray(S()) ? S(S().map((X) => Wt(X) || X)) : S(Wt() || S()));
  }
  async function cn($) {
    const X = S()[$];
    (S().length === 1 ? S(void 0) : S(S().filter((kt) => kt !== X)), v("clear", X));
  }
  function Wr($) {
    if (T())
      switch (($.stopPropagation(), $.key)) {
        case "Escape":
          ($.preventDefault(), Gt());
          break;
        case "Enter":
          if (($.preventDefault(), pt())) {
            if (A(c).length === 0) break;
            const X = A(c)[W()];
            if (S() && !k() && S()[rt()] === X[rt()]) {
              Gt();
              break;
            } else za(A(c)[W()]);
          }
          break;
        case "ArrowDown":
          ($.preventDefault(), pt() ? zi(1) : (pt(!0), Q(M, void 0)));
          break;
        case "ArrowUp":
          ($.preventDefault(), pt() ? zi(-1) : (pt(!0), Q(M, void 0)));
          break;
        case "Tab":
          if (pt() && T()) {
            if (A(c).length === 0 || (S() && S()[rt()] === A(c)[W()][rt()])) return Gt();
            ($.preventDefault(), za(A(c)[W()]), Gt());
          }
          break;
        case "Backspace":
          if (!k() || O().length > 0) return;
          if (k() && S() && S().length > 0) {
            if ((cn(A(M) !== void 0 ? A(M) : S().length - 1), A(M) === 0 || A(M) === void 0)) break;
            Q(M, S().length > A(M) ? A(M) - 1 : void 0);
          }
          break;
        case "ArrowLeft":
          if (!S() || !k() || O().length > 0) return;
          A(M) === void 0
            ? Q(M, S().length - 1)
            : S().length > A(M) && A(M) !== 0 && Q(M, A(M) - 1);
          break;
        case "ArrowRight":
          if (!S() || !k() || O().length > 0 || A(M) === void 0) return;
          A(M) === S().length - 1 ? Q(M, void 0) : A(M) < S().length - 1 && Q(M, A(M) + 1);
          break;
      }
  }
  function Pr($) {
    var X;
    (T() && y() === (document == null ? void 0 : document.activeElement)) ||
      ($ && v("focus", $), (X = y()) == null || X.focus(), T(!0));
  }
  async function Ur($) {
    var X;
    Ra ||
      ((pt() || T()) && (v("blur", $), Gt(), T(!1), Q(M, void 0), (X = y()) == null || X.blur()));
  }
  function Bn() {
    if (!D()) {
      if (O().length > 0) return pt(!0);
      pt(!pt());
    }
  }
  function Ar() {
    (v("clear", S()), S(void 0), Gt(), Pr());
  }
  qs(() => {
    (pt() && T(!0), T() && y() && y().focus());
  });
  function In($) {
    if ($) {
      O("");
      const X = Object.assign({}, $);
      if (X.groupHeader && !X.selectable) return;
      (S(k() ? (S() ? S().concat([X]) : [X]) : S(X)),
        setTimeout(() => {
          (st() && Gt(), Q(M, void 0), v("change", S()), v("select", $));
        }));
    }
  }
  function Gt() {
    (et() && O(""), pt(!1));
  }
  let yt = lt(t, "ariaValues", 12, ($) => `Option ${$}, selected.`),
    ae = lt(
      t,
      "ariaListOpen",
      12,
      ($, X) => `You are currently focused on option ${$}. There are ${X} results available.`,
    ),
    Vr = lt(
      t,
      "ariaFocused",
      12,
      () => "Select is focused, type to refine list, press down to open the menu.",
    );
  function mi($) {
    let X;
    return (
      $ && S().length > 0
        ? (X = S()
            .map((kt) => kt[B()])
            .join(", "))
        : (X = S()[B()]),
      yt()(X)
    );
  }
  function wc() {
    if (!A(c) || A(c).length === 0) return "";
    let $ = A(c)[W()];
    if (pt() && $) {
      let X = A(c) ? A(c).length : 0;
      return ae()($[B()], X);
    } else return Vr()();
  }
  let Ue = Ft(null),
    to;
  function eo() {
    (clearTimeout(to),
      (to = setTimeout(() => {
        Ra = !1;
      }, 100)));
  }
  function _c($) {
    var X;
    !pt() &&
      !T() &&
      _() &&
      !_().contains($.target) &&
      !((X = A(Ue)) != null && X.contains($.target)) &&
      Ur();
  }
  Gs(() => {
    var $;
    ($ = A(Ue)) == null || $.remove();
  });
  let Ra = !1;
  function za($) {
    !$ || $.selectable === !1 || In($);
  }
  function ro($) {
    Ra || W($);
  }
  function yc($) {
    const { item: X, i: kt } = $;
    if ((X == null ? void 0 : X.selectable) !== !1) {
      if (S() && !k() && S()[rt()] === X[rt()]) return Gt();
      xc(X) && (W(kt), za(X));
    }
  }
  function zi($) {
    if (A(c).filter((Qt) => !Object.hasOwn(Qt, "selectable") || Qt.selectable === !0).length === 0)
      return W(0);
    $ > 0 && W() === A(c).length - 1 ? W(0) : $ < 0 && W() === 0 ? W(A(c).length - 1) : W(W() + $);
    const kt = A(c)[W()];
    if (kt && kt.selectable === !1) {
      ($ === 1 || $ === -1) && zi($);
      return;
    }
  }
  function no($, X, kt) {
    if (!k()) return X && X[kt] === $[kt];
  }
  function kc($) {
    return $ === 0;
  }
  function xc($) {
    return ($.groupHeader && $.selectable) || $.selectable || !$.hasOwnProperty("selectable");
  }
  const La = io,
    Ma = io;
  function io($) {
    return {
      update(X) {
        X.scroll && (eo(), $.scrollIntoView({ behavior: "auto", block: "nearest" }));
      },
    };
  }
  function Sc() {
    const { width: $ } = _().getBoundingClientRect();
    Hi(Ue, (A(Ue).style.width = x() ? $ + "px" : "auto"));
  }
  let gi = Ft({
    strategy: "absolute",
    placement: "bottom-start",
    middleware: [sh(K()), lh(), oh()],
    autoUpdate: !1,
  });
  const [Wa, Ua, Cc] = uh(A(gi));
  let Va = Ft(!0);
  function $c($, X) {
    if (!$ || !X) return Q(Va, !0);
    setTimeout(() => {
      Q(Va, !1);
    }, 0);
  }
  (Ot(
    () => (nt(E()), nt(S())),
    () => {
      (E(), S() && vt());
    },
  ),
    Ot(
      () => (nt(C()), nt(xt())),
      () => {
        (C() || !xt()) && $t();
      },
    ),
    Ot(
      () => nt(k()),
      () => {
        k() && le();
      },
    ),
    Ot(
      () => (A(ht), nt(k())),
      () => {
        A(ht) && !k() && _e();
      },
    ),
    Ot(
      () => (nt(k()), nt(S())),
      () => {
        k() && S() && S().length > 1 && Dt();
      },
    ),
    Ot(
      () => nt(S()),
      () => {
        S() && St();
      },
    ),
    Ot(
      () => (nt(S()), nt(k()), A(G)),
      () => {
        !S() && k() && A(G) && v("input", S());
      },
    ),
    Ot(
      () => (nt(T()), nt(y())),
      () => {
        !T() && y() && Gt();
      },
    ),
    Ot(
      () => (nt(O()), A(it)),
      () => {
        O() !== A(it) && Zt();
      },
    ),
    Ot(
      () => (
        nt(f()),
        nt(Y()),
        nt(O()),
        nt(E()),
        nt(k()),
        nt(S()),
        nt(rt()),
        nt(U()),
        nt(B()),
        nt(I()),
        nt(w())
      ),
      () => {
        Q(
          c,
          f()({
            loadOptions: Y(),
            filterText: O(),
            items: E(),
            multiple: k(),
            value: S(),
            itemId: rt(),
            groupBy: U(),
            label: B(),
            filterSelectedItems: I(),
            itemFilter: w(),
            convertStringItemsToObjects: Jt,
            filterGroupedItems: Ee,
          }),
        );
      },
    ),
    Ot(
      () => (nt(k()), nt(pt()), nt(S()), A(c)),
      () => {
        !k() && pt() && S() && A(c) && ce();
      },
    ),
    Ot(
      () => (nt(pt()), nt(k())),
      () => {
        pt() && k() && W(0);
      },
    ),
    Ot(
      () => nt(O()),
      () => {
        O() && W(0);
      },
    ),
    Ot(
      () => nt(W()),
      () => {
        Ht(W());
      },
    ),
    Ot(
      () => (nt(k()), nt(S())),
      () => {
        Q(n, k() ? S() && S().length > 0 : S());
      },
    ),
    Ot(
      () => (A(n), nt(O())),
      () => {
        Q(i, A(n) && O().length > 0);
      },
    ),
    Ot(
      () => (A(n), nt(Xt()), nt(D()), nt(Tt())),
      () => {
        Q(a, A(n) && Xt() && !D() && !Tt());
      },
    ),
    Ot(
      () => (nt(at()), nt(k()), nt(V()), nt(S())),
      () => {
        var $;
        Q(
          o,
          (at() && k()) || (k() && (($ = S()) == null ? void 0 : $.length) === 0)
            ? V()
            : S()
              ? ""
              : V(),
        );
      },
    ),
    Ot(
      () => (nt(S()), nt(k())),
      () => {
        Q(s, S() ? mi(k()) : "");
      },
    ),
    Ot(
      () => (A(c), nt(W()), nt(T()), nt(pt())),
      () => {
        Q(l, wc({ filteredItems: A(c), hoverItemIndex: W(), focused: T(), listOpen: pt() }));
      },
    ),
    Ot(
      () => nt(E()),
      () => {
        tr(E());
      },
    ),
    Ot(
      () => (nt(k()), nt(S()), nt(rt())),
      () => {
        u(re(k(), S(), rt()));
      },
    ),
    Ot(
      () => (nt(k()), A(G), nt(S())),
      () => {
        !k() && A(G) && !S() && v("input", S());
      },
    ),
    Ot(
      () => (nt(pt()), A(c), nt(k()), nt(S())),
      () => {
        pt() && A(c) && !k() && !S() && Nt();
      },
    ),
    Ot(
      () => A(c),
      () => {
        qt(A(c));
      },
    ),
    Ot(
      () => (nt(_()), nt(F()), A(gi)),
      () => {
        _() && F() && Cc(Object.assign(A(gi), F()));
      },
    ),
    Ot(
      () => A(Ue),
      () => {
        Q(p, !!A(Ue));
      },
    ),
    Ot(
      () => (A(Ue), nt(pt())),
      () => {
        $c(A(Ue), pt());
      },
    ),
    Ot(
      () => (nt(pt()), nt(_()), A(Ue)),
      () => {
        pt() && _() && A(Ue) && Sc();
      },
    ),
    Ot(
      () => nt(W()),
      () => {
        Q(d, W());
      },
    ),
    Ot(
      () => (nt(y()), nt(pt()), nt(T())),
      () => {
        y() && pt() && !T() && Pr();
      },
    ),
    Ot(
      () => (nt(_()), nt(F())),
      () => {
        var $;
        _() &&
          (($ = F()) == null ? void 0 : $.autoUpdate) === void 0 &&
          Hi(gi, (A(gi).autoUpdate = !0));
      },
    ),
    bf());
  var Ec = {
    getFilteredItems: te,
    handleClear: Ar,
    get justValue() {
      return u();
    },
    set justValue($) {
      (u($), ot());
    },
    get filter() {
      return f();
    },
    set filter($) {
      (f($), ot());
    },
    get getItems() {
      return h();
    },
    set getItems($) {
      (h($), ot());
    },
    get id() {
      return b();
    },
    set id($) {
      (b($), ot());
    },
    get name() {
      return g();
    },
    set name($) {
      (g($), ot());
    },
    get container() {
      return _();
    },
    set container($) {
      (_($), ot());
    },
    get input() {
      return y();
    },
    set input($) {
      (y($), ot());
    },
    get multiple() {
      return k();
    },
    set multiple($) {
      (k($), ot());
    },
    get multiFullItemClearable() {
      return P();
    },
    set multiFullItemClearable($) {
      (P($), ot());
    },
    get disabled() {
      return D();
    },
    set disabled($) {
      (D($), ot());
    },
    get focused() {
      return T();
    },
    set focused($) {
      (T($), ot());
    },
    get value() {
      return S();
    },
    set value($) {
      (S($), ot());
    },
    get filterText() {
      return O();
    },
    set filterText($) {
      (O($), ot());
    },
    get placeholder() {
      return V();
    },
    set placeholder($) {
      (V($), ot());
    },
    get placeholderAlwaysShow() {
      return at();
    },
    set placeholderAlwaysShow($) {
      (at($), ot());
    },
    get items() {
      return E();
    },
    set items($) {
      (E($), ot());
    },
    get label() {
      return B();
    },
    set label($) {
      (B($), ot());
    },
    get itemFilter() {
      return w();
    },
    set itemFilter($) {
      (w($), ot());
    },
    get groupBy() {
      return U();
    },
    set groupBy($) {
      (U($), ot());
    },
    get groupFilter() {
      return ft();
    },
    set groupFilter($) {
      (ft($), ot());
    },
    get groupHeaderSelectable() {
      return J();
    },
    set groupHeaderSelectable($) {
      (J($), ot());
    },
    get itemId() {
      return rt();
    },
    set itemId($) {
      (rt($), ot());
    },
    get loadOptions() {
      return Y();
    },
    set loadOptions($) {
      (Y($), ot());
    },
    get containerStyles() {
      return dt();
    },
    set containerStyles($) {
      (dt($), ot());
    },
    get hasError() {
      return R();
    },
    set hasError($) {
      (R($), ot());
    },
    get filterSelectedItems() {
      return I();
    },
    set filterSelectedItems($) {
      (I($), ot());
    },
    get required() {
      return ut();
    },
    set required($) {
      (ut($), ot());
    },
    get closeListOnChange() {
      return st();
    },
    set closeListOnChange($) {
      (st($), ot());
    },
    get clearFilterTextOnBlur() {
      return et();
    },
    set clearFilterTextOnBlur($) {
      (et($), ot());
    },
    get createGroupHeaderItem() {
      return zt();
    },
    set createGroupHeaderItem($) {
      (zt($), ot());
    },
    get searchable() {
      return xt();
    },
    set searchable($) {
      (xt($), ot());
    },
    get inputStyles() {
      return At();
    },
    set inputStyles($) {
      (At($), ot());
    },
    get clearable() {
      return Xt();
    },
    set clearable($) {
      (Xt($), ot());
    },
    get loading() {
      return Tt();
    },
    set loading($) {
      (Tt($), ot());
    },
    get listOpen() {
      return pt();
    },
    set listOpen($) {
      (pt($), ot());
    },
    get debounce() {
      return m();
    },
    set debounce($) {
      (m($), ot());
    },
    get debounceWait() {
      return q();
    },
    set debounceWait($) {
      (q($), ot());
    },
    get hideEmptyState() {
      return L();
    },
    set hideEmptyState($) {
      (L($), ot());
    },
    get inputAttributes() {
      return C();
    },
    set inputAttributes($) {
      (C($), ot());
    },
    get listAutoWidth() {
      return x();
    },
    set listAutoWidth($) {
      (x($), ot());
    },
    get showChevron() {
      return N();
    },
    set showChevron($) {
      (N($), ot());
    },
    get listOffset() {
      return K();
    },
    set listOffset($) {
      (K($), ot());
    },
    get hoverItemIndex() {
      return W();
    },
    set hoverItemIndex($) {
      (W($), ot());
    },
    get floatingConfig() {
      return F();
    },
    set floatingConfig($) {
      (F($), ot());
    },
    get class() {
      return z();
    },
    set class($) {
      (z($), ot());
    },
    get ariaValues() {
      return yt();
    },
    set ariaValues($) {
      (yt($), ot());
    },
    get ariaListOpen() {
      return ae();
    },
    set ariaListOpen($) {
      (ae($), ot());
    },
    get ariaFocused() {
      return Vr();
    },
    set ariaFocused($) {
      (Vr($), ot());
    },
  };
  Xl();
  var Hr = Th();
  (se("click", la, _c), se("keydown", la, Wr));
  let ao;
  var so = _t(Hr);
  {
    var Pc = ($) => {
      var X = yh();
      let kt;
      var Qt = _t(X);
      {
        var Pe = (jt) => {
          var ue = ie(),
            cr = ee(ue);
          (ke(cr, t, "list-prepend", {}, null), ct(jt, ue));
        };
        Ut(Qt, (jt) => {
          Vt(() => e["list-prepend"]) && jt(Pe);
        });
      }
      var ne = wt(Qt, 2);
      {
        var Fr = (jt) => {
            var ue = ie(),
              cr = ee(ue);
            (ke(
              cr,
              t,
              "list",
              {
                get filteredItems() {
                  return A(c);
                },
              },
              null,
            ),
              ct(jt, ue));
          },
          zn = (jt) => {
            var ue = ie(),
              cr = ee(ue);
            {
              var wi = (Zr) => {
                  var un = ie(),
                    Re = ee(un);
                  (Ai(
                    Re,
                    1,
                    () => A(c),
                    ua,
                    (er, Ae, Ve) => {
                      var Dr = wh(),
                        fn = _t(Dr);
                      let Li;
                      var zc = _t(fn);
                      (ke(
                        zc,
                        t,
                        "item",
                        {
                          get item() {
                            return A(Ae);
                          },
                          index: Ve,
                        },
                        (He) => {
                          var Mi = dr();
                          (me(() =>
                            Yr(
                              Mi,
                              (A(Ae),
                              nt(B()),
                              Vt(() => {
                                var fo;
                                return (fo = A(Ae)) == null ? void 0 : fo[B()];
                              })),
                            ),
                          ),
                            ct(He, Mi));
                        },
                      ),
                        gt(fn),
                        Zi(
                          fn,
                          (He, Mi) => (La == null ? void 0 : La(He)),
                          () => ({ scroll: no(A(Ae), S(), rt()), listDom: A(p) }),
                        ),
                        Zi(
                          fn,
                          (He, Mi) => (Ma == null ? void 0 : Ma(He)),
                          () => ({ scroll: A(d) === Ve, listDom: A(p) }),
                        ),
                        gt(Dr),
                        me(
                          (He) => (Li = gr(fn, 1, "item svelte-di53br", null, Li, He)),
                          [
                            () => {
                              var He;
                              return {
                                "list-group-title": A(Ae).groupHeader,
                                active: no(A(Ae), S(), rt()),
                                first: kc(Ve),
                                hover: W() === Ve,
                                "group-item": A(Ae).groupItem,
                                "not-selectable":
                                  ((He = A(Ae)) == null ? void 0 : He.selectable) === !1,
                              };
                            },
                          ],
                        ),
                        se("mouseover", Dr, () => ro(Ve)),
                        se("focus", Dr, () => ro(Ve)),
                        se(
                          "click",
                          Dr,
                          Mn(() => yc({ item: A(Ae), i: Ve })),
                        ),
                        se(
                          "keydown",
                          Dr,
                          dn(
                            Mn(function (He) {
                              qi.call(this, t, He);
                            }),
                          ),
                        ),
                        ct(er, Dr));
                    },
                  ),
                    ct(Zr, un));
                },
                Ya = (Zr) => {
                  var un = ie(),
                    Re = ee(un);
                  {
                    var er = (Ae) => {
                      var Ve = ie(),
                        Dr = ee(Ve);
                      (ke(Dr, t, "empty", {}, (fn) => {
                        var Li = _h();
                        ct(fn, Li);
                      }),
                        ct(Ae, Ve));
                    };
                    Ut(
                      Re,
                      (Ae) => {
                        L() || Ae(er);
                      },
                      !0,
                    );
                  }
                  ct(Zr, un);
                };
              Ut(
                cr,
                (Zr) => {
                  (A(c), Vt(() => A(c).length > 0) ? Zr(wi) : Zr(Ya, !1));
                },
                !0,
              );
            }
            ct(jt, ue);
          };
        Ut(ne, (jt) => {
          Vt(() => e.list) ? jt(Fr) : jt(zn, !1);
        });
      }
      var bi = wt(ne, 2);
      {
        var Tr = (jt) => {
          var ue = ie(),
            cr = ee(ue);
          (ke(cr, t, "list-append", {}, null), ct(jt, ue));
        };
        Ut(bi, (jt) => {
          Vt(() => e["list-append"]) && jt(Tr);
        });
      }
      (gt(X),
        Zi(X, (jt) => (Ua == null ? void 0 : Ua(jt))),
        rs(
          X,
          (jt) => Q(Ue, jt),
          () => A(Ue),
        ),
        Br(() => se("scroll", X, eo)),
        Br(() =>
          se(
            "pointerup",
            X,
            dn(
              Mn(function (jt) {
                qi.call(this, t, jt);
              }),
            ),
          ),
        ),
        Br(() =>
          se(
            "mousedown",
            X,
            dn(
              Mn(function (jt) {
                qi.call(this, t, jt);
              }),
            ),
          ),
        ),
        me(
          (jt) => (kt = gr(X, 1, "svelte-select-list svelte-di53br", null, kt, jt)),
          [() => ({ prefloat: A(Va) })],
        ),
        ct($, X));
    };
    Ut(so, ($) => {
      pt() && $(Pc);
    });
  }
  var Ha = wt(so, 2),
    Ac = _t(Ha);
  {
    var Fc = ($) => {
      var X = kh(),
        kt = ee(X),
        Qt = _t(kt, !0);
      gt(kt);
      var Pe = wt(kt, 2),
        ne = _t(Pe, !0);
      (gt(Pe),
        me(() => {
          (Yr(Qt, A(s)), Yr(ne, A(l)));
        }),
        ct($, X));
    };
    Ut(Ac, ($) => {
      T() && $(Fc);
    });
  }
  gt(Ha);
  var Za = wt(Ha, 2),
    Tc = _t(Za);
  (ke(Tc, t, "prepend", {}, null), gt(Za));
  var qa = wt(Za, 2),
    oo = _t(qa);
  {
    var Dc = ($) => {
      var X = ie(),
        kt = ee(X);
      {
        var Qt = (ne) => {
            var Fr = ie(),
              zn = ee(Fr);
            (Ai(zn, 1, S, ua, (bi, Tr, jt) => {
              var ue = Sh();
              let cr;
              var wi = _t(ue),
                Ya = _t(wi);
              (ke(
                Ya,
                t,
                "selection",
                {
                  get selection() {
                    return A(Tr);
                  },
                  index: jt,
                },
                (Re) => {
                  var er = dr();
                  (me(() => Yr(er, (A(Tr), nt(B()), Vt(() => A(Tr)[B()])))), ct(Re, er));
                },
              ),
                gt(wi));
              var Zr = wt(wi, 2);
              {
                var un = (Re) => {
                  var er = xh(),
                    Ae = _t(er);
                  (ke(Ae, t, "multi-clear-icon", {}, (Ve) => {
                    na(Ve);
                  }),
                    gt(er),
                    se("pointerup", er, dn(Mn(() => cn(jt)))),
                    ct(Re, er));
                };
                Ut(Zr, (Re) => {
                  !D() && !P() && na && Re(un);
                });
              }
              (gt(ue),
                me(
                  (Re) => (cr = gr(ue, 1, "multi-item svelte-di53br", null, cr, Re)),
                  [() => ({ active: A(M) === jt, disabled: D() })],
                ),
                se(
                  "click",
                  ue,
                  dn(() => (P() ? cn(jt) : {})),
                ),
                se(
                  "keydown",
                  ue,
                  dn(
                    Mn(function (Re) {
                      qi.call(this, t, Re);
                    }),
                  ),
                ),
                ct(bi, ue));
            }),
              ct(ne, Fr));
          },
          Pe = (ne) => {
            var Fr = Ch();
            let zn;
            var bi = _t(Fr);
            (ke(
              bi,
              t,
              "selection",
              {
                get selection() {
                  return S();
                },
              },
              (Tr) => {
                var jt = dr();
                (me(() => Yr(jt, (nt(S()), nt(B()), Vt(() => S()[B()])))), ct(Tr, jt));
              },
            ),
              gt(Fr),
              me(
                (Tr) => (zn = gr(Fr, 1, "selected-item svelte-di53br", null, zn, Tr)),
                [() => ({ "hide-selected-item": A(i) })],
              ),
              ct(ne, Fr));
          };
        Ut(kt, (ne) => {
          k() ? ne(Qt) : ne(Pe, !1);
        });
      }
      ct($, X);
    };
    Ut(oo, ($) => {
      A(n) && $(Dc);
    });
  }
  var Rn = wt(oo, 2);
  (xs(
    Rn,
    () => ({ readOnly: !xt(), ...A(Bt), placeholder: A(o), style: At(), disabled: D() }),
    void 0,
    void 0,
    "svelte-di53br",
    !0,
  ),
    rs(
      Rn,
      ($) => y($),
      () => y(),
    ),
    gt(qa));
  var Ga = wt(qa, 2),
    lo = _t(Ga);
  {
    var Nc = ($) => {
      var X = $h(),
        kt = _t(X);
      (ke(kt, t, "loading-icon", {}, (Qt) => {
        pc(Qt);
      }),
        gt(X),
        ct($, X));
    };
    Ut(lo, ($) => {
      Tt() && $(Nc);
    });
  }
  var co = wt(lo, 2);
  {
    var jc = ($) => {
      var X = Eh(),
        kt = _t(X);
      (ke(kt, t, "clear-icon", {}, (Qt) => {
        na(Qt);
      }),
        gt(X),
        se("click", X, Ar),
        ct($, X));
    };
    Ut(co, ($) => {
      A(a) && $(jc);
    });
  }
  var Oc = wt(co, 2);
  {
    var Bc = ($) => {
      var X = Ph(),
        kt = _t(X);
      (ke(
        kt,
        t,
        "chevron-icon",
        {
          get listOpen() {
            return pt();
          },
        },
        (Qt) => {
          hc(Qt);
        },
      ),
        gt(X),
        ct($, X));
    };
    Ut(Oc, ($) => {
      N() && $(Bc);
    });
  }
  gt(Ga);
  var uo = wt(Ga, 2);
  ke(
    uo,
    t,
    "input-hidden",
    {
      get value() {
        return S();
      },
    },
    ($) => {
      var X = Ah();
      (fa(X),
        me(
          (kt) => {
            (an(X, "name", g()), ks(X, kt));
          },
          [() => (nt(S()), Vt(() => (S() ? JSON.stringify(S()) : null)))],
        ),
        ct($, X));
    },
  );
  var Ic = wt(uo, 2);
  {
    var Rc = ($) => {
      var X = ie(),
        kt = ee(X);
      (ke(
        kt,
        t,
        "required",
        {
          get value() {
            return S();
          },
        },
        (Qt) => {
          var Pe = Fh();
          ct(Qt, Pe);
        },
      ),
        ct($, X));
    };
    Ut(Ic, ($) => {
      (nt(ut()), nt(S()), Vt(() => ut() && (!S() || S().length === 0)) && $(Rc));
    });
  }
  return (
    gt(Hr),
    Br(() => se("pointerup", Hr, dn(Bn))),
    rs(
      Hr,
      ($) => _($),
      () => _(),
    ),
    Zi(Hr, ($) => (Wa == null ? void 0 : Wa($))),
    me(
      ($) => {
        ((ao = gr(Hr, 1, `svelte-select ${z() ?? ""}`, "svelte-di53br", ao, $)), Ys(Hr, dt()));
      },
      [
        () => ({
          multi: k(),
          disabled: D(),
          focused: T(),
          "list-open": pt(),
          "show-chevron": N(),
          error: R(),
        }),
      ],
    ),
    se("keydown", Rn, Wr),
    se("blur", Rn, Ur),
    se("focus", Rn, Pr),
    nd(Rn, O),
    ct(r, Hr),
    Fo(t, "getFilteredItems", te),
    Fo(t, "handleClear", Ar),
    Ie(Ec)
  );
}
$e(
  vc,
  {
    justValue: {},
    filter: {},
    getItems: {},
    id: {},
    name: {},
    container: {},
    input: {},
    multiple: {},
    multiFullItemClearable: {},
    disabled: {},
    focused: {},
    value: {},
    filterText: {},
    placeholder: {},
    placeholderAlwaysShow: {},
    items: {},
    label: {},
    itemFilter: {},
    groupBy: {},
    groupFilter: {},
    groupHeaderSelectable: {},
    itemId: {},
    loadOptions: {},
    containerStyles: {},
    hasError: {},
    filterSelectedItems: {},
    required: {},
    closeListOnChange: {},
    clearFilterTextOnBlur: {},
    createGroupHeaderItem: {},
    searchable: {},
    inputStyles: {},
    clearable: {},
    loading: {},
    listOpen: {},
    debounce: {},
    debounceWait: {},
    hideEmptyState: {},
    inputAttributes: {},
    listAutoWidth: {},
    showChevron: {},
    listOffset: {},
    hoverItemIndex: {},
    floatingConfig: {},
    class: {},
    ariaValues: {},
    ariaListOpen: {},
    ariaFocused: {},
  },
  [
    "list-prepend",
    "list",
    "item",
    "empty",
    "list-append",
    "prepend",
    "selection",
    "multi-clear-icon",
    "loading-icon",
    "clear-icon",
    "chevron-icon",
    "input-hidden",
    "required",
  ],
  ["getFilteredItems", "handleClear"],
  !0,
);
function mc(r) {
  const t = r - 1;
  return t * t * t + 1;
}
function Nh(r, { from: t, to: e }, n = {}) {
  var { delay: i = 0, duration: a = (D) => Math.sqrt(D) * 120, easing: o = mc } = n,
    s = getComputedStyle(r),
    l = s.transform === "none" ? "" : s.transform,
    [c, p] = s.transformOrigin.split(" ").map(parseFloat);
  ((c /= r.clientWidth), (p /= r.clientHeight));
  var d = jh(r),
    v = r.clientWidth / e.width / d,
    u = r.clientHeight / e.height / d,
    f = t.left + t.width * c,
    h = t.top + t.height * p,
    b = e.left + e.width * c,
    g = e.top + e.height * p,
    _ = (f - b) * v,
    y = (h - g) * u,
    k = t.width / e.width,
    P = t.height / e.height;
  return {
    delay: i,
    duration: typeof a == "function" ? a(Math.sqrt(_ * _ + y * y)) : a,
    easing: o,
    css: (D, T) => {
      var S = T * _,
        O = T * y,
        V = D + T * k,
        at = D + T * P;
      return `transform: ${l} translate(${S}px, ${O}px) scale(${V}, ${at});`;
    },
  };
}
function jh(r) {
  if ("currentCSSZoom" in r) return r.currentCSSZoom;
  for (var t = r, e = 1; t !== null; ) ((e *= +getComputedStyle(t).zoom), (t = t.parentElement));
  return e;
}
var Oh = Rt(
    '<div class="wa-muted svelte-1yd9ia5" style="margin: 4rem auto 0; font-size: 18px; width: fit-content;">No projects found.</div>',
  ),
  Bh = Rt(
    '<div style="margin:20px 0;" class="svelte-1yd9ia5"><label for="wa-project-select" class="svelte-1yd9ia5">Select project</label> <div class="project-select-row svelte-1yd9ia5"><!></div></div>',
  ),
  Ih = Rt(
    '<div class="create-inline wa-row svelte-1yd9ia5"><input class="wa-create-draft-input svelte-1yd9ia5" type="text" placeholder="Draft name"/> <!> <!></div>',
  ),
  Rh = Rt('<div class="svelte-1yd9ia5">No drafts found.</div>'),
  zh = Rt('<span class="wa-draft-active-indicator svelte-1yd9ia5" title="Active draft">●</span>'),
  Lh = Rt(
    '<div><div class="wa-draft-name wa-row svelte-1yd9ia5"><!> </div> <div class="wa-draft-actions svelte-1yd9ia5"><!> <!> <!> <!> <!></div></div>',
  ),
  Mh = Rt('<div class="wa-draft-list svelte-1yd9ia5"></div>'),
  Wh = Rt(
    '<div class="draft-controls svelte-1yd9ia5" style="margin-top:16px;"><div class="wa-panel-header svelte-1yd9ia5"><div class="wa-row justify-between svelte-1yd9ia5"><div class="wa-button-group svelte-1yd9ia5"><div class="wa-title svelte-1yd9ia5">Drafts</div> <!></div> <div class="wa-button-group svelte-1yd9ia5"><!> <!></div></div></div> <!> <!> <!></div>',
  ),
  Uh = Rt(
    '<div class="create-inline wa-row svelte-1yd9ia5"><input class="wa-create-draft-input svelte-1yd9ia5" type="text" placeholder="Chapter name"/> <!> <!></div>',
  ),
  Vh = Rt('<div class="svelte-1yd9ia5">Loading chapters...</div>'),
  Hh = Rt('<div style="margin-top: 1em;" class="svelte-1yd9ia5">No chapters found.</div>'),
  Zh = Rt(
    '<div class="wa-draft-item svelte-1yd9ia5"><div class="wa-draft-name svelte-1yd9ia5"> </div> <div class="wa-draft-actions svelte-1yd9ia5"><!> <!> <!> <!> <!></div></div>',
  ),
  qh = Rt('<div class="wa-draft-list svelte-1yd9ia5"></div>'),
  Gh = Rt(
    '<div class="chapter-controls svelte-1yd9ia5" style="margin-top:18px;"><div class="wa-panel-header svelte-1yd9ia5"><div class="wa-row justify-between svelte-1yd9ia5"><div class="wa-title svelte-1yd9ia5">Chapters</div> <div class="wa-button-group svelte-1yd9ia5"><!></div></div></div> <!> <!></div>',
  ),
  Yh = Rt(
    '<div class="project-list wa-panel svelte-1yd9ia5"><div class="wa-row justify-between svelte-1yd9ia5"><div class="wa-title svelte-1yd9ia5"> </div> <div class="svelte-1yd9ia5"><!></div></div> <div class="wa-row svelte-1yd9ia5" style="margin: 18px 0 10px 0;"><!></div> <!> <!> <!> <!></div>',
  );
const Kh = {
  hash: "svelte-1yd9ia5",
  code: `.project-list.svelte-1yd9ia5 {padding:8px;}.project-select-row.svelte-1yd9ia5 {display:flex;gap:8px;align-items:center;}.create-inline.svelte-1yd9ia5 {margin-top:8px;justify-content:center;}.wa-panel.svelte-1yd9ia5 {padding:8px;height:100%;border-radius:0;}.wa-panel-header.svelte-1yd9ia5 {display:flex;flex-direction:column;}.wa-draft-item.active.svelte-1yd9ia5 .wa-draft-name:where(.svelte-1yd9ia5) {font-weight:bold;color:var(--color-accent, #3b82f6);}.wa-draft-active-indicator.svelte-1yd9ia5 {color:var(--color-accent, #3b82f6);font-size:1em;vertical-align:middle;}
  @keyframes svelte-1yd9ia5-spin {
    100% {
      transform: rotate(360deg);
    }
  }`,
};
function xi(r, t) {
  var W;
  (Be(t, !1), pi(r, Kh));
  let e = lt(t, "projectFileService", 12),
    n = lt(t, "projectService", 12),
    i = lt(t, "manager", 12),
    a = lt(t, "activeProject", 12, null),
    o = Ft([]),
    s = Ft(void 0),
    l = Ft(null),
    c = Ft([]),
    p = Ft(!1),
    d = Ft([]),
    v = !1,
    u = Ft(!1),
    f = Ft(!1),
    h = Ft(""),
    b = "",
    g = Ft(!0),
    _ = Ft(((W = i()) == null ? void 0 : W.activeDraft) ?? null),
    y = null;
  const k = 20;
  let P = Ft([]),
    D = Ft(!1),
    T = Ft(!1),
    S = Ft(""),
    O = Ft(""),
    V = Ft(!1);
  async function at(F = !1) {
    Q(p, !0);
    const z = new Promise(($t) => setTimeout($t, 400)),
      M = [...A(o)],
      G = a();
    let it = [],
      ht = [];
    try {
      ((it = n().listAllFolders()), (ht = []));
      for (const $t of it) (await n().isProjectFolder($t)) && ht.push($t);
    } catch {
      ht = [];
    }
    const vt = ht.filter(($t) => !M.includes($t)),
      Bt = M.filter(($t) => !ht.includes($t));
    if (
      (F &&
        vt.length > 0 &&
        new j.Notice(`${vt.length} new project${vt.length > 1 ? "s" : ""} discovered.`),
      F &&
        Bt.length > 0 &&
        new j.Notice(`${Bt.length} project${Bt.length > 1 ? "s" : ""} removed.`),
      Q(o, ht),
      Q(
        d,
        ht.map(($t) => ({ value: $t, label: $t })),
      ),
      ht.length === 0)
    )
      (a(null), Q(s, void 0), Q(l, null));
    else if (ht.length === 1) {
      (a(ht[0]), Q(s, A(d)[0]), Q(l, ht[0]));
      try {
        Z(`${H} panel refresh selected single project '${A(l)}'`);
      } catch {}
    } else if (G && !ht.includes(G)) {
      (a(ht[0]), Q(s, A(d)[0]), Q(l, ht[0]));
      try {
        Z(`${H} panel refresh selected fallback project '${A(l)}'`);
      } catch {}
    } else {
      const $t = A(d).find((Jt) => Jt.value === G);
      if ($t) {
        (a(G), Q(s, $t), Q(l, $t.value));
        try {
          Z(`${H} panel refresh kept project '${A(l)}'`);
        } catch {}
      } else (a(null), Q(s, void 0), Q(l, null));
    }
    return (await z, Q(p, !1), A(l) && (await E()), ht);
  }
  async function E() {
    Q(u, !0);
    const F = new Promise((z) => setTimeout(z, 400));
    try {
      if (!A(l)) {
        Q(c, []);
        return;
      }
      (Q(c, e().drafts.listDrafts(A(l)) || []),
        Q(c, Array.from(A(c))),
        A(c).sort((z, M) => (z > M ? 1 : z < M ? -1 : 0)),
        A(g) || A(c).reverse());
    } catch {
      Q(c, []);
    } finally {
      (await F, Q(u, !1));
    }
  }
  async function B() {
    var z;
    Q(D, !0);
    const F = new Promise((M) => setTimeout(M, 400));
    try {
      if (!A(l)) {
        (Q(P, []), Q(V, !1));
        return;
      }
      const M = `${A(l)}/meta.md`,
        G = await An(i().app, M);
      if ((Q(V, (G == null ? void 0 : G.project_type) === "multi-file"), !A(V))) {
        Q(P, []);
        return;
      }
      if (!((z = i()) != null && z.activeDraft)) {
        Q(P, []);
        return;
      }
      let it = [];
      ((it = await e().chapters.listChapters(A(l), i().activeDraft)),
        Q(P, Array.isArray(it) ? it : []));
    } catch {
      (Q(P, []), Q(V, !1));
    } finally {
      (await F, Q(D, !1));
    }
  }
  async function w() {
    if (!(!A(l) || !A(h).trim())) {
      try {
        await e().drafts.createDraft(A(h).trim(), b || void 0, A(l));
      } catch {}
      (Q(h, ""), Q(f, !1), await E());
    }
  }
  async function U() {
    Q(f, !0);
  }
  async function ft(F) {
    var M;
    if (!A(l)) return;
    let z = !1;
    ((z = await e().drafts.openDraft(A(l), F)),
      z || ((M = i()) != null && M.setActiveDraft && (await i().setActiveDraft(F, A(l)))),
      await E(),
      await B());
  }
  async function J(F) {
    if (!A(l)) return;
    const z = `${F} Copy`;
    new hd(i().app, {
      sourceDraftName: F,
      suggestedName: z,
      onSubmit: async (M) => {
        try {
          (await i().createNewDraft(M, F, A(l) || void 0),
            await E(),
            new j.Notice(`Draft '${M}' created as duplicate of '${F}'.`));
        } catch (G) {
          (Z(`${H} Failed to duplicate draft:`, G), new j.Notice("Failed to duplicate draft."));
        }
      },
    }).open();
  }
  async function rt(F) {
    const z = window != null && window.prompt ? window.prompt(`Rename draft '${F}' to:`, F) : null;
    if (!(!z || !A(l)))
      try {
        (await i().renameDraft(F, z, A(l), !1), await E());
      } catch {}
  }
  async function Y(F) {
    if (!A(l)) return;
    new No(
      i().app,
      F,
      async () => {
        (await i().deleteDraft(F, A(l) || void 0), await E());
      },
      "draft",
    ).open();
  }
  async function dt(F) {
    var z, M;
    F &&
      ((z = i()) != null && z.setActiveProject && (await i().setActiveProject(F)),
      a(F),
      Q(l, F),
      Q(_, ((M = i()) == null ? void 0 : M.activeDraft) ?? null),
      await E(),
      await B());
  }
  async function R(F) {
    var z;
    if (!(!F || !i()))
      try {
        (i().activeProject !== F &&
          typeof i().setActiveProject == "function" &&
          (await i().setActiveProject(F)),
          a(F),
          Q(l, F),
          Q(_, ((z = i()) == null ? void 0 : z.activeDraft) ?? null),
          await E(),
          await B());
      } catch {}
  }
  async function I(F) {
    var z, M;
    A(l) &&
      ((z = i()) != null && z.setActiveDraft && (await i().setActiveDraft(F, A(l))),
      Q(_, ((M = i()) == null ? void 0 : M.activeDraft) ?? null),
      await E(),
      await B());
  }
  let ut = null;
  (qs(async () => {
    (await at(!1),
      A(l) && (await dt(A(l))),
      setTimeout(async () => {
        try {
          A(l) && i() && i().activeProject !== A(l) && (await R(A(l)));
        } catch {}
      }, 200));
    try {
      i() &&
        typeof i().addActiveDraftListener == "function" &&
        ((ut = (F) => {
          (Q(_, F), E().catch(() => {}), B().catch(() => {}));
        }),
        i().addActiveDraftListener(ut),
        Q(_, i().activeDraft ?? null));
    } catch {}
    try {
      i() &&
        typeof i().addActiveProjectListener == "function" &&
        ((y = (F) => {
          (a(F),
            Q(l, F),
            at().catch(() => {}),
            E().catch(() => {}),
            Q(s, A(d).find((z) => z.value === F) || void 0));
        }),
        i().addActiveProjectListener(y),
        a(i().activeProject ?? null),
        Q(l, a()),
        E().catch(() => {}),
        Q(s, A(d).find((F) => F.value === a()) || void 0),
        B().catch(() => {}));
    } catch {}
  }),
    Gs(() => {
      try {
        i() &&
          typeof i().removeActiveDraftListener == "function" &&
          ut &&
          i().removeActiveDraftListener(ut);
      } catch {}
      try {
        i() &&
          typeof i().removeActiveProjectListener == "function" &&
          y &&
          i().removeActiveProjectListener(y);
      } catch {}
    }));
  var st = {
    get projectFileService() {
      return e();
    },
    set projectFileService(F) {
      (e(F), ot());
    },
    get projectService() {
      return n();
    },
    set projectService(F) {
      (n(F), ot());
    },
    get manager() {
      return i();
    },
    set manager(F) {
      (i(F), ot());
    },
    get activeProject() {
      return a();
    },
    set activeProject(F) {
      (a(F), ot());
    },
  };
  Xl();
  var et = Yh(),
    zt = _t(et),
    te = _t(zt),
    xt = _t(te);
  gt(te);
  var At = wt(te, 2),
    Xt = _t(At);
  (Ze(Xt, {
    ariaLabel: "Refresh projects",
    onclick: () => at(!0),
    title: void 0,
    get spinning() {
      return A(p);
    },
    children: (F, z) => {
      Ps(F, {});
    },
    $$slots: { default: !0 },
  }),
    gt(At),
    gt(zt));
  var Tt = wt(zt, 2),
    pt = _t(Tt);
  (ur(pt, {
    onclick: async () => {
      const F = i().app,
        { CreateProjectModal: z } = await Promise.resolve().then(() => rp);
      let M = null;
      new z(F, async (it, ht, vt) => {
        if (!it || ((M = await n().createProject(it, ht, vt, void 0, i().settings)), !M)) return;
        let Bt = [],
          $t = null;
        for (let Jt = 0; Jt < 20; Jt++) {
          (await new Promise((St) => setTimeout(St, 100)), (Bt = await at()));
          const Ee = Bt.find((St) => St === M);
          if ((($t = typeof Ee == "string" ? Ee : null), $t)) break;
        }
        typeof $t == "string" &&
          $t &&
          (a($t),
          Q(s, { value: $t, label: $t }),
          Q(l, $t),
          i().setActiveDraft
            ? await i().setActiveDraft($t, vt)
            : i((i().activeDraft = vt ?? null), !0),
          await E(),
          await B());
      }).open();
    },
    variant: "primary",
    style: "width: 40%; margin: 0 auto;",
    children: (F, z) => {
      Gr();
      var M = dr("New Project");
      ct(F, M);
    },
    $$slots: { default: !0 },
  }),
    gt(Tt));
  var ve = wt(Tt, 2);
  {
    var m = (F) => {
      var z = Oh();
      ct(F, z);
    };
    Ut(ve, (F) => {
      (A(o), Vt(() => A(o).length === 0) && F(m));
    });
  }
  var q = wt(ve, 2);
  {
    var L = (F) => {
      var z = Bh(),
        M = wt(_t(z), 2),
        G = _t(M);
      (vc(G, {
        name: "wa-project-select",
        class: "wa-select",
        get items() {
          return A(d);
        },
        showChevron: !0,
        disabled: v,
        clearable: !1,
        searchable: !1,
        placeholder: "Choose a project...",
        containerStyles:
          "background: var(--select-bg); color: var(--select-text); border: 1px solid var(--select-border); border-radius: none; min-height: 38px; box-shadow: none; font-size: 1em; transition: border 0.2s;",
        get value() {
          return A(s);
        },
        set value(it) {
          Q(s, it);
        },
        $$events: {
          select: (it) => {
            const ht = it.detail;
            (Q(s, ht),
              Q(l, typeof ht == "string" ? ht : ht ? ht.value : void 0),
              a(A(l) ?? null),
              dt(A(l) ?? null));
          },
        },
        $$legacy: !0,
      }),
        gt(M),
        gt(z),
        ct(F, z));
    };
    Ut(q, (F) => {
      (A(o), Vt(() => A(o).length > 0) && F(L));
    });
  }
  var C = wt(q, 2);
  {
    var x = (F) => {
      var z = Wh(),
        M = _t(z),
        G = _t(M),
        it = _t(G),
        ht = wt(_t(it), 2);
      (Ze(ht, {
        ariaLabel: "Toggle draft sort order",
        title: void 0,
        onclick: () => {
          (Q(g, !A(g)), E());
        },
        children: (Ht, Nt) => {
          var Zt = ie(),
            qt = ee(Zt);
          {
            var re = (Wt) => {
                Cs(Wt, {});
              },
              Dt = (Wt) => {
                Ss(Wt, {});
              };
            Ut(qt, (Wt) => {
              A(g) ? Wt(re) : Wt(Dt, !1);
            });
          }
          ct(Ht, Zt);
        },
        $$slots: { default: !0 },
      }),
        gt(it));
      var vt = wt(it, 2),
        Bt = _t(vt);
      ur(Bt, {
        onclick: U,
        variant: "primary",
        children: (Ht, Nt) => {
          Gr();
          var Zt = dr("New Draft");
          ct(Ht, Zt);
        },
        $$slots: { default: !0 },
      });
      var $t = wt(Bt, 2);
      (Ze($t, {
        ariaLabel: "Refresh drafts",
        title: void 0,
        onclick: E,
        get disabled() {
          return A(u);
        },
        get spinning() {
          return A(u);
        },
        children: (Ht, Nt) => {
          Ps(Ht, {});
        },
        $$slots: { default: !0 },
      }),
        gt(vt),
        gt(G),
        gt(M));
      var Jt = wt(M, 2);
      {
        var Ee = (Ht) => {
          var Nt = Ih(),
            Zt = _t(Nt);
          fa(Zt);
          var qt = wt(Zt, 2);
          ur(qt, {
            onclick: w,
            variant: "primary",
            children: (Dt, Wt) => {
              Gr();
              var tr = dr("Create");
              ct(Dt, tr);
            },
            $$slots: { default: !0 },
          });
          var re = wt(qt, 2);
          (ur(re, {
            onclick: () => {
              (Q(f, !1), Q(h, ""));
            },
            children: (Dt, Wt) => {
              Gr();
              var tr = dr("Cancel");
              ct(Dt, tr);
            },
            $$slots: { default: !0 },
          }),
            gt(Nt),
            me(() => ks(Zt, A(h))),
            se("input", Zt, (Dt) => {
              const Wt = Dt.target;
              Wt && Q(h, Wt.value);
            }),
            ct(Ht, Nt));
        };
        Ut(Jt, (Ht) => {
          A(f) && Ht(Ee);
        });
      }
      var St = wt(Jt, 2);
      {
        var le = (Ht) => {
          var Nt = Rh();
          ct(Ht, Nt);
        };
        Ut(St, (Ht) => {
          (A(c), Vt(() => A(c).length === 0) && Ht(le));
        });
      }
      var _e = wt(St, 2);
      {
        var ce = (Ht) => {
          var Nt = Mh();
          (Ai(
            Nt,
            5,
            () => A(c),
            ua,
            (Zt, qt) => {
              var re = Lh(),
                Dt = _t(re),
                Wt = _t(Dt);
              {
                var tr = (yt) => {
                  var ae = zh();
                  ct(yt, ae);
                };
                Ut(Wt, (yt) => {
                  A(_) === A(qt) && yt(tr);
                });
              }
              var cn = wt(Wt);
              gt(Dt);
              var Wr = wt(Dt, 2),
                Pr = _t(Wr);
              Ze(Pr, {
                ariaLabel: "Open draft",
                title: void 0,
                onclick: () => ft(A(qt)),
                children: (yt, ae) => {
                  $s(yt, { size: k });
                },
                $$slots: { default: !0 },
              });
              var Ur = wt(Pr, 2);
              {
                var Bn = (yt) => {
                  Ze(yt, {
                    ariaLabel: "Set active draft",
                    title: void 0,
                    onclick: () => I(A(qt)),
                    children: (ae, Vr) => {
                      Ql(ae, { size: k });
                    },
                    $$slots: { default: !0 },
                  });
                };
                Ut(Ur, (yt) => {
                  A(_) !== A(qt) && yt(Bn);
                });
              }
              var Ar = wt(Ur, 2);
              Ze(Ar, {
                ariaLabel: "Rename draft",
                title: void 0,
                onclick: () => rt(A(qt)),
                children: (yt, ae) => {
                  Es(yt, { size: k });
                },
                $$slots: { default: !0 },
              });
              var In = wt(Ar, 2);
              Ze(In, {
                ariaLabel: "Duplicate draft",
                title: void 0,
                onclick: () => J(A(qt)),
                children: (yt, ae) => {
                  tc(yt, { size: k });
                },
                $$slots: { default: !0 },
              });
              var Gt = wt(In, 2);
              (Ze(Gt, {
                ariaLabel: "Delete draft",
                title: void 0,
                onclick: () => Y(A(qt)),
                children: (yt, ae) => {
                  As(yt, { size: k });
                },
                $$slots: { default: !0 },
              }),
                gt(Wr),
                gt(re),
                me(() => {
                  (gr(re, 1, `wa-draft-item ${A(_) === A(qt) ? "active" : ""}`, "svelte-1yd9ia5"),
                    Yr(cn, ` ${A(qt) ?? ""}`));
                }),
                ct(Zt, re));
            },
          ),
            gt(Nt),
            ct(Ht, Nt));
        };
        Ut(_e, (Ht) => {
          (A(c), Vt(() => A(c).length > 0) && Ht(ce));
        });
      }
      (gt(z), ct(F, z));
    };
    Ut(C, (F) => {
      A(l) && F(x);
    });
  }
  var N = wt(C, 2);
  {
    var K = (F) => {
      var z = Gh(),
        M = _t(z),
        G = _t(M),
        it = wt(_t(G), 2),
        ht = _t(it);
      (ur(ht, {
        onclick: () => Q(T, !A(T)),
        variant: "primary",
        children: (St, le) => {
          Gr();
          var _e = dr("New Chapter");
          ct(St, _e);
        },
        $$slots: { default: !0 },
      }),
        gt(it),
        gt(G),
        gt(M));
      var vt = wt(M, 2);
      {
        var Bt = (St) => {
          var le = Uh(),
            _e = _t(le);
          fa(_e);
          var ce = wt(_e, 2);
          ur(ce, {
            onclick: async () => {
              var Nt;
              !A(l) ||
                !((Nt = i()) != null && Nt.activeDraft) ||
                !A(S).trim() ||
                (await i().createChapter(A(l), i().activeDraft, A(S).trim()),
                Q(S, ""),
                Q(O, ""),
                Q(T, !1),
                await B());
            },
            variant: "primary",
            children: (Nt, Zt) => {
              Gr();
              var qt = dr("Create");
              ct(Nt, qt);
            },
            $$slots: { default: !0 },
          });
          var Ht = wt(ce, 2);
          (ur(Ht, {
            onclick: () => {
              (Q(T, !1), Q(S, ""), Q(O, ""));
            },
            children: (Nt, Zt) => {
              Gr();
              var qt = dr("Cancel");
              ct(Nt, qt);
            },
            $$slots: { default: !0 },
          }),
            gt(le),
            me(() => ks(_e, A(S))),
            se("input", _e, (Nt) => {
              const Zt = Nt.target;
              Zt && Q(S, Zt.value);
            }),
            ct(St, le));
        };
        Ut(vt, (St) => {
          A(T) && St(Bt);
        });
      }
      var $t = wt(vt, 2);
      {
        var Jt = (St) => {
            var le = Vh();
            ct(St, le);
          },
          Ee = (St) => {
            var le = ie(),
              _e = ee(le);
            {
              var ce = (Nt) => {
                  var Zt = Hh();
                  ct(Nt, Zt);
                },
                Ht = (Nt) => {
                  var Zt = qh();
                  (Ai(
                    Zt,
                    15,
                    () => A(P),
                    (qt) => qt.chapterName,
                    (qt, re, Dt) => {
                      var Wt = Zh(),
                        tr = _t(Wt),
                        cn = _t(tr, !0);
                      gt(tr);
                      var Wr = wt(tr, 2),
                        Pr = _t(Wr);
                      {
                        let Gt = Ei(() => A(Dt) === 0);
                        ur(Pr, {
                          title: "Move chapter up",
                          onclick: async () => {
                            if (A(Dt) === 0) return;
                            const yt = A(P).slice();
                            [yt[A(Dt) - 1], yt[A(Dt)]] = [yt[A(Dt)], yt[A(Dt) - 1]];
                            const ae = yt.map((Vr, mi) => ({
                              chapterName: Vr.chapterName,
                              order: mi + 1,
                            }));
                            (await i().reorderChapters(A(l), i().activeDraft, ae), await B());
                          },
                          get disabled() {
                            return A(Gt);
                          },
                          children: (yt, ae) => {
                            Cs(yt, {});
                          },
                          $$slots: { default: !0 },
                        });
                      }
                      var Ur = wt(Pr, 2);
                      {
                        let Gt = Ei(() => (nt(A(Dt)), A(P), Vt(() => A(Dt) === A(P).length - 1)));
                        ur(Ur, {
                          title: "Move chapter down",
                          onclick: async () => {
                            if (A(Dt) === A(P).length - 1) return;
                            const yt = A(P).slice();
                            [yt[A(Dt)], yt[A(Dt) + 1]] = [yt[A(Dt) + 1], yt[A(Dt)]];
                            const ae = yt.map((Vr, mi) => ({
                              chapterName: Vr.chapterName,
                              order: mi + 1,
                            }));
                            (await i().reorderChapters(A(l), i().activeDraft, ae), await B());
                          },
                          get disabled() {
                            return A(Gt);
                          },
                          children: (yt, ae) => {
                            Ss(yt, {});
                          },
                          $$slots: { default: !0 },
                        });
                      }
                      var Bn = wt(Ur, 2);
                      Ze(Bn, {
                        ariaLabel: "Open chapter",
                        title: "Open chapter",
                        onclick: async () => {
                          var Gt;
                          !A(l) ||
                            !((Gt = i()) != null && Gt.activeDraft) ||
                            (await i().openChapter(A(l), i().activeDraft, A(re).chapterName));
                        },
                        children: (Gt, yt) => {
                          $s(Gt, { size: k });
                        },
                        $$slots: { default: !0 },
                      });
                      var Ar = wt(Bn, 2);
                      Ze(Ar, {
                        ariaLabel: "Rename chapter",
                        title: "Rename chapter",
                        onclick: () => {
                          var yt;
                          if (!A(l) || !((yt = i()) != null && yt.activeDraft)) return;
                          new pd(i().app, A(re).chapterName, async (ae) => {
                            (await i().renameChapter(A(l), i().activeDraft, A(re).chapterName, ae),
                              await B());
                          }).open();
                        },
                        children: (Gt, yt) => {
                          Es(Gt, { size: k });
                        },
                        $$slots: { default: !0 },
                      });
                      var In = wt(Ar, 2);
                      (Ze(In, {
                        ariaLabel: "Delete chapter",
                        title: "Delete chapter",
                        onclick: async () => {
                          var yt;
                          if (!A(l) || !((yt = i()) != null && yt.activeDraft)) return;
                          new No(
                            i().app,
                            A(re).chapterName,
                            async () => {
                              (await i().deleteChapter(A(l), i().activeDraft, A(re).chapterName),
                                await B());
                            },
                            "chapter",
                          ).open();
                        },
                        children: (Gt, yt) => {
                          As(Gt, { size: k });
                        },
                        $$slots: { default: !0 },
                      }),
                        gt(Wr),
                        gt(Wt),
                        me(() => Yr(cn, (A(re), Vt(() => A(re).chapterName)))),
                        rd(
                          Wt,
                          () => Nh,
                          () => ({ duration: 500, easing: mc }),
                        ),
                        ct(qt, Wt));
                    },
                  ),
                    gt(Zt),
                    ct(Nt, Zt));
                };
              Ut(
                _e,
                (Nt) => {
                  (A(P), Vt(() => A(P).length === 0) ? Nt(ce) : Nt(Ht, !1));
                },
                !0,
              );
            }
            ct(St, le);
          };
        Ut($t, (St) => {
          A(D) ? St(Jt) : St(Ee, !1);
        });
      }
      (gt(z), ct(F, z));
    };
    Ut(N, (F) => {
      (A(l),
        nt(i()),
        A(V),
        Vt(() => {
          var z;
          return A(l) && ((z = i()) == null ? void 0 : z.activeDraft) && A(V);
        }) && F(K));
    });
  }
  return (gt(et), me(() => Yr(xt, `${Kt} Projects`)), ct(r, et), Ie(st));
}
$e(xi, { projectFileService: {}, projectService: {}, manager: {}, activeProject: {} }, [], [], !0);
const Kr = "writeaid-project-panel";
class Xh extends j.ItemView {
  constructor(t, e) {
    (super(t),
      (this.containerElInner = null),
      (this.selectedProject = null),
      (this.svelteComponent = null),
      (this.app = e),
      (this.projectService = new ia(e)),
      (this.projectFileService = new Os(e, this.projectService)));
  }
  getViewType() {
    return Kr;
  }
  getDisplayText() {
    return `${Kt} Projects`;
  }
  getIcon() {
    return Ko;
  }
  async onOpen() {
    var t, e, n, i, a, o, s, l;
    this.containerElInner = this.containerEl.createDiv({ cls: "writeaid-project-panel" });
    try {
      const c = (xi == null ? void 0 : xi.default) ?? xi;
      if (!c) {
        new j.Notice(`${Kt}: failed to load project panel component.`);
        return;
      }
      const p =
        (n =
          (e = (t = this.app.plugins).getPlugin) == null
            ? void 0
            : e.call(t, "obsidian-writeaid-plugin")) == null
          ? void 0
          : n.manager;
      if (!p) {
        new j.Notice(`${Kt}: manager not available, cannot mount project panel.`);
        return;
      }
      const d = {
        app: this.app,
        manager: p,
        projectService: this.projectService,
        projectFileService: this.projectFileService,
      };
      let v = !1;
      if (typeof c == "function" && c.prototype instanceof HTMLElement)
        try {
          const f = new c();
          (Lt(() => {
            f.projectService = this.projectService;
          }),
            Lt(() => {
              var h, b, g;
              f.manager =
                (g =
                  (b = (h = this.app.plugins).getPlugin) == null
                    ? void 0
                    : b.call(h, "obsidian-writeaid-plugin")) == null
                  ? void 0
                  : g.manager;
            }),
            Lt(() => {
              f.draftService = this.projectFileService.drafts;
            }),
            Lt(() => {
              var h, b, g, _;
              f.activeProject =
                ((_ =
                  (g =
                    (b = (h = this.app.plugins).getPlugin) == null
                      ? void 0
                      : b.call(h, "obsidian-writeaid-plugin")) == null
                    ? void 0
                    : g.manager) == null
                  ? void 0
                  : _.activeProject) ?? null;
            }),
            (this.svelteComponent = f),
            (v = !0));
        } catch (f) {
          Z(`${H} creating custom element instance failed:`, f);
        }
      if (!v && typeof customElements < "u")
        try {
          const f = "wa-project-panel";
          if (customElements.get(f)) {
            const h = document.createElement(f);
            (Lt(() => {
              h.projectService = this.projectService;
            }),
              Lt(() => {
                var b, g, _;
                h.manager =
                  (_ =
                    (g = (b = this.app.plugins).getPlugin) == null
                      ? void 0
                      : g.call(b, "obsidian-writeaid-plugin")) == null
                    ? void 0
                    : _.manager;
              }),
              Lt(() => {
                h.draftService = this.projectFileService.drafts;
              }),
              Lt(() => {
                var b, g, _, y;
                h.activeProject =
                  ((y =
                    (_ =
                      (g = (b = this.app.plugins).getPlugin) == null
                        ? void 0
                        : g.call(b, "obsidian-writeaid-plugin")) == null
                      ? void 0
                      : _.manager) == null
                    ? void 0
                    : y.activeProject) ?? null;
              }),
              (this.svelteComponent = h),
              (v = !0));
          }
        } catch (f) {
          Z(`${H} attempting to create by tag failed:`, f);
        }
      if (!v)
        try {
          ((this.svelteComponent = Zs(c, { target: this.containerElInner, props: d })), (v = !0));
        } catch (f) {
          Z(`${H} svelte.mount failed; trying constructor:`, f);
          try {
            ((this.svelteComponent = new c({ target: this.containerElInner, props: d })), (v = !0));
          } catch (h) {
            (Z(`${H} Failed to mount ProjectPanel (mount + constructor failed)`, h),
              Lt(() => {
                Z(`${H} Component snapshot:`, c);
              }),
              new j.Notice(`${Kt}: error mounting project panel component. See console.`));
            return;
          }
        }
      this.svelteComponent &&
        (typeof this.svelteComponent.destroy == "function" &&
          (this.svelteComponent.$destroy =
            (i = this.svelteComponent.destroy) == null ? void 0 : i.bind(this.svelteComponent)),
        typeof this.svelteComponent.set == "function" &&
          (this.svelteComponent.$set =
            (a = this.svelteComponent.set) == null ? void 0 : a.bind(this.svelteComponent)));
      try {
        const f =
            (s = (o = this.app.plugins) == null ? void 0 : o.getPlugin) == null
              ? void 0
              : s.call(o, "obsidian-writeaid-plugin"),
          h = ((l = f == null ? void 0 : f.manager) == null ? void 0 : l.activeProject) ?? null;
        h !== null &&
          this.svelteComponent &&
          (typeof this.svelteComponent.$set == "function"
            ? Lt(() => {
                this.svelteComponent.$set({ activeProject: h });
              })
            : this.svelteComponent instanceof HTMLElement
              ? Lt(() => {
                  this.svelteComponent.activeProject = h;
                })
              : typeof this.svelteComponent.set == "function" &&
                Lt(() => {
                  this.svelteComponent.set({ activeProject: h });
                }),
          typeof this.svelteComponent.setActiveProject == "function" &&
            Lt(() => {
              this.svelteComponent.setActiveProject(h);
            }));
      } catch {}
      (Lt(() => {
        this.svelteComponent &&
          typeof this.svelteComponent.refreshPanel == "function" &&
          this.svelteComponent.refreshPanel();
      }),
        setTimeout(() => {
          Lt(() => {
            var b, g, _;
            const f =
                (g = (b = this.app.plugins) == null ? void 0 : b.getPlugin) == null
                  ? void 0
                  : g.call(b, "obsidian-writeaid-plugin"),
              h = ((_ = f == null ? void 0 : f.manager) == null ? void 0 : _.activeProject) ?? null;
            h &&
              this.svelteComponent &&
              (typeof this.svelteComponent.$set == "function"
                ? this.svelteComponent.$set({ activeProject: h })
                : this.svelteComponent instanceof HTMLElement
                  ? (this.svelteComponent.activeProject = h)
                  : typeof this.svelteComponent.set == "function" &&
                    this.svelteComponent.set({ activeProject: h }),
              typeof this.svelteComponent.setActiveProject == "function" &&
                this.svelteComponent.setActiveProject(h));
          });
        }, 0),
        Lt(() => {
          var h, b;
          const f =
            (b = (h = this.app.plugins) == null ? void 0 : h.getPlugin) == null
              ? void 0
              : b.call(h, "obsidian-writeaid-plugin");
          f &&
            f.manager &&
            typeof f.manager.addActiveProjectListener == "function" &&
            f.manager.addActiveProjectListener(this.onActiveProjectChanged.bind(this));
        }));
    } catch {}
  }
  onActiveProjectChanged() {}
}
function Jh(r, t) {
  return () => {
    const e = { type: Kr, active: !0 },
      n = t.workspace.getLeavesOfType(Kr);
    if (n.length > 0) {
      const i = n[0];
      t.workspace.revealLeaf(i);
    } else {
      let i = t.workspace.getRightLeaf(!1);
      (i || (i = t.workspace.getRightLeaf(!0)), i.setViewState(e), t.workspace.revealLeaf(i));
    }
  };
}
function Qh(r) {
  return () => r.updateProjectMetadataPrompt();
}
class tp extends j.Modal {
  constructor(t, e, n, i) {
    (super(t), (this.path = e), (this.onCreateAnyway = n), (this.onOpenExisting = i));
  }
  onOpen() {
    const { contentEl: t } = this;
    (t.createEl("h2", { text: "Project already exists" }),
      t.createEl("p", { text: `A folder named '${this.path}' already exists in the vault.` }),
      new j.Setting(t).addButton((e) =>
        e.setButtonText("Open Existing").onClick(() => {
          (this.close(), this.onOpenExisting());
        }),
      ),
      new j.Setting(t).addButton((e) =>
        e
          .setButtonText("Create Anyway")
          .setCta()
          .onClick(() => {
            (this.close(), this.onCreateAnyway(!0));
          }),
      ),
      new j.Setting(t).addButton((e) =>
        e.setButtonText("Cancel").onClick(() => {
          this.close();
        }),
      ));
  }
  onClose() {
    this.contentEl.empty();
  }
}
class ep extends j.Modal {
  constructor(t, e) {
    (super(t), (this.props = e));
  }
  onOpen() {
    const { contentEl: t } = this;
    t.createEl("h2", { text: "Create New Draft" });
    const e = this.props.suggestedName;
    let n = "",
      i = "";
    new j.Setting(t)
      .setName("Draft name")
      .addText((o) => o.setPlaceholder(e).onChange((s) => (n = s)));
    const a = this.props.drafts;
    (a.length > 0 &&
      new j.Setting(t).setName("Copy from existing draft").addDropdown((o) => {
        o.addOption("", "Start blank");
        for (const s of a) o.addOption(s, s);
        o.onChange((s) => (i = s));
      }),
      new j.Setting(t).addButton((o) =>
        o
          .setButtonText("Create")
          .setCta()
          .onClick(() => {
            this.close();
            const s = n && n.trim() ? n.trim() : e;
            this.props.onSubmit(s, i || void 0);
          }),
      ));
  }
  onClose() {
    this.contentEl.empty();
  }
}
class gc extends j.Modal {
  constructor(t, e) {
    (super(t), (this.onSubmit = e));
  }
  onOpen() {
    const { contentEl: t } = this;
    t.createEl("h2", { text: "Create New Project" });
    let e = "",
      n = !0,
      i = "Draft 1";
    (new j.Setting(t).setName("Project folder name").addText((a) => a.onChange((o) => (e = o))),
      new j.Setting(t).setName("Project type").addDropdown((a) => {
        (a.addOption("single", "Single-file project"),
          a.addOption("multi", "Multi-file project (chapters)"),
          a.onChange((o) => (n = o === "single")));
      }),
      new j.Setting(t)
        .setName("Initial draft name (optional)")
        .addText((a) => a.setPlaceholder("Draft 1").onChange((o) => (i = o || "Draft 1"))),
      new j.Setting(t).addButton((a) =>
        a
          .setButtonText("Create Project")
          .setCta()
          .onClick(() => {
            (this.close(), this.onSubmit(e, n, i || void 0));
          }),
      ));
  }
  onClose() {
    this.contentEl.empty();
  }
}
const rp = Object.freeze(
  Object.defineProperty({ __proto__: null, CreateProjectModal: gc }, Symbol.toStringTag, {
    value: "Module",
  }),
);
class Wo extends j.Modal {
  constructor(t, e, n) {
    (super(t), (this.projectPath = e), (this.onOpenProject = n));
  }
  onOpen() {
    const { contentEl: t } = this;
    (t.createEl("h2", { text: "Project created" }),
      t.createEl("p", { text: `Project '${this.projectPath}' was created.` }),
      new j.Setting(t).addButton((e) =>
        e
          .setButtonText("Open Project")
          .setCta()
          .onClick(async () => {
            (this.close(), this.onOpenProject && (await this.onOpenProject()));
          }),
      ),
      new j.Setting(t).addButton((e) => e.setButtonText("Close").onClick(() => this.close())));
  }
  onClose() {
    this.contentEl.empty();
  }
}
class is extends j.Modal {
  constructor(t, e) {
    (super(t), (this.props = e));
  }
  onOpen() {
    const { contentEl: t } = this;
    t.createEl("h2", { text: "Select Project for Draft" });
    let e = "";
    const n = this.props.folders || [];
    (new j.Setting(t).setName("Project folder").addDropdown((i) => {
      i.addOption("", "(Vault root)");
      for (const a of n) i.addOption(a, a || "(Vault root)");
      i.onChange((a) => (e = a));
    }),
      new j.Setting(t).addButton((i) =>
        i
          .setButtonText("Select")
          .setCta()
          .onClick(() => {
            (this.close(), this.props.onSubmit(e || ""));
          }),
      ));
  }
  onClose() {
    this.contentEl.empty();
  }
}
class np extends j.Modal {
  constructor(t, e, n) {
    (super(t), (this.drafts = e), (this.onSubmit = n));
  }
  onOpen() {
    const { contentEl: t } = this;
    t.createEl("h2", { text: "Switch Active Draft" });
    for (const e of this.drafts)
      new j.Setting(t).setName(e).addButton((n) =>
        n.setButtonText("Select").onClick(() => {
          (this.close(), this.onSubmit(e));
        }),
      );
  }
  onClose() {
    this.contentEl.empty();
  }
}
class ip {
  constructor(t, e, n) {
    var i;
    ((this.activeDraft = null),
      (this.activeProject = null),
      (this.activeProjectListeners = []),
      (this.activeDraftListeners = []),
      (this.panelRefreshListeners = []),
      (this._panelRefreshTimer = null),
      (this._panelRefreshDebounceMs = 250),
      (this.app = t),
      (this.plugin = e),
      (this.settings = e == null ? void 0 : e.settings),
      typeof n == "number" &&
        Number.isFinite(n) &&
        (this._panelRefreshDebounceMs = Math.max(0, Math.floor(n))),
      (this.activeProject = ((i = this.settings) == null ? void 0 : i.activeProject) || null),
      (this.projectService = new ia(t)),
      (this.projectFileService = new Os(t, this.projectService, this.settings)));
  }
  async reorderChapters(t, e, n) {
    return await this.projectFileService.chapters.reorderChapters(t, e, n);
  }
  async listChapters(t, e) {
    return await this.projectFileService.chapters.listChapters(t, e);
  }
  async createChapter(t, e, n) {
    return await this.projectFileService.chapters.createChapter(t, e, n, this.settings);
  }
  async deleteChapter(t, e, n) {
    return await this.projectFileService.chapters.deleteChapter(t, e, n);
  }
  async renameChapter(t, e, n, i) {
    return await this.projectFileService.chapters.renameChapter(t, e, n, i);
  }
  async openChapter(t, e, n) {
    return await this.projectFileService.chapters.openChapter(t, e, n);
  }
  get panelRefreshDebounceMs() {
    return this._panelRefreshDebounceMs;
  }
  set panelRefreshDebounceMs(t) {
    typeof t == "number" &&
      Number.isFinite(t) &&
      (this._panelRefreshDebounceMs = Math.max(0, Math.floor(t)));
  }
  addActiveProjectListener(t) {
    this.activeProjectListeners.push(t);
  }
  addActiveDraftListener(t) {
    this.activeDraftListeners.push(t);
  }
  removeActiveDraftListener(t) {
    this.activeDraftListeners = this.activeDraftListeners.filter((e) => e !== t);
  }
  notifyActiveDraftListeners(t) {
    for (const e of this.activeDraftListeners) Lt(() => e(t));
  }
  addPanelRefreshListener(t) {
    this.panelRefreshListeners.push(t);
  }
  removePanelRefreshListener(t) {
    this.panelRefreshListeners = this.panelRefreshListeners.filter((e) => e !== t);
  }
  notifyPanelRefresh() {
    try {
      (this._panelRefreshTimer && clearTimeout(this._panelRefreshTimer),
        (this._panelRefreshTimer = setTimeout(() => {
          for (const t of this.panelRefreshListeners) Lt(() => t());
          this._panelRefreshTimer = null;
        }, this._panelRefreshDebounceMs)));
    } catch {
      for (const t of this.panelRefreshListeners) Lt(() => t());
    }
  }
  removeActiveProjectListener(t) {
    this.activeProjectListeners = this.activeProjectListeners.filter((e) => e !== t);
  }
  async setActiveProject(t) {
    (t && (t = t.trim().replace(/^\/+/, "").replace(/\/+$/, "")),
      Z(`${H} setActiveProject called with '${t}'`),
      (this.activeProject = t),
      await ge(async () => {
        if (this.plugin) {
          const e = this.plugin;
          (e.settings || (e.settings = {}),
            (e.settings.activeProject = t ?? void 0),
            typeof e.saveSettings == "function" && (await e.saveSettings()));
        }
      }));
    for (const e of this.activeProjectListeners) Lt(() => e(t));
    try {
      if (!t) {
        ((this.activeDraft = null), this.notifyActiveDraftListeners(null));
        return;
      }
      const e = this.listDrafts(t);
      if (!e || e.length === 0) {
        this.activeDraft = null;
        return;
      }
      if (e.length === 1) {
        (await this.setActiveDraft(e[0], t, !1),
          Z(`${H} auto-selected single draft '${e[0]}' for project '${t}'`));
        return;
      }
      await ge(async () => {
        const s = await An(this.app, `${t}/meta.md`);
        if (s && s.current_active_draft && e.includes(s.current_active_draft)) {
          (await this.setActiveDraft(s.current_active_draft, t, !1),
            Z(`${H} auto-selected meta draft '${s.current_active_draft}' for project '${t}'`));
          return;
        }
      });
      let n = null,
        i = 0;
      const a = this.app.vault.getFiles(),
        o = oe(this.settings);
      for (const s of e) {
        const l = `${t}/${o}/${s}/`;
        let c = 0;
        for (const p of a)
          if (p.path.startsWith(l)) {
            const d = p.stat && typeof p.stat.mtime == "number" ? p.stat.mtime : 0;
            d > c && (c = d);
          }
        c > i && ((i = c), (n = s));
      }
      (n || (n = e[0]),
        Z(`${H} auto-selected draft '${n}' for project '${t}'`),
        await this.setActiveDraft(n, t, !1));
    } catch {}
  }
  async createNewProjectPrompt() {
    new gc(this.app, async (t, e, n, i) => {
      if (!t) {
        new j.Notice("Project name is required.");
        return;
      }
      const a = i && i !== "" ? `${i}/${t}` : t;
      this.app.vault.getAbstractFileByPath(a)
        ? new tp(
            this.app,
            a,
            async (s) => {
              s &&
                (await this.createNewProject(t, e, n, i),
                new Wo(this.app, a, async () => await this.openProject(a)).open());
            },
            async () => {
              await this.openProject(a);
            },
          ).open()
        : (await this.createNewProject(t, e, n, i),
          new Wo(this.app, a, async () => await this.openProject(a)).open());
    }).open();
  }
  async openProject(t) {
    return await this.projectService.openProject(t);
  }
  async createNewProject(t, e, n, i) {
    const a = await this.projectService.createProject(t, e, n, i, this.settings);
    if (a) {
      await this.setActiveProject(a);
      const o = n || "Draft 1";
      (await this.setActiveDraft(o, a), Lt(() => this.notifyPanelRefresh()));
    }
    return a;
  }
  listAllFolders() {
    return this.projectService.listAllFolders();
  }
  async createNewDraftPrompt() {
    const t = this.listAllFolders(),
      e = await Yn(t, (n) => this.projectService.isProjectFolder(n));
    new is(this.app, {
      folders: e,
      onSubmit: async (n) => {
        const i = await this.suggestNextDraftName(n);
        new ep(this.app, {
          suggestedName: i,
          drafts: this.listDrafts(n),
          projectPath: n,
          onSubmit: async (a, o) => {
            (await this.projectFileService.drafts.createDraft(a, o, n, this.settings),
              new j.Notice(`Draft "${a}" created in ${n}.`));
          },
        }).open();
      },
    }).open();
  }
  async switchDraftPrompt() {
    const t = this.listDrafts();
    if (t.length === 0) {
      new j.Notice("No drafts found in the current project.");
      return;
    }
    new np(this.app, t, async (e) => {
      ((this.activeDraft = e), new j.Notice(`Switched to draft: ${e}`));
      const n = this.getCurrentProjectPath();
      n && (await Hn(this.app, n, e, void 0, this.settings));
    }).open();
  }
  async updateProjectMetadataPrompt() {
    if (this.activeProject) {
      (await Hn(this.app, this.activeProject, void 0, void 0, this.settings),
        new j.Notice(`Metadata updated for ${this.activeProject}`));
      return;
    }
    (async () => {
      const t = this.listAllFolders(),
        e = await Yn(t, (n) => this.projectService.isProjectFolder(n));
      new is(this.app, {
        folders: e,
        onSubmit: async (n) => {
          (await Hn(this.app, n, void 0, void 0, this.settings),
            new j.Notice(`Metadata updated for ${n}`));
        },
      }).open();
    })();
  }
  async selectActiveProjectPrompt() {
    const t = this.listAllFolders(),
      e = await Yn(t, (n) => this.projectService.isProjectFolder(n));
    if (e.length === 0) {
      new j.Notice(`No ${Kt} projects found in the vault.`);
      return;
    }
    new is(this.app, {
      folders: e,
      onSubmit: async (n) => {
        (await this.setActiveProject(n), new j.Notice(`Active project set to ${n}`));
      },
    }).open();
  }
  async createNewDraft(t, e, n) {
    const i = await this.projectFileService.drafts.createDraft(t, e, n, this.settings);
    return (Lt(() => this.notifyPanelRefresh()), i);
  }
  listDrafts(t) {
    return this.projectFileService.drafts.listDrafts(t);
  }
  async setActiveDraft(t, e, n = !0) {
    const i = e || this.activeProject || this.getCurrentProjectPath();
    return i
      ? ((this.activeDraft = t),
        await ge(async () => {
          await Hn(this.app, i, t, void 0, this.settings);
        }),
        this.notifyActiveDraftListeners(this.activeDraft),
        n && new j.Notice(`Active draft set to ${t}`),
        !0)
      : (n && new j.Notice("No project selected to set active draft on."), !1);
  }
  async renameDraft(t, e, n, i = !1) {
    const a = n || this.activeProject || this.getCurrentProjectPath();
    if (!a) return (new j.Notice("No project selected to rename draft."), !1);
    const o = this.activeDraft === t;
    return (await this.projectFileService.drafts.renameDraft(a, t, e, i, this.settings))
      ? (o && (this.activeDraft = e), new j.Notice(`Renamed draft ${t} → ${e}`), !0)
      : (new j.Notice("Failed to rename draft."), !1);
  }
  async deleteDraft(t, e, n = !0) {
    const i = e || this.activeProject || this.getCurrentProjectPath();
    if (!i) return (new j.Notice("No project selected to delete draft."), !1);
    if (await this.projectFileService.drafts.deleteDraft(i, t, n)) {
      new j.Notice(`Deleted draft ${t}`);
      const o = this.listDrafts(i);
      if (o.length > 0) {
        if (this.activeDraft === t || !this.activeDraft) {
          let s;
          if (o.length === 1) s = o[0];
          else {
            const l = [...o].sort((c, p) => c.localeCompare(p));
            if (this.activeDraft === t) {
              const c = l.findIndex((p) => p === t);
              if (c !== -1) {
                const p = c < l.length - 1 ? c : 0;
                s = l[p];
              } else s = l[0];
            } else s = this.activeDraft;
          }
          await this.setActiveDraft(s, i, !1);
        }
      } else ((this.activeDraft = null), this.notifyActiveDraftListeners(null));
      return !0;
    }
    return (new j.Notice("Failed to delete draft."), !1);
  }
  async suggestNextDraftName(t) {
    return await this.projectFileService.drafts.suggestNextDraftName(t);
  }
  getCurrentProjectPath() {
    const t = this.app.workspace.getActiveFile();
    if (!t) return null;
    const e = t.parent;
    return e ? e.path : null;
  }
}
const Wn = 0,
  Ki = 5e3,
  Xi = 250;
class ap extends j.PluginSettingTab {
  constructor(t, e) {
    (super(t, e),
      (this.plugin = e),
      Z(`${H} Settings tab created`),
      typeof e.registerSettingsChangedCallback == "function" &&
        e.registerSettingsChangedCallback(() => {
          (Z(`${H} Settings changed externally, refreshing UI`),
            this.containerEl && this.containerEl.parentElement && this.display());
        }));
  }
  display() {
    const { containerEl: t } = this;
    (t.empty(), t.createEl("h2", { text: `${Kt} Settings` }), Z(`${H} Displaying settings UI`));
    const e = this.plugin;
    (t.createEl("h3", { text: "Templates" }),
      new j.Setting(t)
        .setName("Include outline file on draft creation")
        .setDesc(
          "If enabled, each new draft will include an outline.md file using the outline template.",
        )
        .addToggle((s) =>
          s.setValue(!!e.settings.includeDraftOutline).onChange((l) => {
            (Z(`${H} Include draft outline changed: ${l}`),
              (e.settings.includeDraftOutline = l),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName("Draft outline template")
        .setDesc("Template for new draft outline files. Use {{draftName}}")
        .addTextArea((s) => {
          (s.setValue(e.settings.draftOutlineTemplate || ""),
            s.inputEl.setAttribute("data-setting", "draft-outline"));
        })
        .addButton((s) =>
          s.setButtonText("Pick file...").onClick(() => {
            (Z(`${H} Opening file picker for draft outline template`),
              new as(this.app, (l) => {
                (Z(`${H} Draft outline template selected: ${l}`),
                  (e.settings.draftOutlineTemplate = l),
                  this.display());
              }).open());
          }),
        ),
      new j.Setting(t)
        .setName("Planning template")
        .setDesc("Template for planning documents. Use {{projectName}}")
        .addTextArea((s) => {
          (s.setValue(e.settings.planningTemplate || ""),
            s.inputEl.setAttribute("data-setting", "planning"));
        })
        .addButton((s) =>
          s.setButtonText("Pick file...").onClick(() => {
            (Z(`${H} Opening file picker for planning template`),
              new as(this.app, (l) => {
                (Z(`${H} Planning template selected: ${l}`),
                  (e.settings.planningTemplate = l),
                  this.display());
              }).open());
          }),
        ),
      new j.Setting(t)
        .setName("Chapter template")
        .setDesc("Template for newly created chapter files. Use {{chapterTitle}}")
        .addTextArea((s) => {
          (s.setValue(e.settings.chapterTemplate || ""),
            s.inputEl.setAttribute("data-setting", "chapter"));
        })
        .addButton((s) =>
          s.setButtonText("Pick file...").onClick(() => {
            (Z(`${H} Opening file picker for chapter template`),
              new as(this.app, (l) => {
                (Z(`${H} Chapter template selected: ${l}`),
                  (e.settings.chapterTemplate = l),
                  this.display());
              }).open());
          }),
        ),
      new j.Setting(t)
        .setName("Manuscript name template")
        .setDesc(
          "Template for manuscript filenames. Use {{draftName}}, {{projectName}}, and moment.js date qualifiers like {{YYYY-MM-DD}}",
        )
        .addText((s) => {
          (s.setValue(e.settings.manuscriptNameTemplate || "{{draftName}}"),
            s.inputEl.setAttribute("data-setting", "manuscript"));
        }),
      new j.Setting(t).addButton((s) =>
        s
          .setButtonText("Save Templates")
          .setCta()
          .onClick(async () => {
            var v, u, f;
            Z(`${H} Save Templates button clicked`);
            const l = t.querySelector('textarea[data-setting="draft-outline"]'),
              c = t.querySelector('textarea[data-setting="planning"]'),
              p = t.querySelector('textarea[data-setting="chapter"]'),
              d = t.querySelector('input[data-setting="manuscript"]');
            (Z(
              `${H} Found inputs - draft: ${!!l}, planning: ${!!c}, chapter: ${!!p}, manuscript: ${!!d}`,
            ),
              Z(`${H} Manuscript input value: "${d == null ? void 0 : d.value}"`),
              l && (e.settings.draftOutlineTemplate = l.value),
              c && (e.settings.planningTemplate = c.value),
              p && (e.settings.chapterTemplate = p.value),
              d && (e.settings.manuscriptNameTemplate = d.value),
              Z(
                `${H} Saving templates: draft=${(v = e.settings.draftOutlineTemplate) == null ? void 0 : v.substring(0, 50)}..., planning=${(u = e.settings.planningTemplate) == null ? void 0 : u.substring(0, 50)}..., chapter=${(f = e.settings.chapterTemplate) == null ? void 0 : f.substring(0, 50)}..., manuscript=${e.settings.manuscriptNameTemplate}`,
              ),
              await e.saveSettings(),
              new j.Notice("Templates saved successfully!"));
          }),
      ),
      t.createEl("h3", { text: "Filenames" }),
      new j.Setting(t)
        .setName("Draft filename slug style")
        .setDesc("How per-draft main filenames are generated")
        .addDropdown((s) => {
          (s.addOption("compact", "compact (draft1)"),
            s.addOption("kebab", "kebab (draft-1)"),
            s.setValue(e.settings.slugStyle || "compact"),
            s.onChange((l) => {
              (Z(`${H} Slug style changed: ${l}`), (e.settings.slugStyle = l), e.saveSettings());
              const c = t.querySelector(".wat-slug-preview");
              c && (c.textContent = `Example: Draft 1 → ${Ke("Draft 1", l)}.md`);
            }));
        }));
    let n = "Draft 1";
    new j.Setting(t)
      .setName("Sample draft name")
      .setDesc("Type a sample draft name to preview the generated filename")
      .addText((s) =>
        s
          .setPlaceholder("Draft 1")
          .setValue(n)
          .onChange((l) => {
            n = l || "Draft 1";
            const c = t.querySelector(".wat-slug-preview");
            if (c) {
              const p = Ke(n, e.settings.slugStyle);
              c.textContent = `Example: ${n} → ${p}.md`;
            }
          }),
      );
    const i = t.createDiv({ cls: "wat-slug-preview" }),
      a = Ke(n, e.settings.slugStyle);
    (i.setText(`Example: ${n} → ${a}.md`),
      t.createEl("h3", { text: "Folders & Files" }),
      new j.Setting(t)
        .setName("Drafts folder name")
        .setDesc("Name of the folder containing draft subfolders (default: drafts)")
        .addText((s) =>
          s.setValue(e.settings.draftsFolderName || "drafts").onChange((l) => {
            (Z(`${H} Drafts folder name changed: ${l}`),
              (e.settings.draftsFolderName = l || "drafts"),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName("Manuscripts folder name")
        .setDesc("Name of the folder containing generated manuscripts (default: manuscripts)")
        .addText((s) =>
          s.setValue(e.settings.manuscriptsFolderName || "manuscripts").onChange((l) => {
            (Z(`${H} Manuscripts folder name changed: ${l}`),
              (e.settings.manuscriptsFolderName = l || "manuscripts"),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName("Backups folder name")
        .setDesc("Name of the folder containing draft backups (default: .writeaid-backups)")
        .addText((s) =>
          s.setValue(e.settings.backupsFolderName || ".writeaid-backups").onChange((l) => {
            (Z(`${H} Backups folder name changed: ${l}`),
              (e.settings.backupsFolderName = l || ".writeaid-backups"),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName("Meta file name")
        .setDesc("Name of the project metadata file (default: meta.md)")
        .addText((s) =>
          s.setValue(e.settings.metaFileName || "meta.md").onChange((l) => {
            (Z(`${H} Meta file name changed: ${l}`),
              (e.settings.metaFileName = l || "meta.md"),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName("Outline file name")
        .setDesc("Name of the draft outline file (default: outline.md)")
        .addText((s) =>
          s.setValue(e.settings.outlineFileName || "outline.md").onChange((l) => {
            (Z(`${H} Outline file name changed: ${l}`),
              (e.settings.outlineFileName = l || "outline.md"),
              e.saveSettings());
          }),
        ),
      t.createEl("h3", { text: "Word Count Targets" }),
      new j.Setting(t)
        .setName("Default target word count for multi-file projects")
        .setDesc("Target word count automatically set for new multi-file projects (chapters)")
        .addText((s) =>
          s
            .setValue(String(e.settings.defaultMultiTargetWordCount ?? 5e4))
            .setPlaceholder("50000")
            .onChange((l) => {
              const c = parseInt(l, 10);
              !isNaN(c) &&
                c > 0 &&
                (Z(`${H} Default multi-file target word count changed: ${c}`),
                (e.settings.defaultMultiTargetWordCount = c),
                e.saveSettings());
            }),
        ),
      new j.Setting(t)
        .setName("Default target word count for single-file projects")
        .setDesc("Target word count automatically set for new single-file projects")
        .addText((s) =>
          s
            .setValue(String(e.settings.defaultSingleTargetWordCount ?? 2e4))
            .setPlaceholder("20000")
            .onChange((l) => {
              const c = parseInt(l, 10);
              !isNaN(c) &&
                c > 0 &&
                (Z(`${H} Default single-file target word count changed: ${c}`),
                (e.settings.defaultSingleTargetWordCount = c),
                e.saveSettings());
            }),
        ),
      t.createEl("h3", { text: "Backup Settings" }),
      new j.Setting(t)
        .setName("Maximum number of backups per draft")
        .setDesc("Maximum number of backup files to keep per draft (default: 5)")
        .addText((s) =>
          s
            .setValue(String(e.settings.maxBackups ?? 5))
            .setPlaceholder("5")
            .onChange((l) => {
              const c = parseInt(l, 10);
              !isNaN(c) &&
                c >= 0 &&
                (Z(`${H} Max backups changed: ${c}`),
                (e.settings.maxBackups = c),
                e.saveSettings());
            }),
        ),
      new j.Setting(t)
        .setName("Maximum backup age (days)")
        .setDesc("Automatically delete backups older than this many days (default: 30)")
        .addText((s) =>
          s
            .setValue(String(e.settings.maxBackupAgeDays ?? 30))
            .setPlaceholder("30")
            .onChange((l) => {
              const c = parseInt(l, 10);
              !isNaN(c) &&
                c >= 0 &&
                (Z(`${H} Max backup age changed: ${c}`),
                (e.settings.maxBackupAgeDays = c),
                e.saveSettings());
            }),
        ),
      t.createEl("h3", { text: "UI & Startup" }),
      t.createEl("p", {
        text: "Most settings take effect immediately. Settings marked with ⚠️ require a plugin reload to take effect.",
        cls: "setting-item-description",
      }),
      new j.Setting(t)
        .setName("Ribbon placement")
        .setDesc(`Place the ${Kt} icon on the left or right ribbon`)
        .addDropdown((s) => {
          (s.addOption("left", "Left"),
            s.addOption("right", "Right"),
            s.setValue(e.settings.ribbonPlacement || "left"),
            s.onChange((l) => {
              (Z(`${H} Ribbon placement changed: ${l}`),
                (e.settings.ribbonPlacement = l),
                e.saveSettings(),
                typeof this.plugin.moveRibbon == "function" &&
                  (l === "left" || l === "right") &&
                  this.plugin.moveRibbon(l),
                this.display());
            }));
        }),
      new j.Setting(t)
        .setName("Always show ribbon")
        .setDesc(
          `If enabled, the ${Kt} ribbon icon will always be visible regardless of whether projects are detected`,
        )
        .addToggle((s) =>
          s.setValue(!!e.settings.ribbonAlwaysShow).onChange((l) => {
            (Z(`${H} Always show ribbon changed: ${l}`),
              (e.settings.ribbonAlwaysShow = l),
              e.saveSettings(),
              typeof this.plugin.refreshRibbonVisibility == "function" &&
                this.plugin.refreshRibbonVisibility());
          }),
        ),
      new j.Setting(t)
        .setName("Auto-open project panel on startup")
        .setDesc(
          `If enabled, the ${Kt} project panel will open on plugin load when an active project is saved. ⚠️ Requires plugin reload to take effect.`,
        )
        .addToggle((s) =>
          s.setValue(!!e.settings.autoOpenPanelOnStartup).onChange((l) => {
            (Z(`${H} Auto-open panel on startup changed: ${l}`),
              (e.settings.autoOpenPanelOnStartup = l),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName("Auto-select persisted project on startup")
        .setDesc(
          "If enabled, the persisted active project will be selected as the plugin's active project on load without opening the panel. ⚠️ Requires plugin reload to take effect.",
        )
        .addToggle((s) =>
          s.setValue(!!e.settings.autoSelectProjectOnStartup).onChange((l) => {
            (Z(`${H} Auto-select project on startup changed: ${l}`),
              (e.settings.autoSelectProjectOnStartup = l),
              e.saveSettings());
          }),
        ),
      new j.Setting(t)
        .setName(`Enable ${Kt} debug logs`)
        .setDesc(
          `When enabled, ${Kt} will set window.__${Kt.toUpperCase()}__ to true to show verbose runtime logs useful during development.`,
        )
        .addToggle((s) =>
          s.setValue(!!e.settings.debug).onChange((l) => {
            (Z(`${H} Debug logs setting changed: ${l}`),
              (e.settings.debug = l),
              (window.__WRITEAID_DEBUG__ = !!l),
              e.saveSettings(),
              l
                ? new j.Notice(
                    `${Kt}: debug logs enabled — verbose logs will appear in the DevTools console.`,
                  )
                : new j.Notice(`${Kt}: debug logs disabled.`));
          }),
        ),
      t.createEl("h3", { text: "Panel performance" }),
      new j.Setting(t)
        .setName("Panel refresh debounce (ms)")
        .setDesc(
          "Debounce timeout (milliseconds) for side-panel refresh notifications. Lower values mean more frequent refreshes; 0 disables debouncing.",
        )
        .addText((s) => {
          const l = e.settings.panelRefreshDebounceMs,
            c = Number(l ?? Xi);
          (s.setPlaceholder(String(Xi)), s.setValue(String(c)));
          let p = null;
          const d = (v) => {
            const u = Number(v);
            if (!Number.isFinite(u) || u < Wn) {
              new j.Notice(`Please enter a valid number ≥ ${Wn}.`);
              return;
            }
            const f = Math.min(Math.floor(u), Ki);
            (Z(`${H} Panel refresh debounce changed: ${f}ms`),
              (e.settings.panelRefreshDebounceMs = f));
            try {
              const h = e.saveSettings();
              h && typeof h.catch == "function" && h.catch(() => {});
            } catch {}
            (this.plugin.manager &&
              typeof this.plugin.manager == "object" &&
              "panelRefreshDebounceMs" in this.plugin.manager &&
              (this.plugin.manager.panelRefreshDebounceMs = f),
              (s.inputEl.value = String(f)),
              p && (p.value = String(f)));
          };
          try {
            const v = s.inputEl;
            (v.setAttribute("type", "number"),
              v.setAttribute("min", String(Wn)),
              v.setAttribute("max", String(Ki)),
              v.setAttribute("step", "50"),
              v.setAttribute("aria-label", "Panel refresh debounce in milliseconds"),
              Lt(() => {
                v.insertAdjacentHTML("afterend", '<span class="wa-unit">ms</span>');
              }),
              (p = document.createElement("input")),
              (p.type = "range"),
              (p.min = String(Wn)),
              (p.max = String(Ki)),
              (p.step = "50"),
              (p.value = String(c)),
              (p.className = "wa-debounce-range"),
              Lt(() => {
                const u = v.nextSibling;
                u && u.parentElement
                  ? u.insertAdjacentElement("afterend", p)
                  : v.insertAdjacentElement("afterend", p);
              }),
              s.onChange((u) => {
                const f = Number(u);
                d(f);
              }),
              p.addEventListener("input", (u) => {
                const f = Number(u.target.value);
                ((s.inputEl.value = String(f)), d(f));
              }));
          } catch {
            s.onChange((v) => {
              const u = Number(v);
              if (!Number.isFinite(u) || u < Wn) {
                new j.Notice(`Please enter a valid number ≥ ${Wn}.`);
                return;
              }
              const f = Math.min(Math.floor(u), Ki);
              ((e.settings.panelRefreshDebounceMs = f),
                e.saveSettings(),
                this.plugin.manager &&
                  typeof this.plugin.manager == "object" &&
                  "panelRefreshDebounceMs" in this.plugin.manager &&
                  (this.plugin.manager.panelRefreshDebounceMs = f));
            });
          }
        })
        .addButton((s) =>
          s
            .setButtonText("Reset")
            .setTooltip(`Reset to default (${Xi} ms)`)
            .onClick(() => {
              const l = Xi;
              ((e.settings.panelRefreshDebounceMs = l),
                e.saveSettings(),
                this.plugin.manager &&
                  typeof this.plugin.manager == "object" &&
                  "panelRefreshDebounceMs" in this.plugin.manager &&
                  (this.plugin.manager.panelRefreshDebounceMs = l),
                this.display());
            }),
        ));
  }
}
class as extends j.Modal {
  constructor(t, e) {
    (super(t),
      (this.currentFolder = null),
      (this.expanded = {}),
      (this.onPick = e),
      Z(`${H} FilePickerModal created`));
  }
  onOpen() {
    Z(`${H} FilePickerModal opened`);
    const t = this.app.vault.getRoot();
    ((this.currentFolder = t), (this.expanded = {}), this.render());
  }
  render() {
    const { contentEl: t } = this;
    if ((t.empty(), t.createEl("h2", { text: "Select template file" }), !this.currentFolder))
      return;
    const e = this.currentFolder.path ? this.currentFolder.path.split("/") : [],
      n = t.createDiv({ cls: "wat-breadcrumbs" }),
      i = n.createEl("a", { text: "(Vault root)", href: "#" });
    i.onclick = (c) => {
      (c.preventDefault(), (this.currentFolder = this.app.vault.getRoot()), this.render());
    };
    let a = "";
    for (const c of e) {
      ((a = a ? `${a}/${c}` : c), n.createDiv({ text: " / " }));
      const p = n.createEl("a", { text: c, href: "#" }),
        d = a;
      p.onclick = (v) => {
        v.preventDefault();
        const u = this.app.vault.getAbstractFileByPath(d);
        u && u instanceof j.TFolder && ((this.currentFolder = u), this.render());
      };
    }
    const s = t.createDiv({ cls: "wat-controls" }).createEl("button", { text: "Up" });
    s.onclick = (c) => {
      var v;
      if ((c.preventDefault(), !this.currentFolder)) return;
      const p = ((v = this.currentFolder.parent) == null ? void 0 : v.path) || "",
        d = p ? this.app.vault.getAbstractFileByPath(p) : this.app.vault.getRoot();
      d && d instanceof j.TFolder && ((this.currentFolder = d), this.render());
    };
    const l = t.createDiv({ cls: "wat-list" });
    for (const c of this.currentFolder.children)
      if (c instanceof j.TFolder) {
        const p = l.createDiv({ cls: "wat-row folder-row" }),
          d = p.createEl("button", { text: this.expanded[c.path] ? "▾" : "▸" });
        d.onclick = (u) => {
          (u.preventDefault(), (this.expanded[c.path] = !this.expanded[c.path]), this.render());
        };
        const v = p.createEl("a", { text: c.name, href: "#" });
        if (
          ((v.onclick = (u) => {
            (u.preventDefault(), (this.currentFolder = c), this.render());
          }),
          this.expanded[c.path])
        ) {
          const u = l.createDiv({ cls: "wat-sub" });
          for (const f of c.children)
            if (f instanceof j.TFolder) {
              const b = u
                .createDiv({ cls: "wat-row sub-folder" })
                .createEl("a", { text: f.name, href: "#" });
              b.onclick = (g) => {
                (g.preventDefault(), (this.currentFolder = f), this.render());
              };
            } else if (f instanceof j.TFile && f.path.toLowerCase().endsWith(".md")) {
              const b = u
                .createDiv({ cls: "wat-row sub-file" })
                .createEl("a", { text: f.name, href: "#" });
              b.onclick = (g) => {
                (g.preventDefault(),
                  Z(`${H} File selected from file picker: ${f.path}`),
                  this.close(),
                  this.onPick(f.path));
              };
            }
        }
      } else if (c instanceof j.TFile && c.path.toLowerCase().endsWith(".md")) {
        const d = l
          .createDiv({ cls: "wat-row file-row" })
          .createEl("a", { text: c.name, href: "#" });
        d.onclick = (v) => {
          (v.preventDefault(),
            Z(`${H} File selected from file picker: ${c.path}`),
            this.close(),
            this.onPick(c.path));
        };
      }
  }
  onClose() {
    this.contentEl.empty();
  }
}
const sp =
  ":root{--background: var(--background-primary, #fff);--border: var(--background-modifier-border, #ccc);--border-focused: var(--interactive-accent, #7c5cff);--border-hover: var(--interactive-accent, #7c5cff);--border-radius: 6px;--border-radius-focused: 6px;--box-sizing: border-box;--font-size: 1.5em;--height: 38px;--padding: 0 10px;--margin: 0;--width: 100%;--list-background: var(--background-secondary, #f6f6f6);--list-border: var(--background-modifier-border, #e0e0e0);--list-border-radius: 6px;--list-shadow: 0 2px 8px rgba(30, 30, 30, .06);--list-z-index: 1000;--list-max-height: 260px;--item-color: var(--text-normal, #222);--item-hover-bg: var(--background-modifier-hover, #f0f0ff);--item-hover-color: var(--text-normal, #222);--item-active-background: var(--background-modifier-active, #eaeaff);--item-is-active-bg: var(--background-modifier-active, #eaeaff);--item-is-active-color: var(--text-normal, #222);--item-padding: 8px 14px;--item-height: 36px;--item-line-height: 1.4;--item-transition: background .15s;--placeholder-color: var(--text-muted, #888);--placeholder-opacity: 1;--chevron-color: var(--text-muted, #888);--chevron-icon-colour: var(--text-muted, #888);--chevron-background: transparent;--chevron-border: none;--chevron-width: 22px;--chevron-height: 22px;--chevron-pointer-events: auto;--icons-color: var(--text-muted, #888);--disabled-background: var(--background-modifier-disabled, #f3f3f3);--disabled-border-color: var(--background-modifier-border, #eee);--disabled-color: var(--text-muted, #bbb);--disabled-placeholder-color: var(--text-muted, #bbb);--disabled-placeholder-opacity: .7;--error-background: #fff0f0;--error-border: #d43c3c}.theme-dark{--background: var(--background-primary, #23232b);--border: var(--background-modifier-border, #333);--border-focused: var(--interactive-accent, #7c5cff);--border-hover: var(--interactive-accent, #7c5cff);--font-size: 1em;--list-background: var(--background-secondary, #23233a);--list-border: var(--background-modifier-border, #333);--item-color: var(--text-normal, #e0e0e0);--item-hover-bg: var(--background-modifier-hover, #2a2a4a);--item-hover-color: var(--text-normal, #e0e0e0);--item-active-background: var(--background-modifier-active, #2a2a4a);--item-is-active-bg: var(--background-modifier-active, #2a2a4a);--item-is-active-color: var(--text-normal, #e0e0e0);--placeholder-color: var(--text-muted, #aaa);--chevron-color: var(--text-muted, #aaa);--chevron-icon-colour: var(--text-muted, #aaa);--icons-color: var(--text-muted, #aaa);--disabled-background: var(--background-modifier-disabled, #23232b);--disabled-border-color: var(--background-modifier-border, #333);--disabled-color: var(--text-muted, #444);--disabled-placeholder-color: var(--text-muted, #444);--error-background: #2a1a1a;--error-border: #d43c3c}.writeaid-ribbon{padding-left:6px}.writeaid-ribbon .wa-icon{display:inline-block;vertical-align:middle}.writeaid-ribbon .wa-icon svg{width:16px;height:16px;fill:currentColor;display:block}:root{--wa-slider-track-height: 6px;--wa-slider-thumb-size: 12px;--wa-slider-accent: var(--interactive-accent, #7c5cff);--wa-slider-background: var(--background-modifier-host, #eee);--wa-slider-gap: 12px}.wa-debounce-range{margin-left:var(--wa-slider-gap);vertical-align:middle;-webkit-appearance:none;-moz-appearance:none;appearance:none;height:var(--wa-slider-track-height);background:linear-gradient(90deg,var(--wa-slider-accent) 0%,var(--wa-slider-accent) 50%,var(--wa-slider-background) 50%,var(--wa-slider-background) 100%);border-radius:999px;outline:none}.wa-debounce-range::-webkit-slider-thumb{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:var(--wa-slider-thumb-size);height:var(--wa-slider-thumb-size);border-radius:50%;background:var(--wa-slider-accent);box-shadow:0 0 0 4px #0000000d;cursor:pointer}.wa-debounce-range::-moz-range-thumb{width:var(--wa-slider-thumb-size);height:var(--wa-slider-thumb-size);border-radius:50%;background:var(--wa-slider-accent);cursor:pointer}.wa-unit{color:var(--text-muted, #666);margin-left:6px}.justify-between{justify-content:space-between}.wa-rename-info{margin-bottom:8px;color:var(--text-muted, #888);font-size:.95em}.wa-rename-label{display:block;font-weight:500;margin-bottom:4px;color:var(--text-normal, #222)}.wa-rename-input{width:100%;padding:7px 10px;font-size:1em;border:1px solid var(--background-modifier-border, #ccc);border-radius:5px;margin-bottom:10px;box-sizing:border-box;background:var(--background-primary, #fff);color:var(--text-normal, #222);transition:border .2s}.wa-rename-input:focus{border-color:var(--interactive-accent, #7c5cff);outline:none}.wa-rename-checkbox-label{display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:.97em;color:var(--text-muted, #666)}.wa-rename-btn-row{display:flex;gap:10px;margin-top:8px;justify-content:flex-end}.wa-rename-btn-row button{min-width:80px;padding:6px 14px;font-size:1em;border-radius:4px;border:none;cursor:pointer;transition:background .2s}.wa-rename-btn-row .mod-cta{background:var(--interactive-accent, #7c5cff);color:#fff;font-weight:600}.wa-rename-btn-row .mod-cta:hover{background:#5a3fd6}.wa-rename-btn-row .mod-cancel{background:var(--background-modifier-border, #eee);color:var(--text-muted, #666)}.wa-rename-btn-row .mod-cancel:hover{background:#e0e0e0}.wa-rename-error{min-height:18px;margin-bottom:4px;font-size:.97em;color:var(--color-red, #d43c3c);transition:opacity .2s}.wa-create-draft-input{width:100%;padding:8px 12px;font-size:1.05em;border:1.5px solid var(--background-modifier-border, #bbb);border-radius:6px;box-sizing:border-box;background:var(--background-primary, #fff);color:var(--text-normal, #222);transition:border .2s,box-shadow .2s;outline:none;box-shadow:0 1px 2px #3c3c3c0a}.wa-create-draft-input:focus{border-color:var(--interactive-accent, #7c5cff);box-shadow:0 2px 8px #7c5cff14;background:var(--background-secondary, #fafaff)}.wa-panel{background:var(--background-primary, #fff);color:var(--text-normal, #222);border-radius:8px}.wa-title{font-size:1.2em;font-weight:600;color:var(--text-title, var(--text-normal, #222))}.wa-muted{color:var(--text-faint, var(--text-muted, #888))}.wa-row{display:flex;flex-direction:row;align-items:center}.wa-button-group{display:flex;gap:8px}.wa-draft-list{background:var(--background-secondary, #f6f6f6);border-radius:6px;padding:8px 0;margin-top:8px}.wa-draft-item{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;border-bottom:1px solid var(--background-modifier-border, #e0e0e0);background:transparent;color:var(--text-normal, #222);transition:background .15s}.wa-draft-item:last-child{border-bottom:none}.wa-draft-item.active{background:var(--background-modifier-active, #eaeaff)}.wa-draft-name{font-size:1em;font-weight:500;color:var(--text-normal, #222)}.wa-draft-actions{display:flex;gap:6px}.wa-panel .wa-select{--select-bg: var(--background-primary, #fff);--select-border: var(--background-modifier-border, #ccc);--select-border-focus: var(--interactive-accent, #7c5cff);--select-text: var(--text-normal, #222);--select-placeholder: var(--text-muted, #888);--select-dropdown-bg: var(--background-secondary, #f6f6f6);--select-dropdown-border: var(--background-modifier-border, #e0e0e0);--select-option-hover: var(--background-modifier-hover, #f0f0ff);--select-option-active: var(--background-modifier-active, #eaeaff);--select-chevron: var(--text-muted, #888)}.theme-dark .wa-panel .wa-select{--select-bg: var(--background-primary, #23232b);--select-border: var(--background-modifier-border, #333);--select-border-focus: var(--interactive-accent, #7c5cff);--select-text: var(--text-normal, #e0e0e0);--select-placeholder: var(--text-muted, #aaa);--select-dropdown-bg: var(--background-secondary, #23233a);--select-dropdown-border: var(--background-modifier-border, #333);--select-option-hover: var(--background-modifier-hover, #2a2a4a);--select-option-active: var(--background-modifier-active, #2a2a4a);--select-chevron: var(--text-muted, #aaa)}.wa-select{background:var(--select-bg);color:var(--select-text)}.wa-select:focus,.wa-select:focus-within{border-color:var(--select-border-focus)}.wa-select .select-placeholder{color:var(--select-placeholder)}.wa-select .select-dropdown{background:var(--select-dropdown-bg)}.wa-select .select-option{color:var(--select-text)}.wa-select .select-option:hover{background:var(--select-option-hover)}.wa-select .select-option[aria-selected=true],.wa-select .select-option.selected{background:var(--select-option-active)}.wa-select .select-chevron{color:var(--select-chevron)}.wa-select input[type=text]:focus{border-radius:0}.theme-dark .wa-panel{background:var(--background-primary, #23232b);color:var(--text-normal, #e0e0e0);border:1px solid var(--background-modifier-border, #333)}.theme-dark .wa-title{color:var(--text-title, var(--text-normal, #e0e0e0))}.theme-dark .wa-muted{color:var(--text-faint, var(--text-muted, #aaa))}.theme-dark .wa-draft-list{background:var(--background-secondary, #23233a)}.theme-dark .wa-draft-item{color:var(--text-normal, #e0e0e0);border-bottom:1px solid var(--background-modifier-border, #333)}.theme-dark .wa-draft-item.active{background:var(--background-modifier-active, #2a2a4a)}.theme-dark .wa-draft-name{color:var(--text-normal, #e0e0e0)}";
function Uo(r, t = 20) {
  return r.length <= t ? r : r.substring(0, t - 3) + "...";
}
const bc = {
  draftOutlineTemplate: "# Outline for {{draftName}}",
  planningTemplate: `# Planning: {{projectName}}

- [ ] ...`,
  chapterTemplate: `# {{chapterTitle}}

`,
  manuscriptNameTemplate: "{{draftName}}",
  slugStyle: "compact",
  ribbonPlacement: "left",
  ribbonAlwaysShow: !1,
  autoOpenPanelOnStartup: !0,
  autoSelectProjectOnStartup: !0,
  activeProject: void 0,
  panelRefreshDebounceMs: 250,
  debug: !1,
  includeDraftOutline: !1,
  draftsFolderName: "Drafts",
  manuscriptsFolderName: "manuscripts",
  backupsFolderName: ".writeaid-backups",
  metaFileName: "meta.md",
  outlineFileName: "outline.md",
  maxBackups: 5,
  maxBackupAgeDays: 30,
};
function Vo(r) {
  return Object.assign({}, bc, r ?? {});
}
class op extends j.Plugin {
  constructor() {
    (super(...arguments), (this.settings = bc), (this.settingsChangedCallbacks = []));
  }
  async loadSettings() {
    const t = await this.loadData();
    ((this.settings = Vo(t)),
      t && t.activeProject !== void 0 && (this.settings.activeProject = t.activeProject),
      this.manager && (this.manager.settings = this.settings),
      this.settingsChangedCallbacks.forEach((e) => {
        try {
          e();
        } catch (n) {
          Z(`${H} Error in settings changed callback:`, n);
        }
      }));
  }
  async saveSettings() {
    ((await ge(async () => {
      const e = Vo(this.settings);
      (await this.saveData(e), (this.settings = e));
    })) === void 0 && (await this.saveData(this.settings)),
      this.manager &&
        ((this.manager.settings = this.settings),
        Z(
          `${H} Updated manager settings reference, manuscript template: ${this.settings.manuscriptNameTemplate}`,
        )),
      this.settingsChangedCallbacks.forEach((e) => {
        try {
          e();
        } catch (n) {
          Z(`${H} Error in settings changed callback:`, n);
        }
      }));
  }
  registerSettingsChangedCallback(t) {
    this.settingsChangedCallbacks.push(t);
  }
  async runBackupCleanup() {
    if (this.manager)
      try {
        const e = await new ia(this.app).listProjects();
        for (const n of e) {
          const i = oe(this.settings),
            a = `${n}/${i}`,
            o = this.app.vault.getAbstractFileByPath(a);
          if (!(!o || !(o instanceof j.TFolder))) {
            for (const s of o.children)
              if (s instanceof j.TFolder) {
                const l = `${a}/${s.name}`;
                await this.manager.projectFileService.backups.clearOldBackups(
                  l,
                  this.manager.settings,
                );
              }
          }
        }
        Z(`${H} Backup cleanup completed on startup`);
      } catch (t) {
        Z(`${H} Error during backup cleanup:`, t);
      }
  }
  async onload() {
    (await this.loadSettings(),
      (this.manager = new ip(
        this.app,
        this,
        typeof this.settings.panelRefreshDebounceMs == "number"
          ? this.settings.panelRefreshDebounceMs
          : void 0,
      )));
    const t = new ia(this.app);
    (this.app.workspace.onLayoutReady(async () => {
      const i = await t.listProjects();
      let a = null;
      if (i.length === 1) a = i[0];
      else if (i.length > 1) {
        const o = this.settings.activeProject,
          s = o == null ? void 0 : o.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        (Z(`${H} lastActiveRaw='${o}', normalized='${s}', includes=${s && i.includes(s)}`),
          s && i.includes(s) ? (a = s) : (a = i[0]));
      } else if (i.length === 0) {
        const o = this.settings.activeProject,
          s = o == null ? void 0 : o.trim().replace(/^\/+/, "").replace(/\/+$/, "");
        (await t.isProjectFolder(o || "")) &&
          (Z(`${H} activating saved project '${s}' as it exists and has valid meta.md`),
          (a = s ?? null));
      }
      if ((Z(`${H} toActivate='${a}'`), a)) {
        if (
          (await this.manager.setActiveProject(a),
          (this.settings.activeProject = a),
          await this.saveSettings(),
          this.settings.autoOpenPanelOnStartup)
        ) {
          const o = this.app.workspace.getLeavesOfType(Kr);
          if (o.length > 0) this.app.workspace.revealLeaf(o[0]);
          else {
            let s = null;
            this.settings.ribbonPlacement === "right"
              ? (s = this.app.workspace.getRightLeaf(!0))
              : (s = this.app.workspace.getLeftLeaf(!0));
            const l = { type: Kr, active: !0 };
            (s.setViewState(l), this.app.workspace.revealLeaf(s));
          }
        }
      } else
        (await this.manager.setActiveProject(null),
          (this.settings.activeProject = void 0),
          await this.saveSettings());
    }),
      (this.statusBarEl = this.addStatusBarItem()),
      this.statusBarEl.setText(`${Kt}: No active project`),
      this.runBackupCleanup().catch((i) => {
        Z(`${H} Failed to run backup cleanup on startup:`, i);
      }),
      Lt(() => {
        this.waStyleEl ||
          ((this.waStyleEl = document.createElement("style")),
          this.waStyleEl.setAttribute("data-writeaid-style", ""),
          (this.waStyleEl.textContent = sp),
          this.waStyleEl.classList.add("writeaid-plugin-style"),
          document.head.appendChild(this.waStyleEl));
      }),
      await this.loadSettings(),
      Lt(() => {
        window.__WRITEAID_DEBUG__ = !!this.settings.debug;
      }),
      Z(`${H} Loading ${Kt} Novel Multi-Draft Plugin`),
      this.manager.addActiveProjectListener((i) => {
        this.statusBarEl &&
          (i
            ? (this.statusBarEl.setText(`${Kt}: ${Uo(i)}`),
              Z(`${H} active project updated -> ${i}`))
            : this.statusBarEl.setText(`${Kt}: No active project`));
      }),
      this.manager.activeProject &&
        this.statusBarEl.setText(`${Kt}: ${Uo(this.manager.activeProject)}`),
      this.registerView(Kr, (i) => new Xh(i, this.app)));
    const e = this.addRibbonIcon(Ko, `${Kt} Projects`, () => {});
    (e.classList.add("writeaid-ribbon"),
      (this.ribbonEl = e),
      e.setAttr("aria-label", `${Kt} Projects`),
      (e.onclick = () => {
        const i = this.app.workspace.getLeavesOfType(Kr);
        if (i.length > 0) {
          const a = i[0];
          this.app.workspace.revealLeaf(a);
        } else {
          let a = this.app.workspace.getLeftLeaf(!1);
          a || (a = this.app.workspace.getLeftLeaf(!0));
          const o = { type: Kr, active: !0 };
          (a.setViewState(o), this.app.workspace.revealLeaf(a));
        }
      }));
    const n = async () => {
      (await ge(async () => {
        if (this.settings.ribbonAlwaysShow) {
          e.style.display = "";
          return;
        }
        const a = t.listAllFolders();
        (await Yn(a, (s) => t.isProjectFolder(s))).length > 0
          ? (e.style.display = "")
          : (e.style.display = "none");
      })) === void 0 && (e.style.display = "");
    };
    ((this.refreshRibbonVisibility = n),
      n().catch(() => {}),
      this.settings.ribbonPlacement === "right" && this.moveRibbon("right"),
      this.registerEvent(
        this.app.vault.on("create", () => {
          n().catch(() => {});
        }),
      ),
      this.registerEvent(
        this.app.vault.on("delete", () => {
          n().catch(() => {});
        }),
      ),
      this.registerEvent(
        this.app.vault.on("modify", () => {
          n().catch(() => {});
        }),
      ),
      this.addCommand({
        id: "create-new-draft",
        name: "Create New Draft",
        callback: Kc(this.manager),
      }),
      this.addCommand({
        id: "create-new-project",
        name: "Create New Project",
        callback: Xc(this.manager),
      }),
      this.addCommand({
        id: "switch-draft",
        name: "Switch Active Draft",
        callback: au(this.manager),
      }),
      this.addCommand({
        id: "update-project-metadata",
        name: "Update Project Metadata",
        callback: Qh(this.manager),
      }),
      this.addCommand({
        id: "select-active-project",
        name: "Select Active Project",
        callback: iu(this.manager),
      }),
      this.addCommand({
        id: "generate-manuscript",
        name: "Generate Manuscript",
        callback: Qc(this.manager),
      }),
      this.addCommand({
        id: "toggle-project-panel",
        name: `Toggle ${Kt} Project Panel`,
        callback: Jh(this.manager, this.app),
      }),
      this.addCommand({
        id: "convert-single-to-multi-file-project",
        name: "Convert Single-File Project to Multi-File",
        callback: () => {
          var i, a;
          return Gc(
            this.app,
            this.manager.activeProject ||
              ((a = (i = this.manager).getCurrentProjectPath) == null ? void 0 : a.call(i)) ||
              void 0,
            this.manager.settings,
          );
        },
      }),
      this.addCommand({
        id: "navigate-to-next-chapter",
        name: "Navigate to Next Chapter",
        callback: ru(this.manager),
      }),
      this.addCommand({
        id: "navigate-to-previous-chapter",
        name: "Navigate to Previous Chapter",
        callback: nu(this.manager),
      }),
      this.addCommand({ id: "create-backup", name: "Create Backup", callback: Yc(this.manager) }),
      this.addCommand({
        id: "list-and-restore-backups",
        name: "List and Restore Backups",
        callback: eu(this.manager),
      }),
      this.addCommand({
        id: "delete-backup",
        name: "Delete Oldest Backup",
        callback: Jc(this.manager),
      }),
      this.addCommand({
        id: "clear-old-backups",
        name: "Clear Old Backups",
        callback: Vc(this.manager),
      }),
      this.addSettingTab(new ap(this.app, this)));
  }
  moveRibbon(t) {
    Lt(() => {
      if (!this.ribbonEl) return;
      const e = this.app.workspace.containerEl.querySelector(".workspace-ribbon.mod-right"),
        n = this.app.workspace.containerEl.querySelector(".workspace-ribbon.mod-left");
      t === "right" && e
        ? e.appendChild(this.ribbonEl)
        : t === "left" && n && n.appendChild(this.ribbonEl);
    });
  }
  onunload() {
    (this.statusBarEl &&
      this.statusBarEl.parentElement &&
      this.statusBarEl.parentElement.removeChild(this.statusBarEl),
      Z(`${H} Unloading ${Kt} Novel Multi-Draft Plugin`),
      this.waStyleEl &&
        this.waStyleEl.parentElement &&
        this.waStyleEl.parentElement.removeChild(this.waStyleEl));
  }
}
module.exports = op;
