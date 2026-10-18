// 빌드: src/ (한국어 원본, 파일 여러 개) → public/index.html(영어), public/ko.html(한국어)
//       파일 하나에 코드·그림을 모두 넣어서 어디서든 바로 실행되게 만듦
// 사용법: node build.mjs        (Vercel도 배포할 때 이 명령을 자동으로 실행함)
import fs from 'node:fs';
const src = p => fs.readFileSync(new URL('./src/' + p, import.meta.url), 'utf8');
const page = src('index.html');
const files = [...page.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
// 그림 파일(.webp)은 코드 안에 글자(data URI)로 넣어서 파일 하나로 만듦
const inline = name => 'data:image/webp;base64,' + fs.readFileSync(new URL('./src/' + name, import.meta.url)).toString('base64');
const code = files.map(f => `// ===== ${f} =====\n` + src(f)).join('\n').replace(/'([a-z0-9_-]+\.webp)'/g, (m, n) => `'${inline(n)}'`);
const single = page.replace(/<!-- BUILD:SCRIPTS -->[\s\S]*?<!-- \/BUILD:SCRIPTS -->/, () => `<script>\n${code}\n</script>`);
const pairs = JSON.parse(src('i18n-en.json')).sort((a, b) => b[0].length - a[0].length);

function toEnglish(html) {
  let out = html, missing = [];
  for (const [ko, en] of pairs) { if (!out.includes(ko)) { missing.push(ko); continue; } out = out.split(ko).join(en); }
  // 번역이 빠진 한글 찾기 (주석, L('한국어', ...)의 첫 번째 칸은 제외)
  const left = [];
  out.split('\n').forEach((line, i) => {
    if (line.includes('data:image')) return;
    let c = line.trim().startsWith('<') ? line : line.replace(/\/\/.*$/, '');
    c = c.replace(/\/\*.*?\*\//g, '').replace(/L\((['`])(?:\\.|(?!\1).)*?\1/g, 'L(').replace(/ko: (['`])(?:\\.|(?!\1).)*?\1/g, 'ko: ');
    if (/[가-힣]/.test(c)) left.push(`${i + 1}: ${c.trim().slice(0, 100)}`);
  });
  if (missing.length) console.warn('⚠️ 번역표에 있는데 코드에서 못 찾은 문구:\n  ' + missing.join('\n  '));
  if (left.length) console.warn('⚠️ 번역 안 된 한글:\n  ' + left.join('\n  '));
  return out.replace('<html lang="ko">', '<html lang="en">');
}
const langLink = (html, href, label) => html.replace('<div class="best" id="bestTxt"></div>', `<div class="best" id="bestTxt"></div>\n      <a class="best" href="${href}" style="color:inherit">${label}</a>`);
const fragment = html => html.replace(/^[\s\S]*?<head>[\s\S]*?(<title>)/, '$1').replace(/<\/head>\s*<body>\s*/, '\n').replace(/<\/body>\s*<\/html>\s*$/, '');

const ko = single, en = toEnglish(single);
fs.mkdirSync(new URL('./public/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./public/index.html', import.meta.url), langLink(en, '/ko', '🌐 한국어'));
fs.writeFileSync(new URL('./public/ko.html', import.meta.url), langLink(ko, '/', '🌐 English'));
if (process.argv.includes('--artifact')) { // Claude 미리보기용 조각 파일
  fs.mkdirSync(new URL('./artifact/', import.meta.url), { recursive: true });
  fs.writeFileSync(new URL('./artifact/game_en.html', import.meta.url), fragment(en));
  fs.writeFileSync(new URL('./artifact/game_ko.html', import.meta.url), fragment(ko));
}
console.log(`✅ 빌드 완료: public/index.html (English), public/ko.html (한국어) — ${(Buffer.byteLength(en) / 1024).toFixed(0)}KB`);
