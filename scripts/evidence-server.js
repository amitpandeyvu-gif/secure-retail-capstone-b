// Local inspection utility only; this is separate from the application server.
import express from 'express';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase, projectRoot, defaultDatabasePath } from '../src/database.js';

const db = openDatabase();
const app = express();
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table = rows => rows.length ? '<table><thead><tr>' + Object.keys(rows[0]).map(k => `<th>${escape(k)}</th>`).join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + Object.values(row).map(v => `<td>${escape(v)}</td>`).join('') + '</tr>').join('') + '</tbody></table>' : '<p>No rows</p>';
const pages = {
  structure: () => {
    function walk(path, indent = '') {
      return readdirSync(path, {withFileTypes:true}).filter(x => !['.git','node_modules','output'].includes(x.name)).sort((a,b)=>a.name.localeCompare(b.name)).map(x => indent + x.name + (x.isDirectory() ? '/\n' + walk(resolve(path,x.name),indent+'  ') : '')).join('\n');
    }
    return `<pre>${escape(projectRoot + '\n' + walk(projectRoot))}</pre>`;
  },
  database: () => {
    const path = process.env.DATABASE_PATH || defaultDatabasePath;
    const info = statSync(path);
    return `<p>${escape(path)}</p><p>Size: ${info.size} bytes</p><pre>${escape(readFileSync(path).subarray(0,16).toString())}</pre>` + table(db.prepare('PRAGMA integrity_check').all()) + '<p>Foreign key violations: ' + db.prepare('PRAGMA foreign_key_check').all().length + '</p>';
  },
  tables: () => table(db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name").all()),
  categories: () => table(db.prepare('SELECT * FROM categories ORDER BY id').all()),
  products: () => table(db.prepare('SELECT id, category_id, sku, name, price_cents, material FROM products ORDER BY id').all()),
  variants: () => table(db.prepare('SELECT * FROM variants ORDER BY id').all()),
  package: () => `<pre>${escape(readFileSync(resolve(projectRoot,'package.json'),'utf8'))}</pre>`,
  server: () => `<pre>${escape(readFileSync(resolve(projectRoot,'server.js'),'utf8'))}</pre>`
};
app.get('/:page', (req,res) => {
  const render = Object.hasOwn(pages,req.params.page) ? pages[req.params.page] : null;
  if (!render) return res.sendStatus(404);
  res.send(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Sprint 3 ${escape(req.params.page)}</title><style>body{font:16px Arial,sans-serif;margin:32px;color:#111}h1{font-size:24px}table{border-collapse:collapse}td,th{border:1px solid #aaa;padding:10px;text-align:left;vertical-align:top}th{background:#eee}pre{font:15px Consolas,monospace;white-space:pre-wrap;line-height:1.35}td{max-width:700px;white-space:pre-wrap}nav a{margin-right:14px}</style><h1>Sprint 3 ${escape(req.params.page)}</h1><p>Live local inspection of project files and SQLite data</p><nav>${Object.keys(pages).map(p=>`<a href="/${p}">${p}</a>`).join('')}</nav><hr>${render()}</html>`);
});
const server = app.listen(3001,'127.0.0.1',()=>console.log('Evidence inspector: http://127.0.0.1:3001/structure'));
server.on('error', error => { console.error(error.message); db.close(); process.exitCode=1; });
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0);}));
