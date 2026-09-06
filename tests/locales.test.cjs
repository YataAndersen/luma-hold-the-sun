'use strict';

// Run: node --test "LUMA - PROJETO PRINCIPAL/tests/locales.test.cjs"
// Guards the translation dictionaries in the shipped HTML: every language must
// answer for every line the game can show, and must be reachable in the picker.
// pt-BR is the reference set because it was the first full translation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const source = fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');

function between(start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `Missing production declaration: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Missing end of production declaration: ${start}`);
  return source.slice(from, to + end.length);
}

const context = vm.createContext({});
vm.runInContext([
  between('  const LOCALE_NAMES = {', '\n'),
  between('  const LOCALES = {', '\n  };'),
  'globalThis.names = LOCALE_NAMES; globalThis.dicts = LOCALES;',
].join('\n'), context, { filename: htmlPath });

const { names, dicts } = context;
const reference = Object.keys(dicts['pt-BR']);

test('the reference language still carries the whole game', () => {
  assert.ok(reference.length > 200, `pt-BR shrank to ${reference.length} keys`);
});

test('english is the identity locale, not a dictionary to maintain', () => {
  assert.equal(dicts.en, null, 'English must stay null: the keys are the English text');
});

for (const code of Object.keys(dicts)) {
  if (!dicts[code]) continue;

  test(`${code} covers every line the game can show`, () => {
    const missing = reference.filter(key => !(key in dicts[code]));
    assert.equal(missing.length, 0,
      `${code} is missing ${missing.length} lines, starting with: ${missing.slice(0, 5).join(' / ')}`);
  });

  test(`${code} has no orphan keys`, () => {
    const orphans = Object.keys(dicts[code]).filter(key => !reference.includes(key));
    assert.equal(orphans.length, 0,
      `${code} translates ${orphans.length} lines the game no longer shows: ${orphans.slice(0, 5).join(' / ')}`);
  });

  test(`${code} keeps every {n} placeholder its pattern needs`, () => {
    const broken = reference
      .filter(key => key.includes('{n}'))
      .filter(key => (key.match(/\{n\}/g) || []).length !== (dicts[code][key].match(/\{n\}/g) || []).length);
    assert.equal(broken.length, 0,
      `${code} would print the wrong numbers in: ${broken.join(' / ')}`);
  });

  test(`${code} left nothing untranslated by accident`, () => {
    // A handful of words are legitimately identical across languages (proper
    // nouns, "audio"). More than a few means a dictionary was pasted half-done.
    const identical = reference.filter(key => dicts[code][key] === key);
    assert.ok(identical.length < 12,
      `${code} repeats the English text ${identical.length} times: ${identical.slice(0, 8).join(' / ')}`);
  });
}

test('every language is offered in the picker', () => {
  const hidden = Object.keys(dicts).filter(code => !names[code]);
  assert.equal(hidden.length, 0, `Languages exist but cannot be chosen: ${hidden.join(', ')}`);
});

test('the picker offers no language the game cannot speak', () => {
  const phantom = Object.keys(names).filter(code => !(code in dicts));
  assert.equal(phantom.length, 0, `Picker offers languages with no dictionary: ${phantom.join(', ')}`);
});
