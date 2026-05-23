import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../.SPEC')

const nav = (a) => {
  const c = (id) => (a === id ? 'is-active text-slate-200' : 'text-slate-300')
  return `<nav class="spec-nav shrink-0 border-b border-lake/20 bg-lake-dark/80 p-4 lg:w-56 lg:min-h-screen lg:border-b-0 lg:border-r">
  <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-lake">Drift Spec</p>
  <p class="mb-4 text-xs text-slate-500">\u5de5\u4f5c\u6307\u5bfc \u00b7 \u957f\u8fdc\u8def\u7ebf\u56fe</p>
  <ul class="flex flex-col gap-1 text-sm">
    <li><a href="index.html" class="block rounded-lg px-3 py-2 ${c('index')}">\u603b\u89c8</a></li>
    <li><a href="design.html" class="block rounded-lg px-3 py-2 ${c('design')}">\u6982\u5ff5\u8bbe\u8ba1</a></li>
    <li><a href="phase-0-foundation.html" class="block rounded-lg px-3 py-2 ${c('p0')}">Phase 0 \u57fa\u7840</a></li>
    <li><a href="phase-1-core.html" class="block rounded-lg px-3 py-2 ${c('p1')}">Phase 1 \u6838\u5fc3\u4f53\u9a8c</a></li>
    <li><a href="phase-2-world.html" class="block rounded-lg px-3 py-2 ${c('p2')}">Phase 2 \u4e16\u754c\u5185\u5bb9</a></li>
    <li><a href="phase-3-atmosphere.html" class="block rounded-lg px-3 py-2 ${c('p3')}">Phase 3 \u6c1b\u56f4\u53d9\u4e8b</a></li>
    <li><a href="phase-4-platform.html" class="block rounded-lg px-3 py-2 ${c('p4')}">Phase 4 \u5e73\u53f0\u5927\u4f5c</a></li>
    <li><a href="phase-5-launch.html" class="block rounded-lg px-3 py-2 ${c('p5')}">Phase 5 \u53d1\u884c\u589e\u957f</a></li>
  </ul>
  <p class="mt-8 text-xs text-slate-500"><a class="spec-link-back" href="/">\u2190 \u8fd0\u884c\u6e38\u620f</a></p>
</nav>`
}

const wrap = (title, active, body) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="./" />
  <title>${title} \u00b7 Drift Spec</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{lake:{DEFAULT:'#6eb8e8',dark:'#061428'}}}}}</script>
  <link rel="stylesheet" href="css/specs.css" />
