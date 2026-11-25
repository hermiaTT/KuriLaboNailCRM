const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

// Run the shared TypeScript and web presentation components without a browser or extra test dependencies.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    module._compile(output.outputText, filename);
  };
}
const i18n = require('../shared/i18n/core.ts');
const dictionary = require('../shared/i18n/zh-CN.json');

test('switches both directions, formats dynamic text and preserves unknown user content', () => {
  i18n.setLanguage('en');
  assert.equal(i18n.t('Save changes'), 'Save changes');
  i18n.setLanguage('zh-CN');
  assert.equal(i18n.t('Save changes'), '\u4fdd\u5b58\u66f4\u6539');
  assert.equal(i18n.t('{count} pending', { count: 3 }), '3\u4e2a\u5f85\u786e\u8ba4');
  assert.equal(i18n.t('A custom client note'), 'A custom client note');
  assert.equal(i18n.getLocale(), 'zh-CN');
  assert.deepEqual(i18n.weekDayLabels(true), ['\u4e00','\u4e8c','\u4e09','\u56db','\u4e94','\u516d','\u65e5']);
  i18n.setLanguage('en');
  assert.equal(i18n.t('Save changes'), 'Save changes');
  assert.equal(i18n.getLocale(), 'en-US');
});

test('notifies subscribers only when language changes and allows cleanup', () => {
  let count = 0;
  const stop = i18n.subscribeLanguage(() => count++);
  i18n.setLanguage('zh-CN');
  i18n.setLanguage('zh-CN');
  assert.equal(count, 1);
  stop();
  i18n.setLanguage('en');
  assert.equal(count, 1);
});

test('notification translation preserves service names and duration formatting follows language', () => {
  i18n.setLanguage('zh-CN');
  assert.equal(i18n.notificationMessage('A client requested Custom gel.'), '\u6709\u5ba2\u6237\u7533\u8bf7\u9884\u7ea6Custom gel\u3002');
  assert.equal(
    i18n.notificationMessage('Amy registered and was automatically linked to Salon Amy.'),
    'Amy \u5df2\u6ce8\u518c\uff0c\u5e76\u5df2\u81ea\u52a8\u5173\u8054\u5230 Salon Amy\u3002',
  );
  assert.equal(
    i18n.notificationMessage('Amy registered. Review the client profile and merge it with an existing record if needed.'),
    'Amy \u5df2\u6ce8\u518c\u3002\u8bf7\u68c0\u67e5\u5ba2\u6237\u6863\u6848\uff0c\u5e76\u5728\u9700\u8981\u65f6\u4e0e\u5df2\u6709\u6863\u6848\u5408\u5e76\u3002',
  );
  assert.equal(i18n.notificationMessage('An unknown message'), 'An unknown message');
  assert.equal(i18n.formatDuration(90), '90\u5206\u949f');
  assert.equal(i18n.formatDuration(120), '2\u5c0f\u65f6');
});

test('all translations preserve their interpolation fields', () => {
  const fields = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [english, chinese] of Object.entries(dictionary)) {
    assert.deepEqual(fields(chinese), fields(english), english);
    assert.ok(chinese.trim(), english);
  }
});

test('status components translate display text while retaining machine status CSS and user titles', () => {
  const React = require('../web/node_modules/react');
  const { renderToStaticMarkup } = require('../web/node_modules/react-dom/server');
  const { StatusBadge, PageHeading } = require('../web/src/components/UI.tsx');
  i18n.setLanguage('zh-CN');
  const chinese = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'CONFIRMED' }));
  assert.match(chinese, /status-confirmed/);
  assert.match(chinese, /\u5df2\u786e\u8ba4/);
  assert.match(renderToStaticMarkup(React.createElement(PageHeading, { title: 'Home', eyebrow: 'My custom title' })), /<h1>Home<\/h1>/);
  i18n.setLanguage('en');
  assert.match(renderToStaticMarkup(React.createElement(StatusBadge, { status: 'CONFIRMED' })), />confirmed<\/span>/);
});

test('every literal translation key used by the clients exists in the shared dictionary', () => {
  const roots = ['app', 'components', 'web/src'];
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) { walk(filename); continue; }
      if (!/\.(tsx|ts)$/.test(filename)) continue;
      const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && ts.isStringLiteral(node.arguments[0])) {
          assert.ok(Object.hasOwn(dictionary, node.arguments[0].text), `${filename}: ${node.arguments[0].text}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  roots.forEach(walk);
});

test('a successful HTTP response must acknowledge the chosen account language', () => {
  i18n.setLanguage('en');
  for (const response of [{}, { preferredLanguage: 'en' }, { preferredLanguage: 'zh' }]) {
    assert.equal(i18n.isLanguageSaved(response, 'zh-CN'), false);
  }
  assert.equal(i18n.getLanguage(), 'en');
  assert.equal(i18n.isLanguageSaved({ preferredLanguage: 'zh-CN' }, 'zh-CN'), true);
  assert.equal(i18n.isLanguageSaved({ preferredLanguage: 'en' }, 'en'), true);
  assert.equal(i18n.isLanguageSaved({ preferredLanguage: 'fr' }, 'fr'), false);
});
