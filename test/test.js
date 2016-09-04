var fs = require('fs');
var glob = require('glob-fs')();

var assert = require('assert');

var HamlJSX = require("../index");

describe('Conversions', function() {

  var files = glob.readdirSync('test/examples/*.haml.js');
  files.forEach(function (haml_file) {
    var haml_file_no_ext = haml_file.slice(0,-'haml.js'.length)

    it('should convert '+haml_file_no_ext.slice('test/examples/'.length), function() {

      var haml = fs.readFileSync(haml_file, 'utf8');
      var actual = HamlJSX(haml);
      var expected = fs.readFileSync(haml_file_no_ext+'js', 'utf8');

      assert.equal(actual.trim(), expected.trim());

    });
  });

});