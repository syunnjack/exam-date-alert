// examdate.jp を組み立てる。
//
// 試験日そのものは載せない。毎年変わるうえ、古い日付を載せたページは
// 申込期限を逃す原因になるため。載せるのは、変わりにくい制度の情報と、
// 主催団体の公式ページへのリンクだけにする。
//
// 使い方: node scripts/build-site.mjs

import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist')
const site = 'https://examdate.jp'
const siteName = '資格試験ガイド'

const data = JSON.parse(await readFile(join(root, 'src/exams.json'), 'utf8'))
const { exams, categories, confirmedOn } = data

const escape = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const style = `
  :root { --bg:#f7f8fa; --surface:#fff; --text:#1f2530; --muted:#68717f; --line:#e2e6ec; --accent:#2f5d8a; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#15181c; --surface:#1d2126; --text:#e8eaee; --muted:#9aa3af; --line:#2c3238; --accent:#8ab4dd; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); line-height:1.8;
         font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; }
  a { color: var(--accent); }
  header, footer { background: var(--surface); border-bottom:1px solid var(--line); }
  footer { border-bottom:0; border-top:1px solid var(--line); margin-top:3rem; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 1rem 1.1rem; }
  h1 { font-size: 1.6rem; line-height:1.5; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .card { display:block; background:var(--surface); border:1px solid var(--line); border-radius:.5rem;
          padding: .9rem 1rem; text-decoration:none; color:inherit; height:100%; }
  .card:hover { border-color: var(--accent); }
  .grid { display:grid; gap:.75rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
  .muted { color: var(--muted); font-size: .88rem; }
  table { width:100%; border-collapse: collapse; background:var(--surface); }
  th, td { border:1px solid var(--line); padding:.6rem .7rem; text-align:left; vertical-align: top; }
  th { width: 10rem; color: var(--muted); font-weight: 600; font-size:.9rem; }
  .note { background:var(--surface); border:1px solid var(--line); border-left:4px solid var(--accent);
          border-radius:.4rem; padding:.8rem 1rem; font-size:.92rem; }
  nav.crumbs { font-size:.85rem; margin:.6rem 0 1rem; }
`

function page({ title, description, path, body, breadcrumbs = [] }) {
  const url = `${site}${path}`
  const crumbJson = breadcrumbs.length
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.name, item: `${site}${item.path}`,
        })),
      })}</script>`
    : ''

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:locale" content="ja_JP" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>${style}</style>
${crumbJson}
</head>
<body>
<header><div class="wrap"><strong><a href="/" style="text-decoration:none">📋 ${siteName}</a></strong></div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap muted">
  <p><a href="/about/">このサイトについて</a></p>
  <p>掲載しているリンク先は${confirmedOn}に表示を確認しました。試験日・申込期間は各主催団体の公式ページでご確認ください。</p>
  <p>© ${new Date(confirmedOn).getFullYear()} ${siteName}</p>
</div></footer>
</body>
</html>
`
}

function examCard(exam) {
  const category = categories.find((item) => item.slug === exam.category)

  return `<a class="card" href="/exams/${exam.slug}/">
    <div class="muted">${escape(category?.name ?? '')}</div>
    <div><strong>${escape(exam.shortName)}</strong></div>
    <div class="muted">${escape(exam.organizer)}</div>
  </a>`
}

// ---------------------------------------------------------------- トップ
const home = page({
  title: `${siteName}｜主要${exams.length}試験の主催団体と公式日程ページ`,
  description: `情報処理技術者試験・宅建・簿記・英検など主要${exams.length}試験について、主催団体・受験の仕組み・公式の日程ページへのリンクをまとめています。試験日は毎年変わるため、当サイトには掲載していません。`,
  path: '/',
  body: `
<h1>資格試験の「どこで確認するか」をまとめました</h1>
<p>試験日と申込期間は毎年変わります。古い日付を載せたページを見て申込を逃さないよう、<strong>このサイトには具体的な日付を載せていません</strong>。かわりに、主催団体・受験の仕組み・<strong>公式の日程ページへの直リンク</strong>を置いています。</p>

${categories.map((category) => {
    const list = exams.filter((exam) => exam.category === category.slug)
    if (!list.length) return ''
    return `<h2>${escape(category.name)}</h2>
<div class="grid">${list.map(examCard).join('\n')}</div>`
  }).join('\n')}

<h2>掲載の方針</h2>
<div class="note">
  <p>載せているのは、主催団体の名称、試験の区分、実施回数の傾向、公式ページのURLです。
  リンク先は${confirmedOn}に実際に開いて確認しました。</p>
  <p>「今年の試験日」は書きません。日付は毎年変わり、方式の変更や中止も起こります。
  日付を知りたいときは、各ページの<strong>公式の日程ページ</strong>を開いてください。</p>
</div>
`,
})

