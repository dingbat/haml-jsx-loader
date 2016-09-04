import fs from 'fs';
import glob from 'glob-fs';

import assert from 'assert';

import HamlJSX from '../lib/haml-jsx';

describe('Replace Matching', () => {
  it('should replace outer matches', () => {
    let replace = HamlJSX.replaceMatching("{a}", /{/, '{', '}', () => 'hi');
    assert.equal(replace, 'hi');

    replace = HamlJSX.replaceMatching("x: {a} {b}", /{/, '{', '}', () => 'hi');
    assert.equal(replace, 'x: hi hi');

    replace = HamlJSX.replaceMatching("x: {a {b} {c}} y: {d {}}", /{/, '{', '}', () => 'hi');
    assert.equal(replace, 'x: hi y: hi');

    replace = HamlJSX.replaceMatching("x: {a {b} {c}} y: {d {}}", /{/, '{', '}', (x) => x);
    assert.equal(replace, "x: {a {b} {c}} y: {d {}}");
  });
});

describe('Conversions', () => {

  const files = glob().readdirSync('test/examples/*.haml.js');
  files.forEach((haml_file) => {
    const haml_file_no_ext = haml_file.slice(0,-'haml.js'.length)

    it('should convert '+haml_file_no_ext.slice('test/examples/'.length), () => {

      const haml = fs.readFileSync(haml_file, 'utf8');
      const actual = HamlJSX.renderHamlJSX(haml);
      const expected = fs.readFileSync(haml_file_no_ext+'js', 'utf8');

      assert.equal(actual.trim(), expected.trim());
      
    });
  });

});