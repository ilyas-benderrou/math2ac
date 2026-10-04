// Vérifie les fichiers de questions : `npm run check`
// Règles (CLAUDE.md) : 3 choix, une seule bonne réponse, chaque mauvais choix a son « why »,
// compétence valide, hint/exp présents, formules KaTeX valides, pas de doublons.
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';

const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'src', 'data');
const domains = JSON.parse(fs.readFileSync(path.join(dir, 'domains.json'), 'utf8')).map(d => d.id);
let errors = 0, total = 0;
const err = (where, msg) => { errors++; console.log(`✗ ${where} : ${msg}`); };

function checkTex(where, s) {
  if (typeof s !== 'string') return;
  if ((s.match(/\$/g) || []).length % 2) err(where, `nombre impair de $ dans « ${s} »`);
  for (const m of s.matchAll(/\$([^$]+)\$/g)) {
    try { katex.renderToString(m[1], { throwOnError: true }); }
    catch (e) { err(where, `KaTeX : ${e.message}`); }
  }
}

for (const f of fs.readdirSync(dir).filter(f => /-p[1-3]\.json$/.test(f)).sort()) {
  const id = f.split('-p')[0];
  if (!domains.includes(id)) err(f, `domaine « ${id} » absent de domains.json`);
  let pc;
  try { pc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
  catch (e) { err(f, `JSON invalide : ${e.message}`); continue; }
  pc.comps.forEach((c, i) => { if (!c.name || !c.pages) err(`${f} comp ${i + 1}`, 'name/pages manquant'); checkTex(`${f} comp ${i + 1}`, c.name); });
  const seen = new Set();
  pc.questions.forEach((q, i) => {
    const w = `${f} q${i + 1}`;
    total++;
    if (!Number.isInteger(q.comp) || q.comp < 1 || q.comp > pc.comps.length) err(w, `comp ${q.comp} invalide`);
    if (!q.q) err(w, 'énoncé vide');
    if (seen.has(q.q) && !q.fig) err(w, 'énoncé en double');
    seen.add(q.q);
    if (!Array.isArray(q.options) || q.options.length !== 3) err(w, 'il faut exactement 3 choix');
    const ok = (q.options || []).filter(o => o.ok === true);
    if (ok.length !== 1) err(w, `${ok.length} bonne(s) réponse(s) au lieu de 1`);
    (q.options || []).forEach((o, k) => {
      if (!o.t) err(w, `choix ${k + 1} vide`);
      if (!o.ok && !o.why) err(w, `choix ${k + 1} : explication « why » manquante`);
      checkTex(w, o.t); checkTex(w, o.why);
    });
    const texts = (q.options || []).map(o => o.t);
    if (new Set(texts).size !== texts.length) err(w, 'deux choix identiques');
    if (!q.hint) err(w, 'hint manquant');
    if (!q.exp) err(w, 'exp manquant');
    checkTex(w, q.q); checkTex(w, q.hint); checkTex(w, q.exp);
  });
  pc.comps.forEach((c, ci) => { if (!pc.questions.some(q => q.comp === ci + 1)) err(f, `aucune question pour la compétence ${ci + 1}`); });
  console.log(`✓ ${f} : ${pc.questions.length} questions, ${pc.comps.length} compétences`);
}
console.log(errors ? `\n${errors} erreur(s) sur ${total} questions` : `\nTout est bon (${total} questions).`);
process.exit(errors ? 1 : 0);
