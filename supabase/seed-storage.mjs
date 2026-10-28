#!/usr/bin/env node
// Uploads a small placeholder PDF to every paper's `file_path` in the private
// `papers` bucket, so the signed-download flow works against seed data.
// Run AFTER `npx supabase db reset` (npm run db:reset does both).
//
// Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the
// environment or .env.local; falls back to `npx supabase status`.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }));
    env.NEXT_PUBLIC_SUPABASE_URL ||= status.API_URL;
    env.SUPABASE_SERVICE_ROLE_KEY ||= status.SERVICE_ROLE_KEY;
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY };
}

// Builds a valid single-page PDF (with a correct xref table) showing the
// paper's identifier. ASCII only: base-14 fonts can't render Hangul.
function placeholderPdf(lines) {
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const text = lines
    .map((l, i) => `BT /F1 ${i === 0 ? 20 : 12} Tf 72 ${760 - i * 28} Td (${esc(l)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out);
}

const { url, key } = loadEnv();
const headers = { Authorization: `Bearer ${key}`, apikey: key };

const res = await fetch(`${url}/rest/v1/papers?select=concept_id,version_no,file_path`, { headers });
if (!res.ok) throw new Error(`listing papers failed: ${res.status} ${await res.text()}`);
const papers = await res.json();

for (const p of papers) {
  const pdf = placeholderPdf([
    'KSCA Sample Paper',
    `${p.concept_id}  (version ${p.version_no})`,
    'This is a placeholder PDF uploaded by supabase/seed-storage.mjs',
    'for local development.',
  ]);
  const up = await fetch(`${url}/storage/v1/object/papers/${p.file_path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
    body: pdf,
  });
  if (!up.ok) throw new Error(`upload ${p.file_path} failed: ${up.status} ${await up.text()}`);
  console.log(`uploaded ${p.file_path}`);
}
