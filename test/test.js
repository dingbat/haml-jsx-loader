import fs from 'fs';
import glob from 'glob-fs';

import assert from 'assert';

import HamlJSX from '../lib/haml-jsx';

describe('Replace Matching', () => {
  it('should replace outer matches', () => {
    let string = "xy: {a {b} {c}} z: {d {}}"
    let options = {open: '{', close: '}'}
    let replace

    replace = HamlJSX.replaceMatching(string, options, () => 'hi');
    assert.equal(replace, 'xy: hi z: hi');

    replace = HamlJSX.replaceMatching(string, options, (x) => x);
    assert.equal(replace, string);

    options.findRegex = /((\w+): ){/
    replace = HamlJSX.replaceMatching(string, options, (x, match) => match[2]);
    assert.equal(replace, "xy z");

    replace = HamlJSX.replaceMatching(string, options, (x, match) => x);
    assert.equal(replace, "{a {b} {c}} {d {}}");

    replace = HamlJSX.replaceMatching(string, options, (x, match) => match[2]+'='+x);
    assert.equal(replace, "xy={a {b} {c}} z={d {}}");
  });
});

describe('Conversions', () => {

  const files = glob().readdirSync('test/examples/*.haml.js');
  files.forEach((haml_file) => {
    const haml_file_no_ext = haml_file.slice(0,-'.haml.js'.length)

    it('should convert '+haml_file_no_ext.slice('test/examples/'.length), () => {

      const haml = fs.readFileSync(haml_file, 'utf8');
      const actual = HamlJSX.renderHamlJSX(haml);
      const expected = fs.readFileSync(haml_file_no_ext+'.js', 'utf8');

      assert.equal(actual.trim(), expected.trim());
      
    });
  });

});