import fs from 'fs';
import glob from 'glob-fs';

import assert from 'assert';

import renderHamlJSX from '../lib/haml-jsx';

describe('Conversions', () => {

  const files = glob().readdirSync('test/examples/*.haml.js');
  files.forEach((haml_file) => {
    const haml_file_no_ext = haml_file.slice(0,-'haml.js'.length)

    it('should convert '+haml_file_no_ext.slice('test/examples/'.length), () => {

      const haml = fs.readFileSync(haml_file, 'utf8');
      const actual = renderHamlJSX(haml);
      const expected = fs.readFileSync(haml_file_no_ext+'js', 'utf8');

      assert.equal(actual.trim(), expected.trim());
      
    });
  });

});