// ---------------------------------------------------------------- 試験ページ
const examPages = exams.map((exam) => {
  const category = categories.find((item) => item.slug === exam.category)

  return {
    path: `/exams/${exam.slug}/`,
    html: page({
      title: `${exam.name}｜主催団体と公式の日程ページ - ${siteName}`,
      description: `${exam.name}の主催団体は${exam.organizer}です。試験区分・実施の傾向と、公式の日程ページへのリンクをまとめています。`,
      path: `/exams/${exam.slug}/`,
      breadcrumbs: [
        { name: siteName, path: '/' },
        { name: category?.name ?? '', path: `/categories/${exam.category}/` },
        { name: exam.shortName, path: `/exams/${exam.slug}/` },
      ],
      body: `
<nav class="crumbs"><a href="/">トップ</a> / <a href="/categories/${exam.category}/">${escape(category?.name ?? '')}</a> / ${escape(exam.shortName)}</nav>
<h1>${escape(exam.name)}</h1>

<table>
<tbody>
<tr><th>主催団体</th><td>${escape(exam.organizer)}</td></tr>
<tr><th>試験区分</th><td>${escape(exam.levels)}</td></tr>
<tr><th>実施の傾向</th><td>${escape(exam.timing)}</td></tr>
<tr><th>公式サイト</th><td><a href="${escape(exam.site)}" rel="nofollow noopener" target="_blank">${escape(exam.site)}</a></td></tr>
<tr><th>公式の日程ページ</th><td><a href="${escape(exam.schedule)}" rel="nofollow noopener" target="_blank">${escape(exam.schedule)}</a></td></tr>
</tbody>
</table>

<h2>申し込む前に確認すること</h2>
<div class="note">
  <p>${escape(exam.verifiedNote)}</p>
  <p>試験日・申込期間・受験料は年度によって変わります。上の「公式の日程ページ」で最新の内容をご確認ください。</p>
</div>

<h2>同じ分野の試験</h2>
<div class="grid">
${exams.filter((other) => other.category === exam.category && other.slug !== exam.slug).map(examCard).join('\n') || '<p class="muted">この分野は現在この試験のみ掲載しています。</p>'}
</div>
`,
    }),
  }
})

// ---------------------------------------------------------------- 分野ページ
const categoryPages = categories
  .filter((category) => exams.some((exam) => exam.category === category.slug))
  .map((category) => {
    const list = exams.filter((exam) => exam.category === category.slug)

    return {
      path: `/categories/${category.slug}/`,
      html: page({
        title: `${category.name}の資格試験${list.length}件｜主催団体と公式日程ページ - ${siteName}`,
        description: `${category.name}の資格試験${list.length}件について、主催団体と公式の日程ページへのリンクをまとめています。`,
        path: `/categories/${category.slug}/`,
        breadcrumbs: [
          { name: siteName, path: '/' },
          { name: category.name, path: `/categories/${category.slug}/` },
        ],
        body: `
<nav class="crumbs"><a href="/">トップ</a> / ${escape(category.name)}</nav>
<h1>${escape(category.name)}の資格試験</h1>
<p class="muted">${list.length}件を掲載しています。</p>
<div class="grid">${list.map(examCard).join('\n')}</div>
`,
      }),
    }
  })

// ---------------------------------------------------------------- このサイトについて
const about = page({
  title: `このサイトについて - ${siteName}`,
  description: `${siteName}が試験日そのものを載せていない理由と、掲載内容の確認方法を説明しています。`,
  path: '/about/',
  body: `
<nav class="crumbs"><a href="/">トップ</a> / このサイトについて</nav>
<h1>このサイトについて</h1>

<h2>試験日を載せていない理由</h2>
<p>資格試験の日程は毎年変わります。方式の変更（紙からCBTへの移行など）や、募集要項の改定も起こります。
まとめサイトに古い日付が残っていると、それを見た人が申込期間を逃します。年1回しかない試験では、その影響は1年です。</p>
<p>そこでこのサイトは、<strong>日付を書き写すことをやめました</strong>。かわりに、変わりにくい情報（主催団体・試験区分・実施回数の傾向）と、
公式の日程ページへの直リンクを置いています。</p>

<h2>掲載しているもの</h2>
<ul>
  <li>試験の正式名称と、主催・実施団体の名称</li>
  <li>試験区分（級・種別）</li>
  <li>実施回数と時期の傾向（「年1回・例年10月」など、公式に公表されている範囲）</li>
  <li>公式サイトと、公式の日程ページのURL</li>
</ul>
<p class="muted">リンク先は${confirmedOn}に実際に開いて、表示されることを確認しています。</p>

<h2>掲載していないもの</h2>
<ul>
  <li>今年の試験日・申込締切日・受験料の金額</li>
  <li>合格率や難易度のランキング</li>
  <li>予備校・通信講座の比較</li>
</ul>

<h2>誤りを見つけたら</h2>
<p>リンク切れや、団体名の変更などにお気づきの場合はお知らせください。確認のうえ修正します。</p>
`,
})

// ---------------------------------------------------------------- 書き出し
async function write(path, html) {
  const file = join(out, path.replace(/^\//, ''), path.endsWith('/') || path === '/' ? 'index.html' : '')
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html, 'utf8')
}

await mkdir(out, { recursive: true })
await write('/', home)
await write('/about/', about)

for (const item of [...examPages, ...categoryPages]) {
  await write(item.path, item.html)
}

const urls = [
  '/',
  '/about/',
  ...categoryPages.map((item) => item.path),
  ...examPages.map((item) => item.path),
]

await writeFile(join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map((path) => `  <url><loc>${site}${path}</loc></url>`).join('\n')
  + `\n</urlset>\n`, 'utf8')

await writeFile(join(out, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`, 'utf8')

await copyFile(join(root, 'public/favicon.svg'), join(out, 'favicon.svg')).catch(() => {})
await writeFile(join(out, 'CNAME'), 'examdate.jp\n', 'utf8')

console.log(`${urls.length}ページを書き出しました（試験 ${exams.length}件）`)
