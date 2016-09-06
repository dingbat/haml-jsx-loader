var haml = require("haml");
var replaceMatching = require("./replace-matching")

var DUCK_PREFIX = "haml-jsx-prop:";

///
// In: HAML that has {...} JS embeds in it
// Out: Replace any "key={<JS>}" with:
//        haml-jsx-prop:key="key=<URI-ENCODED-JS>"
//      And any "{<JS>}" with:
//        haml-jsx-prop:inline="<URI-ENCODED-JS>"
//
function duckJS(source) {
  var options = {
    open: '{',
    close: '}',
    findRegex: /((\w+=)|){/
  };

  return replaceMatching(source, options, (js, match) => {
    // This is either the prop name ("class", or undefined, for an inline ({...} out in the open))

    // Whatever we encode here will come out in the HTML.
    // If there's a "someProperty=" (match2), keep it in the encoded
    // because when it gets decoded the property still needs to be there,
    // otherwise, just encode the JS with the {}
    var encode = (match[2] || "") + '{'+js+'}';

    // If there's a "someProperty=", we need to include the property name
    // in the "duck" property (so the end result is something like,
    //   haml-jsx-prop:someProperty="someProperty={<JS ENCODED>}")
    // If we don't (just leave it at haml-jsx-prop=""), and there are multiple
    // attributes with JS, they'll get eaten up by HAML as the same attribute.
    // If not, we need to give it something so the decoder can work with it later.
    var key = DUCK_PREFIX + (match[2] || "inline=");
    var value = '"'+encodeURI(encode)+'"';
    return key+value;
  });
}

////
// In: HTML that has JS embeds encoded inside
// Out: Run any JS embed encodings found through the passed callback
//      and replace them with the result of that.
//
function unduckJS(source, replacement) {
  var regex = DUCK_PREFIX+"\\w+=\"(.*?)\"";
  return source.replace(new RegExp(regex, 'mg'), (all, js) => {
    return replacement(decodeURI(js));
  });
}

function renderHAML(source) {
  // TODO: Ignore comments!
  
  ////
  // Normalize spaces (remove any offset the first line had)
  //
  var firstIndent = source.match(/^([ \t]*)./m)[1];
  source = source.replace(new RegExp("^"+firstIndent,"mg"), "");

  ////
  // Optimize the HAML a bit
  //
  // Turn plain dots into %divs
  source = source.replace(/^(\s*)\.(\(.*|)\s*(\n|$)/mg, (all, one, two, three) => {
    return one+'%div'+two+three;
  });

  // Allow multi-line attributes, which the 'haml' npm module does not support
  // (see https://github.com/creationix/haml-js/issues/74)
  // Do this by matching any attribute lists and replacing all newlines with spaces
  source = source.replace(/((^|\n)\s*%[a-z0-9_.#\-]+)(\((\s*[a-z:_\-]+="[^"]*"\s*)+\))/img, (all, before, x, attrs) => {
    return before + attrs.replace(/\s*\n\s*/mg, ' ');
  });

  // Render the HTML
  var render = haml.render(source);

  // class= to className=
  // Has to be done after HTML render because HAML will render
  // tags with the dot-shorthand (%h1.class) with class=
  render = render.replace(/(<[^>]*)class=/mg, (all, before) => {
    return before+"className=";
  });

  return render;
}

function renderHamlJSX(source, openDelim, closeDelim) {
  var options = {
    open: openDelim || "(~",
    close: closeDelim || "~)",
  };

  return replaceMatching(source, options, function(haml) {
    // Duck out JS
    haml = duckJS(haml);

    // Transform the now pure-HAML into HTML
    var html = renderHAML(haml);

    // Re-inject the JS, recursively rendering any HAML-JSX hiding in there...
    return unduckJS(html, function (js) {
      return renderHamlJSX(js, openDelim, closeDelim);
    });
  });
}

module.exports = renderHamlJSX;
