import fs from 'fs';
import glob from 'glob-fs';

import assert from 'assert';

import replaceMatching from '../lib/replace-matching';
import renderHamlJSX from '../lib/haml-jsx';

describe('Replace Matching', () => {
  const string = "xy: {a {b} {c}} z: {d {}}"
  let replace

  it('should replace outer matches', () => {
    const options = {open: '{', close: '}'}

    replace = replaceMatching("nothing", options, () => 'hi');
    assert.equal(replace, 'nothing');

    replace = replaceMatching(string, options, () => 'hi');
    assert.equal(replace, 'xy: hi z: hi');

    replace = replaceMatching(string, options, (x) => '['+x+']');
    assert.equal(replace, "xy: [a {b} {c}] z: [d {}]");
  })

  it('should work with longer-than-1 delimiters', () => {
    const curly = {open: '(~', close: '~)'}
    const curly2 = {open: '(~x~', close: '~~)'}

    replace = replaceMatching("xy: (~a {b} {c}~) z: (~d {}~)", curly, (x) => '['+x+']');
    assert.equal(replace, "xy: [a {b} {c}] z: [d {}]");

    replace = replaceMatching("xy: (~x~a {b} {c}~~) z: (~x~d {}~~)", curly2, (x) => '['+x+']');
    assert.equal(replace, "xy: [a {b} {c}] z: [d {}]");
  })

  it('should work with a regex for finding the open match', () => {
    const options = {open: '{', close: '}', findRegex: /((\w+): ){/}

    replace = replaceMatching(string, options, (x, match) => match[2]);
    assert.equal(replace, "xy z");

    replace = replaceMatching(string, options, (x, match) => x);
    assert.equal(replace, "a {b} {c} d {}");

    replace = replaceMatching(string, options, (x, match) => match[2]+'='+x);
    assert.equal(replace, "xy=a {b} {c} z=d {}");
  })

  it('should throw an error for an unmatched delim', () => {
    const options = {open: '{', close: '}'}

    assert.throws(() => {
      replaceMatching("{{abc}", options, (x) => x);
    },
    /Couldn't find closing/)
  })
})

describe('Conversions', () => {

  const files = glob().readdirSync('test/examples/*.haml.js');
  files.forEach((haml_file) => {
    const haml_file_no_ext = haml_file.slice(0,-'.haml.js'.length)

    it('should convert '+haml_file_no_ext.slice('test/examples/'.length), () => {

      const haml = fs.readFileSync(haml_file, 'utf8');
      const actual = renderHamlJSX(haml);
      const expected = fs.readFileSync(haml_file_no_ext+'.js', 'utf8');

      assert.equal(actual.trim(), expected.trim());
      
    })
  })

})