var haml = require("haml");

var DUCK_PREFIX = "haml-jsx-prop:";

function replaceMatching(string, options, replacement) {
  var open = options.open;
  var close = options.close;
  var findRegex = options.findRegex;

  var newString = "";

  var counter = 0;

  do {
    var unsearched = string.substring(counter);
    var match, head, foundIndex;
    if (findRegex) {
      match = unsearched.match(findRegex);
      if (match === null) break;
      foundIndex = match.index;

      // Assuming the first group in the regex is the prefix,
      // we want to replace, but don't want to search for the
      // opening delimiter for. (i.e., the do loop will never
      // get beyond the first pass because brackets are only
      // found after the prefix.)

      // But we do want to exclude it from the head.
      head = string.substring(counter, counter + foundIndex);
      counter += match[1].length;
    }
    else {
      foundIndex = unsearched.indexOf(open);
      head = string.substring(counter, counter + foundIndex);
      if (foundIndex === -1) break;
    }

    // Advance the counter
    counter += foundIndex;
    
    var idx = counter + open.length;

    var brackets = 0;
    do {
      var token = string.substring(counter, counter+open.length);
      if (token === open) {
        brackets += 1;
      }
      if (token === close) {
        brackets -= 1;
      }
      counter += 1;
    } while (brackets !== 0);

    var inside = string.substring(idx, counter - 1);
    counter += close.length - 1;

    var sub = replacement(inside, match);
    newString += head + sub;

  } while (counter < string.length);

  newString += string.substring(counter);

  return newString;
}

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

module.exports = {
  renderHamlJSX: renderHamlJSX,
  replaceMatching: replaceMatching,
};
