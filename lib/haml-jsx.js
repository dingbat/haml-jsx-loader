var haml = require("haml");
var replaceMatching = require("./replace-matching")

var DUCK_PREFIX = "haml-jsx-prop:";

// In: HAML that has {...} JS embeds in it
// Out: Replace any top-level {...} with:
//      <duckPrefix>="<URI-ENCODED-JS>"
function duckJS(source, duckPrefix) {
  return replaceMatching(source, {open: '{', close: '}', findRegex: /((\w+=)|){/}, (js, match) => {
    var propJoe = match[2];
    // Property
    var sub = duckPrefix + (propJoe || "inline=");
    // Contents of property (will be decoded)
    sub += '"' + encodeURI((propJoe || "") + '{' + js + '}') + '"';
    return sub;
  });
}

function renderHAML(source) {
  // Optimize the HAML a bit

  // TODO: Ignore comments!

  // Turn plain dots into %divs
  source = source.replace(/^(\s*)\.(\(.*|)\s*(\n|$)/mg, (all, one, two, three) => {
    return one+'%div'+two+three;
  });

  // Allow multi-line attributes, which the 'haml' npm module does not support
  // (see https://github.com/creationix/haml-js/issues/74)
  source = source.replace(/((^|\n)\s*%[a-z0-9_.#\-]+)(\((\s*[a-z:_\-]+="[^"]*"\s*)+\))/img, (all, before, x, attrs) => {
    return before + attrs.replace(/\s*\n\s*/mg, ' ');
  });

  // class= to className=
  var render = haml.render(source);
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
    haml = duckJS(haml, DUCK_PREFIX);

    // Transform the now pure-HAML into HTML
    var html = renderHAML(haml);

    // Re-inject the JS
    var regex = DUCK_PREFIX+"\\w+=\"(.*?)\"";
    html = html.replace(new RegExp(regex, 'mg'), (all, js) => {
      js = decodeURI(js);
      // Recursively render any more HAML-JSX that may be hiding in there... :)
      return renderHamlJSX(js, openDelim, closeDelim);
    });

    return html;
  });
}

module.exports = renderHamlJSX;