</head>
<body class="spec-body antialiased">
<div class="flex min-h-screen flex-col lg:flex-row">
${nav(active)}
<main class="spec-content flex-1 px-5 py-8 lg:px-10 max-w-3xl">
${body}
</main>
</div>
</body>
</html>`

const pb = (n) => `<div class="progress-bar mb-6"><div class="progress-bar__fill" style="width:${n}%"></div></div>`

const item = (cls, title, tags, detail) =>
  `<li class="${cls} spec-item"><span class="spec-item-title">${title}</span><span class="spec-tags">${tags}</span><p class="spec-detail">${detail}</p></li>`

const designCard = (title, tag, body) =>
  `<article class="spec-concept"><h4>${title}</h4><span class="spec-tags">${tag}</span><p>${body}</p></article>`

const swatch = (hex, label) =>
  `<span class="spec-swatch" style="background:${hex}" title="${hex}">${label}</span>`

const pages = {
  'index.html': ['\u603b\u89c8', 'index', `
  <h1 class="text-3xl font-bold text-white mb-2">Drift \u9879\u76ee\u603b\u89c8</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u505a\u6210\u4e00\u6b3e<strong>\u7cbe\u7f8e\u3001\u6cbb\u6108\u3001\u53d7\u6b22\u8fce</strong>\u7684\u7b2c\u4e00\u4eba\u79f0\u661f\u9645\u6f2b\u6e38\u4f5c\u54c1\u3002\u73b0\u9636\u6bb5\u4e3a Web \u539f\u578b\uff08<code>src/game.js</code>\uff09\u3002</p>
  <div class="spec-vision">\u6838\u5fc3\u611f\u53d7\uff1a\u5728\u661f\u6d77\u91cc\u6162\u6162\u6f02\u6d6e\u2014\u2014\u5b81\u9759\u3001\u8302\u8fdc\u3001\u5076\u6709\u60ca\u559c\u3002</div>
  <p class="text-slate-400 mb-2">\u5168\u5c40 52/89\uff08\u7ea6 58%\uff09</p>
  ${pb(58)}
  <div class="spec-pillar">
    <article><h4>\u89c6\u89c9</h4><p>\u661f\u91ce + \u540e\u5904\u7406 + \u7edf\u4e00\u8272\u76f8</p></article>
    <article><h4>\u624b\u611f</h4><p>\u6f02\u6d6e\u5f0f\u98de\u884c\uff0c\u4e0d\u6655\u5934</p></article>
    <article><h4>\u53d7\u4f17</h4><p>\u77ed\u89c6\u9891\u53ef\u6f14\u793a\u3001\u96f6\u95e8\u69db\u8bd5\u73a9</p></article>
  </div>
  <p class="mt-6"><a class="spec-phase-card spec-phase-card--link" href="design.html"><h3>\u6982\u5ff5\u8bbe\u8ba1</h3><p>\u5b9a\u4f4d\u3001\u89c6\u89c9\u3001\u624b\u611f\u3001\u4e16\u754c\u4e0e\u53d9\u4e8b\u6982\u5ff5</p></a></p>
  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u9636\u6bb5\u8def\u7ebf</h2>
  <a class="spec-phase-card spec-phase-card--link" href="phase-0-foundation.html"><h3>Phase 0 \u2014 12/12</h3><p>Web \u539f\u578b\u4e0e\u6027\u80fd\u57fa\u7ebf</p></a>
  <a class="spec-phase-card spec-phase-card--link" href="phase-1-core.html"><h3>Phase 1 \u2014 15/15</h3><p>\u6838\u5fc3\u4f53\u9a8c\u4e0e\u624b\u611f</p></a>
  <a class="spec-phase-card spec-phase-card--link" href="phase-2-world.html"><h3>Phase 2 \u2014 10/18</h3><p>\u4e16\u754c\u4e0e\u5185\u5bb9</p></a>
  <a class="spec-phase-card spec-phase-card--link" href="phase-3-atmosphere.html"><h3>Phase 3 \u2014 6/14</h3><p>\u6c1b\u56f4\u4e0e\u53d9\u4e8b</p></a>
  <a class="spec-phase-card spec-phase-card--link" href="phase-4-platform.html"><h3>Phase 4 \u2014 4/16</h3><p>\u5e73\u53f0\u5927\u4f5c\u5316</p></a>
  <a class="spec-phase-card spec-phase-card--link" href="phase-5-launch.html"><h3>Phase 5 \u2014 2/14</h3><p>\u53d1\u884c\u4e0e\u589e\u957f</p></a>`],

  'design.html': ['\u6982\u5ff5\u8bbe\u8ba1', 'design', `
  <h1 class="text-3xl font-bold text-white mb-2">\u6982\u5ff5\u8bbe\u8ba1</h1>
  <p class="spec-intro">Drift \u7684\u521b\u4f5c\u5317\u661f\uff1a\u4e00\u6b3e<strong>\u7b2c\u4e00\u4eba\u79f0\u3001\u65e0\u538b\u529b\u3001\u6cbb\u6108\u5411</strong>\u7684\u661f\u9645\u6f2b\u6e38\u3002\u73a9\u5bb6\u4e0d\u662f\u82f1\u96c4\uff0c\u800c\u662f\u5b87\u5b99\u4e2d\u7684\u65c5\u4eba\u2014\u2014\u6162\u6162\u6f02\u6d6e\uff0c\u5076\u7136\u9047\u89c1\u5fae\u5149\u4e0e\u8fdc\u65b9\u7684\u6e56\u3002</p>
  <div class="spec-vision">\u4e00\u53e5\u8bdd\uff1a\u5728\u661f\u6d77\u91cc\u6162\u6162\u6f02\u6d6e\uff0c\u5b81\u9759\u3001\u8302\u8fdc\u3001\u5076\u6709\u60ca\u559c\u3002</div>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u6838\u5fc3\u5b9a\u4f4d</h2>
  <div class="spec-design-grid">
    ${designCard('\u7c7b\u578b', 'genre', '\u7b2c\u4e00\u4eba\u79f0\u3001\u5f00\u653e\u5f0f\u6f2b\u6e38 / \u6cbb\u6108\u63a2\u7d22\u3002\u65e0\u6218\u6597\u3001\u65e0\u4efb\u52a1\u8ffd\u8d76\u3001\u65e0\u6b7b\u4ea1\u60e9\u7f5a\u3002')}
    ${designCard('\u60c5\u7eea', 'tone', '\u5b81\u9759\u3001\u5b64\u72ec\u4f46\u4e0d\u51b7\u6f20\uff1b\u5e7b\u60f3\u611f\u4e0e\u79d1\u5e7b\u611f\u5171\u5b58\uff0c\u504f\u300c\u6df1\u591c\u770b\u661f\u300d\u800c\u975e\u300c\u6218\u573a\u300d\u3002')}
    ${designCard('\u53d7\u4f17', 'audience', '\u559c\u6b22\u653e\u677e\u3001\u89c6\u89c9\u5411\u3001\u77ed\u89c6\u9891\u53ef\u5206\u4eab\u7684\u73a9\u5bb6\uff1b\u4e5f\u9002\u5408\u4f5c\u4e3a\u7761\u524d\u300c\u767d\u566a\u5f0f\u300d\u80cc\u666f\u4f53\u9a8c\u3002')}
    ${designCard('\u5bf9\u6807', 'reference', '\u300aJourney\u300b\u7684\u60c5\u7eea\u3001\u300aOuter Wilds\u300b\u7684\u597d\u5947\u3001\u300aElite Dangerous\u300b\u7684\u5b87\u5b99\u611f\uff08\u4f46\u6781\u7b80\u624b\u611f\uff09\u3002')}
  </div>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u73a9\u5bb6\u5e7b\u60f3</h2>
  <ul class="spec-checklist mb-6">
    ${item('check-done', '\u6211\u5728\u592a\u7a7a\u4e2d\u6f02\u6d6e', 'fantasy', '\u4e0d\u9700\u8981\u89e3\u91ca\u4e3a\u4ec0\u4e48\u6765\u8fd9\u91cc\uff0c\u4e5f\u4e0d\u9700\u8981\u6551\u4e16\u754c\u3002')}
    ${item('check-done', '\u901f\u5ea6\u7531\u6211\u638c\u63a7', 'agency', 'Shift \u52a0\u901f\u3001Ctrl \u51cf\u901f\u3001\u9ed8\u8ba4\u6162\u901f\u524d\u6f02\uff0c\u4ece\u4e0d\u88ab\u526f\u672c\u9a71\u8d76\u3002')}
    ${item('check-done', '\u6709\u4e1c\u897f\u503c\u5f97\u671b\u5411', 'pois.js', '\u8fdc\u5904\u884c\u661f POI + \u5bfc\u822a\u6307\u793a + Tab \u5207\u6362\u76ee\u6807\u3002')}
    ${item('check-todo', '\u7559\u4e0b\u5c5e\u4e8e\u6211\u7684\u8bb0\u5fc6', 'memory', '\u622a\u56fe\u3001\u661f\u5ea7\u89e3\u9501\u3001\u77ed\u6587\u672c\u65e5\u5fd7\uff08\u540e\u671f\uff09\u3002')}
  </ul>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u6838\u5fc3\u5faa\u73af</h2>
  <div class="spec-loop">
    <p><strong>\u8fdb\u5165</strong> \u2192 \u300c\u8fdb\u5165\u6f2b\u6e38\u300d/ Enter \u2192 \u9501\u5b9a\u6307\u9488 \u2192 \u7acb\u5373\u6f02\u6d6e\uff08\u63d0\u793a\u81ea\u52a8\u5173\u95ed\uff09</p>
    <p><strong>\u6f2b\u6e38</strong> \u2192 \u81ea\u7531\u98de\u884c\u3001\u73af\u987e\u661f\u91ce\u3001\u8c03\u6574\u901f\u5ea6\u4e0e\u9ad8\u5ea6</p>
    <p><strong>\u53d1\u73b0</strong> \u2192 \u8fdc\u5904\u661f\u4e91\u3001\u6e56\u5149\u3001\u672a\u6765 POI \u5f15\u5bfc\u524d\u5f80</p>
    <p><strong>\u505c\u7559</strong> \u2192 \u5728\u559c\u6b22\u7684\u666f\u8272\u524d\u9759\u6b62\u6216\u6162\u901f\u76d8\u65cb\uff08\u65e0\u5f3a\u5236\u76ee\u6807\uff09</p>
    <p><strong>\u79bb\u5f00</strong> \u2192 \u968f\u65f6\u53ef\u5173\u95ed\uff1b\u65e0\u6863\u6848\u538b\u529b\uff08\u540e\u671f\u53ef\u9009\u4e91\u5b58\u6863\uff09</p>
  </div>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u64cd\u4f5c\u4e0e\u624b\u611f</h2>
  <table class="spec-table">
    <thead><tr><th>\u8f93\u5165</th><th>\u884c\u4e3a</th><th>\u8bbe\u8ba1\u610f\u56fe</th></tr></thead>
    <tbody>
      <tr><td>\u9f20\u6807\u79fb\u52a8</td><td>\u73af\u987e\u89c6\u89d2</td><td>\u4f4e\u654f\u611f\u3001\u4e0d\u6655\u5934\uff0c\u53ef\u8bbe\u7f6e\u91cc\u8c03\u6574</td></tr>
      <tr><td>W / S</td><td>\u524d\u540e</td><td>\u76f8\u673a\u671d\u5411\u5e73\u79fb</td></tr>
      <tr><td>A / D</td><td>\u5de6\u53f3\u5e73\u79fb</td><td>\u7a7a\u4e2d\u300c\u6f02\u79fb\u300d\u800c\u975e\u6b65\u884c</td></tr>
      <tr><td>Q / E</td><td>\u5347\u964d</td><td>\u4e09\u7ef4\u81ea\u7531\u5ea6\uff0c\u65b9\u4fbf\u5bf9\u51c6\u661f\u5c42\u4e0e\u6e56\u9762</td></tr>
      <tr><td>Shift</td><td>\u52a0\u901f\u00d72.2</td><td>\u77ed\u65f6\u7a81\u8fdb\uff0c\u4e0d\u7834\u574f\u6cbb\u6108\u8282\u594f</td></tr>
      <tr><td>Ctrl</td><td>\u51cf\u901f\u00d70.45</td><td>\u7ec6\u770b\u666f\u8272\u3001\u62cd\u7167\u524d\u5f80</td></tr>
      <tr><td>\uff08\u65e0\u64cd\u4f5c\uff09</td><td>\u6162\u901f\u524d\u6f02</td><td>\u5373\u4f7f\u677e\u624b\u4e5f\u5728\u300c\u524d\u8fdb\u300d\uff0c\u4e0d\u4f1a\u505c\u5728\u539f\u5730</td></tr>
    </tbody>
  </table>
  <p class="spec-detail mt-4">\u79fb\u52a8\u4e0d\u505a\u771f\u5b9e\u7269\u7406\u52a0\u901f\uff1b\u901f\u5ea6\u5373\u65f6\u54cd\u5e94\u952e\u4f4d\uff0c\u907f\u514d\u201c\u6c34\u6ce5\u201d\u611f\u3002\u672a\u6765\u52a0\u955c\u5934\u60ac\u6ed1\u4e0e\u8f7b\u5fae FOV \u53d8\u5316\uff08Phase 1\uff09\u3002</p>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u89c6\u89c9\u8bed\u8a00</h2>
  <p class="spec-intro">\u73b0\u4ee3\u539f\u578b\u5df2\u5b9e\u73b0\u4e09\u5c42\u661f\u7c92\u5b50\u3001\u8fdc\u666f\u661f\u4e91\u3001\u524d\u65b9\u6e56\u9762 shader\uff1b\u8272\u76f8\u7edf\u4e00\u4e3a\u6df1\u84dd\u591c\u7a7a\u3002</p>
  <div class="spec-palette" aria-label="\u8272\u76d8">
    ${swatch('#030810', '\u80cc\u666f')}
    ${swatch('#061428', '\u8868\u9762')}
    ${swatch('#6eb8e8', '\u6e56\u5149')}
    ${swatch('#c8dcff', '\u661f\u70b9')}
    ${swatch('#ffe066', '\u5f3a\u8c03')}
  </div>
  <div class="spec-design-grid">
    ${designCard('\u661f\u91ce\u5c42\u6b21', 'stars', '\u8fd1 / \u4e2d / \u8fdc\u4e09\u5c42\u7c92\u5b50\uff1a\u8d8a\u8fd1\u8d8a\u5bc6\u3001\u8d8a\u5c0f\u8d8a\u4eae\u3002\u65e0\u9650\u5411\u524d\u6f14\u751f\uff0c\u7a7f\u8fc7\u76f8\u673a\u540e\u56de\u6536\u5230\u524d\u65b9\u3002')}
    ${designCard('\u661f\u4e91', 'nebula', '\u5927\u9762\u7247\u4f4e\u900f\u660e\u84dd\u8272\uff0c\u6162\u901f\u6f02\u79fb\uff0c\u589e\u52a0\u7a7a\u95f4\u6df1\u5ea6\u4e0d\u62a2\u620f\u3002')}
    ${designCard('\u8fdc\u65b9\u6e56', 'lake', 'Shader \u6ce2\u7eb9 + \u8fb9\u7f18\u9ad8\u5149\uff1b\u4f4d\u4e8e\u524d\u4e0b\u65b9\uff0c\u50cf\u300c\u5b87\u5b99\u91cc\u7684\u4e00\u7247\u9759\u6c34\u300d\u3002')}
    ${designCard('\u96fe', 'fog', 'Exp2 \u6df1\u84dd\u96fe\uff0c\u8fdc\u5904\u661f\u70b9\u6de1\u5316\uff0c\u9690\u85cf\u8fb9\u754c\u3002')}
    ${designCard('\u540e\u5904\u7406\uff08\u8ba1\u5212\uff09', 'post', 'Bloom \u8f6f\u5149\u3001\u8f7b\u5fae\u6697\u89d2\u3001\u8272\u8c03\u538b\u5236\uff0c\u907f\u514d\u8fc7\u66dd\u3002')}
  </div>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u97f3\u9891\u65b9\u5411</h2>
  <div class="spec-design-grid">
    ${designCard('\u73af\u5883\u97f3', 'ambience', '\u6781\u4f4e\u97f3\u5b87\u5b99\u5e95\u566a\u3001\u7a7a\u6c14\u611f\u767d\u566a\uff0c\u5faa\u73af\u65e0\u7a81\u51fb\u3002')}
    ${designCard('\u97f3\u4e50', 'OST', '2\u20133 \u9996\u6cbb\u6108\u5411\u4e3b\u9898\uff1c\u94a2\u7434 + \u5408\u6210\u5668\u94c1\u5e8a\u300b\uff0c\u5f00\u573a\u5b81\u9759\u3001\u63a2\u7d22\u65f6\u6e10\u5f3a\u3002')}
    ${designCard('\u4ea4\u4e92\u97f3', 'sfx', '\u6781\u5c11\uff1b\u53ef\u9009\uff1a\u8fdb\u5165 POI \u65f6\u7684\u67d4\u548c\u94c3\u97f3\u3001\u52a0\u901f\u65f6\u7684\u7a7a\u6c14\u6469\u64e6\u3002')}
  </div>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u4e16\u754c\u4e0e\u53d9\u4e8b</h2>
  <p class="spec-intro">\u4e0d\u505a\u5e9e\u5927\u5267\u60c5\uff1b\u7528\u73af\u5883\u548c\u6781\u77ed\u6587\u672c\u7247\u6bb5\u6316\u6398\u300c\u66fe\u7ecf\u6709\u8fc7\u7684\u6587\u660e\u300d\u3002</p>
  <div class="spec-design-grid">
    ${designCard('\u661f\u7cfb', 'sectors', '\u65e0\u9650\u6f14\u751f\u661f\u533a\uff0c\u6bcf\u4e2a\u533a\u57df\u6709\u5fae\u5dee\u5bc6\u5ea6\u4e0e\u8272\u6e29\uff0c\u4e0d\u9700\u624b\u5de5\u5851\u9020\u6574\u5f20\u5730\u56fe\u3002')}
    ${designCard('\u884c\u661f POI', 'planets', '\u8fdc\u5904\u53ef\u89c1\u5149\u70b9\uff1b\u63a5\u8fd1\u540e\u663e\u793a\u7b80\u77ed\u540d\u79f0\u4e0e\u8f7b\u91cf\u63cf\u8ff0\uff08\u5982\u300c\u84dd\u8272\u51bb\u7ed3\u6d77\u300d\u300c\u73af\u72b6\u6c99\u5c98\u300d\uff09\u3002')}
    ${designCard('\u9057\u8ff9', 'relics', '\u5b87\u822a\u7ad9\u3001\u6d6e\u52a8\u5e7f\u7891\u3001\u65e0\u4eba\u4fe1\u6807\uff1b\u89e6\u53d1\u4e00\u53e5\u8bd1\u6587\u3002')}
    ${designCard('\u661f\u95e8', 'wormhole', '\u89c6\u89c9\u5947\u89c2\uff0c\u7528\u4e8e\u533a\u57df\u8df3\u8dc3\uff0c\u4e0d\u89e3\u91ca\u7269\u7406\u539f\u7406\u3002')}
    ${designCard('\u661f\u5ea7', 'constellation', '\u7eaf\u88c5\u9970\u6216\u8fde\u7ebf\u89e3\u9501\uff0c\u53ef\u4e0e\u73a9\u5bb6\u81ea\u5b9a\u4e49\u6807\u8bb0\u7ed3\u5408\u3002')}
  </div>
  <div class="spec-vision mt-4">\u53d9\u4e8b\u539f\u5219\uff1a\u4e0d\u56de\u7b54\u300c\u8c01\u5efa\u7684\u300d\uff0c\u53ea\u7559\u4e0b\u300c\u66fe\u7ecf\u6709\u8fc7\u4eba\u300d\u7684\u75db\u610f\u3002</div>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">UI \u4e0e\u4ea4\u4e92</h2>
  <ul class="spec-checklist">
    ${item('check-done', '\u6781\u7b80 HUD', 'index.html', '\u9876\u90e8\uff1a\u901f\u5ea6 / \u9ad8\u5ea6\uff1b\u5e95\u90e8\uff1a\u9879\u76ee Spec \u94fe\u63a5\u3002')}
    ${item('check-done', '\u8fdb\u5165\u63d0\u793a', 'prompt', '\u300c\u8fdb\u5165\u6f2b\u6e38\u300d\u6309\u94ae + Enter\uff1b\u8fdb\u5165\u540e\u5f39\u7a97\u5b8c\u5168\u5173\u95ed\u3002')}
    ${item('check-done', '\u622a\u56fe\u6a21\u5f0f', 'photo', 'P \u952e\u9690\u85cf UI\uff0c\u518d\u6309 P \u9000\u51fa\u3002')}
    ${item('check-done', '\u8bbe\u7f6e\u9762\u677f', 'settings', 'Esc \u6253\u5f00\uff1b\u7075\u654f\u5ea6\u3001\u901f\u5ea6\u3001\u51cf\u52a8\u6548\u3001\u67d4\u5149\u3002')}
    ${item('check-todo', '\u622a\u56fe\u6a21\u5f0f', 'photo', '\u9690\u85cf UI\u3001\u81ea\u7531\u89c6\u89d2\u3001\u53ef\u9009\u6df1\u573a\u865a\u5316\u3002')}
  </ul>

  <h2 class="text-lg text-amber-300 mb-3 mt-8">\u6211\u4eec\u4e0d\u505a\u4ec0\u4e48</h2>
  <ul class="spec-checklist">
    ${item('check-todo', '\u6218\u6597\u4e0e\u751f\u5b58', 'anti', '\u65e0\u654c\u4eba\u3001\u65e0\u8840\u91cf\u3001\u65e0\u8d44\u6e90\u6536\u96c6\u538b\u529b\u3002')}
    ${item('check-todo', '\u4efb\u52a1\u8ffd\u8d76', 'anti', '\u65e0\u4e3b\u7ebf\u4efb\u52a1\u5217\u8868\u3001\u65e0\u5012\u8ba1\u65f6\u3001\u65e0\u6bcf\u65e5\u7b7e\u5230\u3002')}
    ${item('check-todo', '\u590d\u6742\u7ecf\u6d4e', 'anti', '\u65e0\u8d27\u5e01\u3001\u65e0\u62bd\u5361\u3001\u65e0\u5185\u8d2d\u7834\u574f\u6c1b\u56f4\u3002')}
    ${item('check-todo', '\u5f3a\u5236\u6559\u5b66', 'anti', '\u6559\u7a0b\u4ec5\u4e00\u5c4f\u63d0\u793a\uff0c\u4e4b\u540e\u5168\u90e8\u9760\u63a2\u7d22\u3002')}
  </ul>

  <h2 class="text-lg text-teal-300 mb-3 mt-8">\u4e0e\u9636\u6bb5\u89c4\u5212\u7684\u5173\u7cfb</h2>
  <p class="spec-detail">\u672c\u9875\u4e3a\u300c\u505a\u4ec0\u4e48\u6e38\u620f\u300d\u7684\u5317\u661f\uff1b<a class="text-lake hover:underline" href="index.html">\u603b\u89c8</a> \u4e0e Phase 0\u20135 \u4e3a\u300c\u600e\u4e48\u505a\u51fa\u6765\u300d\u7684\u5de5\u7a0b\u6e05\u5355\u3002\u89c6\u89c9\u843d\u5730\u89c1 Phase 1\uff0c\u4e16\u754c\u6269\u5c55\u89c1 Phase 2\uff0c\u58f0\u97f3\u4e0e\u6587\u672c\u89c1 Phase 3\u3002</p>`],

  'phase-0-foundation.html': ['Phase 0 \u57fa\u7840\u9a8c\u8bc1', 'p0', `
  <h1 class="text-3xl font-bold text-white mb-2">Phase 0 \u57fa\u7840\u9a8c\u8bc1</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u8bc1\u660e\u300c\u7b2c\u4e00\u4eba\u661f\u9645\u6f2b\u6e38\u300d\u5728\u6d4f\u89c8\u5668\u53ef\u7a33\u5b9a\u8dd1\u901a\uff0c\u5e76\u5efa\u7acb\u6027\u80fd\u4e0e\u4ee3\u7801\u67b6\u6784\u3002</p>
  <p class="text-slate-400 mb-4">12/12 \u00b7 100%</p>${pb(100)}
  <h2 class="text-lg text-teal-300 mb-3">\u5df2\u5b8c\u6210</h2>
  <ul class="spec-checklist">
    ${item('check-done', 'WebGL \u6f2b\u6e38\u539f\u578b', 'src/game.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u4e09\u5c42\u661f\u7c92\u5b50\u3001\u661f\u4e91\u3001\u8fdc\u65b9\u6e56\u9762 shader\u3002')}
    ${item('check-done', '\u7b2c\u4e00\u4eba\u6447\u6746 + WASD', 'game.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Pointer Lock \u73af\u987e\u3001\u516d\u5411\u79fb\u52a8\u3001\u9ed8\u8ba4\u6162\u901f\u524d\u6f02\u3002')}
    ${item('check-done', '\u672c\u5730\u670d\u52a1', 'serve.mjs', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>node serve.mjs \u5373\u53ef\u8dd1\uff0c\u65e0\u6784\u5efa\u3002')}
    ${item('check-done', 'Docker \u53ef\u9009', 'docker-compose.yml', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u5bb9\u5668\u5185\u4e00\u952e\u9884\u89c8\u3002')}
    ${item('check-done', 'Spec \u6587\u6863\u76ee\u5f55', '.SPEC/', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u957f\u8fdc\u8ba1\u5212\u4e0e\u9636\u6bb5\u6e05\u5355\u3002')}
    ${item('check-done', '\u6027\u80fd\u57fa\u7ebf\u6d4b\u8bd5', 'docs/PERFORMANCE.md', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>FPS HUD \u4e0e\u4f4e\u5e27\u8bb0\u5f55\u3001\u672c\u5730\u57fa\u7ebf\u6587\u6863\u3002')}
    ${item('check-done', '\u79fb\u52a8\u7aef\u89e6\u63a7', 'touch.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u5de6\u4e0b\u865a\u62df\u6447\u6746 + \u53f3\u4fa7\u62d6\u52a8\u89c6\u89d2\u3002')}
    ${item('check-done', '\u661f\u7c92\u65e0\u7f1d\u5faa\u73af', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u56de\u6536 + \u8f7b\u5fae\u95ea\u70c1\u3002')}
    ${item('check-done', '\u4ee3\u7801\u6a21\u5757\u5316', 'src/', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u591a\u6a21\u5757\u67b6\u6784\uff08world / input / nav \u7b49\uff09\u3002')}
    ${item('check-done', 'CI \u81ea\u52a8\u90e8\u7f72', 'GitHub Actions', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Pages \u90e8\u7f72 + \u5355\u6d4b\u6b65\u9aa4\u3002')}
    ${item('check-done', '\u5355\u5143\u6d4b\u8bd5\u6846\u67b6', 'vitest', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>settings / util \u6d4b\u8bd5\uff0c<code>npm test</code>\u3002')}
    ${item('check-done', '\u9519\u8bef\u76d1\u63a7', 'monitor.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>WebGL \u5931\u8d25\u9875\u3001\u4e0a\u4e0b\u6587\u4e22\u5931\u3001\u4f4e FPS \u65e5\u5fd7\u3002')}
  </ul>`],

  'phase-1-core.html': ['Phase 1 \u6838\u5fc3\u4f53\u9a8c', 'p1', `
  <h1 class="text-3xl font-bold text-white mb-2">Phase 1 \u6838\u5fc3\u4f53\u9a8c</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u8ba9\u73a9\u5bb6\u611f\u5230\u300c\u771f\u7684\u5728\u592a\u7a7a\u6f38\u6e38\u300d\u2014\u2014\u624b\u611f\u987a\u3001\u753b\u9762\u7f8e\u3001\u4e0d\u6655\u4e0d\u5361\u3002</p>
  <p class="text-slate-400 mb-4">15/15 \u00b7 100%</p>${pb(100)}
  <h2 class="text-lg text-teal-300 mb-3">\u5df2\u5b8c\u6210</h2>
  <ul class="spec-checklist mb-6">
    ${item('check-done', '\u57fa\u7840\u98de\u884c\u901f\u5ea6\u66f2\u7ebf', 'input.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Shift \u52a0\u901f\u3001Ctrl \u51cf\u901f\u3001\u9ed8\u8ba4\u6162\u6f02\u3002')}
    ${item('check-done', '\u7edf\u4e00\u6df1\u84dd\u8272\u76f8', 'renderer + UI', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>#030810 \u4e3b\u8272\u4e0e\u6e56\u5149\u70b9\u7f00\u3002')}
    ${item('check-done', '\u8bbe\u7f6e\u9762\u677f', 'index.html', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Esc \u6253\u5f00\uff1b\u7075\u654f\u5ea6\u3001\u901f\u5ea6\u3001\u51cf\u52a8\u6548\u3001\u67d4\u5149\uff1b localStorage \u6301\u4e45\u5316\u3002')}
    ${item('check-done', '\u955c\u5934 FOV \u4e0e\u901f\u5ea6\u60ac\u6ed1', 'input.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Shift \u65f6 FOV \u5fae\u5f35\u3001\u901f\u5ea6\u663e\u793a\u63d2\u503c\u3002')}
    ${item('check-done', '\u51cf\u52a8\u6548\u6a21\u5f0f', 'settings', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u51cf\u5c11\u7c92\u5b50\u4e0e\u661f\u4e91\u6447\u6446\u3002')}
    ${item('check-done', '\u67d4\u5149\u589e\u5f3a', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u6750\u8d28\u67d4\u5149 + \u753b\u8d28\u6863\u4f4d\u3002')}
    ${item('check-done', '\u52a8\u6001\u971c\u6548', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u96fe\u5bc6\u5ea6\u968f\u65f6\u95f4\u6162\u53d8\u3002')}
    ${item('check-done', '\u78c1\u573a\u661f\u5e26', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u661f\u5c18\u5e26\u7c92\u5b50\u73af\u7ed5\u76f8\u673a\u3002')}
    ${item('check-done', '\u6447\u6746 UI', 'touch.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u89e6\u5c4f\u865a\u62df\u6447\u6746\u4e0e\u89c6\u89d2\u533a\u3002')}
    ${item('check-done', '\u5c4f\u5e55\u906e\u5c4f', 'vignette', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u8bbe\u7f6e\u53ef\u5f00\u5173\u7535\u5f71\u6697\u89d2\u3002')}
    ${item('check-done', '\u622a\u56fe\u6a21\u5f0f', 'P key', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u9690\u85cf HUD \u4e0e\u63d0\u793a\u3002')}
    ${item('check-done', '\u52a0\u8f7d\u5c4f', 'loading', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u300c\u6b63\u5728\u82cf\u9192\u300d\u8fc7\u6e21 + \u661f\u91ce\u53ef\u89c1\u3002')}
    ${item('check-done', 'LOD \u661f\u7c92', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u8fdc\u5c42\u661f\u70b9\u968f\u6df1\u5ea6\u7f29\u653e\u3002')}
    ${item('check-done', '\u624b\u67b4\u652f\u6301', 'gamepad.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u53cc\u6447\u6746\u79fb\u52a8\u4e0e\u89c6\u89d2\u3002')}
    ${item('check-done', '\u753b\u8d28\u5206\u6863', 'settings', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u4f4e / \u4e2d / \u9ad8\u4e09\u6863\u7c92\u5b50\u4e0e\u5206\u8fa8\u7387\u3002')}
    ${item('check-done', 'Bloom / \u6652\u5149', 'postprocess.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>EffectComposer + UnrealBloomPass\uff0c\u8ddf\u67d4\u5149\u5f00\u5173\u8054\u52a8\u3002')}
    ${item('check-done', '\u78b0\u649e\u4f53\u79ef\u5c0f\u661f', 'collectibles.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u5fae\u5149\u6536\u96c6\uff0c\u8bbe\u7f6e\u53ef\u5173\uff0c\u65e0\u4efb\u52a1\u538b\u529b\u3002')}
  </ul>`],

  'phase-2-world.html': ['Phase 2 \u4e16\u754c\u5185\u5bb9', 'p2', `
  <h1 class="text-3xl font-bold text-white mb-2">Phase 2 \u4e16\u754c\u5185\u5bb9</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u4ece\u300c\u7a7a\u7a4f\u666f\u300d\u8fdb\u5316\u4e3a\u300c\u53ef\u63a2\u7d22\u7684\u661f\u7cfb\u300d\u2014\u2014\u6709\u65b9\u5411\u3001\u6709\u76ee\u6807\u3001\u6709\u56de\u5fc6\u3002</p>
  <p class="text-slate-400 mb-4">10/18 \u00b7 56%</p>${pb(56)}
  <h2 class="text-lg text-teal-300 mb-3">\u5df2\u5b8c\u6210</h2>
  <ul class="spec-checklist mb-6">
    ${item('check-done', '\u884c\u661f POI', 'pois.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>5 \u79cd\u7a0b\u5e8f\u5316\u884c\u661f\uff0c\u56de\u6536\u6f14\u751f\u3002')}
    ${item('check-done', '\u5bfc\u822a\u4e0e\u8ddd\u79bb', 'nav.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>HUD \u76ee\u6807/\u8ddd\u79bb\u3001\u8fb9\u7f18\u6307\u793a\u70b9\u3001Tab \u5207\u6362\u3002')}
    ${item('check-done', 'POI \u8bd1\u6587', 'pois.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u9760\u8fd1\u65f6\u663e\u793a\u6781\u77ed\u6587\u672c\u3002')}
    ${item('check-done', '\u661f\u7cfb\u5206\u533a', 'world/streaming', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>POI\u3001\u661f\u7c92\u3001\u9057\u8ff9\u968f\u76f8\u673a\u6f14\u751f\u3002')}
    ${item('check-done', '\u5b87\u822a\u7ad9\u9057\u8ff9', 'stations.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u6d6e\u52a8\u5e7f\u7891\u4e0e\u4fe1\u6807\u706f\u3002')}
    ${item('check-done', '\u661f\u95e8 / \u8df3\u8dc3\u70b9', 'wormhole.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u63a5\u8fd1\u6298\u8dc3\u81f3\u65b0\u533a\u57df\u3002')}
    ${item('check-done', '\u5b9a\u5236\u661f\u5ea7', 'constellation.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>POI \u95f4\u88c5\u9970\u8fde\u7ebf\u3002')}
    ${item('check-done', '\u65e5\u66ae\u5faa\u73af', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u96fe\u4e0e\u80cc\u666f\u8272\u6162\u53d8\u3002')}
    ${item('check-done', '\u5730\u5f62\u6e56\u9762\u6269\u5c55', 'world.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u53cc\u5c42\u6e56\u9762\u3001\u65e5\u66ae/\u5b63\u8282\u8272\u76f8\u3001\u53ef\u5173\u95ed\uff1b\u5e73\u89c6\u65f6\u67d4\u5316\u65e0\u5730\u5e73\u7ebf\u3002')}
  </ul>`],

  'phase-3-atmosphere.html': ['Phase 3 \u6c1b\u56f4\u53d9\u4e8b', 'p3', `
  <h1 class="text-3xl font-bold text-white mb-2">Phase 3 \u6c1b\u56f4\u4e0e\u53d9\u4e8b</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u7528\u58f0\u97f3\u4e0e\u6587\u5b57\u628a\u300c\u6f02\u6d6e\u300d\u8bb0\u5728\u5fc3\u91cc\u2014\u2014\u8ba9\u4eba\u613f\u610f\u5f00\u7740\u97f3\u4e50\u53d1\u5446\u3002</p>
  <p class="text-slate-400 mb-4">6/14 \u00b7 43%</p>${pb(43)}
  <h2 class="text-lg text-teal-300 mb-3">\u5df2\u5b8c\u6210</h2>
  <ul class="spec-checklist mb-6">
    ${item('check-done', '\u73af\u5883\u97f3', 'audio.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Web Audio \u5e95\u566a + \u4f4e\u9891\uff1b\u8bbe\u7f6e\u53ef\u5173\u95ed\u3002')}
    ${item('check-done', '\u6587\u672c\u544a\u793a', 'lore', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>POI \u4e0e\u661f\u95e8\u89e6\u53d1\u6781\u77ed\u8bd1\u6587\u3002')}
    ${item('check-done', '\u52a8\u6001\u97f3\u4e50', 'audio.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u7a0b\u5e8f\u5316\u548c\u58f0\u5c42\uff08\u53cc\u632f\u8361\u5668\uff09\uff0c\u8bbe\u7f6e\u53ef\u5173\u3002')}
    ${item('check-done', '\u60c5\u7eea\u66f2\u7ebf', 'audio.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u5b81\u9759\u5f00\u573a \u2192 \u79fb\u52a8\u4e0a\u626c \u2192 \u4e45\u6f02\u6536\u675f\u3002')}
    ${item('check-done', '\u8bed\u97f3\u5316', 'narration-web.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u8bbe\u7f6e\u53ef\u5f00\u542f\u6d4f\u89c8\u5668 TTS \u6717\u8bfb\u544a\u793a\u6587\u672c\u3002')}
  </ul>`],

  'phase-4-platform.html': ['Phase 4 \u5e73\u53f0\u5927\u4f5c', 'p4', `
  <h1 class="text-3xl font-bold text-white mb-2">Phase 4 \u5e73\u53f0\u5927\u4f5c\u5316</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u4ece Web \u539f\u578b\u5347\u7ea7\u4e3a\u53ef\u53d1\u5e03\u7684\u591a\u5e73\u53f0\u4f5c\u54c1\uff08Unity / \u79fb\u52a8\u7aef\u4f18\u5148\uff09\u3002</p>
  <p class="text-slate-400 mb-4">4/16 \u00b7 25%</p>${pb(25)}
  <h2 class="text-lg text-teal-300 mb-3">\u5df2\u5b8c\u6210\uff08Web \u539f\u578b\u8303\u56f4\uff09</h2>
  <ul class="spec-checklist mb-6">
    ${item('check-done', '\u79fb\u52a8\u7aef\u89e6\u63a7', 'touch.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u865a\u62df\u6447\u6746 + \u89c6\u89d2\u533a\uff08Web \u7248\u5148\u884c\u3002')}
    ${item('check-done', '\u672c\u5730\u6863\u5b58', 'progress.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u6f2b\u6e38\u7edf\u8ba1\u3001JSON \u5bfc\u51fa/\u5bfc\u5165\uff1b\u4e91\u540c\u6b65\u5f85\u540e\u7eed\u3002')}
    ${item('check-done', '\u79bb\u7ebf PWA', 'sw.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>Service Worker \u7f13\u5b58\u6838\u5fc3\u8d44\u6e90\uff0c\u652f\u6301\u79bb\u7ebf\u542f\u52a8\u3002')}
    ${item('check-done', '\u6210\u5c31\u7cfb\u7edf\u9884\u7814', 'achievements.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>7 \u9879\u672c\u5730\u6210\u5c31\uff0c\u6863\u6848\u53ef\u5bfc\u51fa\uff08Steam \u524d\u7f6e\u3002')}
  </ul>
  <h2 class="text-lg text-amber-300 mb-3">\u5f85\u529e</h2>
  <ul class="spec-checklist">
    ${item('check-todo', 'Unity \u5de5\u7a0b\u91cd\u6784', 'unity/', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>3D \u7b2c\u4e00\u4eba\u98de\u884c\u4e0e\u573a\u666f\u6d41\u5f0f\u52a0\u8f7d\u3002')}
    ${item('check-todo', 'Android / iOS \u539f\u751f\u5305', 'mobile', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>Capacitor / Tauri \u7b49\u6253\u5305\u4e0e\u5e94\u7528\u5e97\u3002')}
    ${item('check-todo', '\u4e91\u6863\u5b58', 'save', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>\u8d26\u53f7\u4e0e\u670d\u52a1\u7aef\u540c\u6b65\u3002')}
    ${item('check-todo', 'Steam \u6280\u672f\u9884\u7814', 'steam', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>Steamworks SDK \u96c6\u6210\u4e0e\u4e91\u5b58\u6863\u3002')}
  </ul>`],

  'phase-5-launch.html': ['Phase 5 \u53d1\u884c\u589e\u957f', 'p5', `
  <h1 class="text-3xl font-bold text-white mb-2">Phase 5 \u53d1\u884c\u4e0e\u589e\u957f</h1>
  <p class="spec-intro">\u76ee\u6807\uff1a\u8ba9\u66f4\u591a\u4eba\u77e5\u9053 Drift\uff0c\u5e76\u5efa\u7acb\u6301\u7eed\u8fed\u4ee3\u7684\u793e\u533a\u3002</p>
  <p class="text-slate-400 mb-4">2/14 \u00b7 14%</p>${pb(14)}
  <h2 class="text-lg text-teal-300 mb-3">\u5df2\u5b8c\u6210\uff08Web \u539f\u578b\u8303\u56f4\uff09</h2>
  <ul class="spec-checklist mb-6">
    ${item('check-done', '\u6570\u636e\u5206\u6790', 'analytics.js', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u672c\u5730\u4f1a\u8bdd\u6570\u3001\u5747\u65f6\u3001\u70ed\u95e8 POI\uff1b\u968f\u6863\u6848\u5bfc\u51fa\u3002')}
    ${item('check-done', '\u66f4\u65b0\u65e5\u5fd7', 'CHANGELOG.md', '<strong>\u505a\u4e86\u4ec0\u4e48\uff1a</strong>\u7248\u672c\u8bb0\u5f55\u4e0e\u793e\u533a\u901a\u544a\u57fa\u7840\u3002')}
  </ul>
  <h2 class="text-lg text-amber-300 mb-3">\u5f85\u529e</h2>
  <ul class="spec-checklist">
    ${item('check-todo', '\u5ba3\u4f20\u7247', 'trailer', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>60\u201390 \u79d2\u6cbb\u6108\u5411\u5ba3\u4f20\u3002')}
    ${item('check-todo', 'Steam \u4e0a\u67b6', 'store', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>\u9875\u9762\u3001\u622a\u56fe\u3001\u5b9a\u4ef7\u7b56\u7565\u3002')}
    ${item('check-todo', '\u79fb\u52a8\u5e94\u7528\u5e97', 'mobile store', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>iOS / Android \u53d1\u5e03\u3002')}
    ${item('check-todo', 'Discord / \u793e\u533a', 'community', '<strong>\u8fd8\u5dee\u4ec0\u4e48\uff1a</strong>Discord \u670d\u52a1\u5668\u4e0e\u73a9\u5bb6\u53cd\u9988\u6e20\u9053\u3002')}
  </ul>`],
}

for (const [name, [title, active, body]] of Object.entries(pages)) {
  const html = wrap(title, active, body)
  fs.writeFileSync(path.join(dir, name), html, 'utf8')
  console.log('ok', name)
}
