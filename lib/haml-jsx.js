var haml = require("haml");

// In: HAML
// Out: Array of [Index, JS]
function getOuterJS(haml) {
  var jsMap = [];
  var counter = haml[0] === '{' ? 1 : 0;

  do {
    var match = haml.substring(counter).match(/((\w+)=|){/);
    if (!match) {
      break;
    }

    var idx = match.index + counter;
    var propJoe = match[2] || "";
    counter += match.index + match[1].length;

    var brackets = 0;
    do {
      if (haml[counter] === '{') {
        brackets += 1;
      }
      if (haml[counter] === '}') {
        brackets -= 1;
      }
      counter += 1;
    } while (brackets !== 0);

    var js = haml.substring(idx, counter);
    jsMap.push([idx, match[2] || "inline", js]);

  } while (counter < haml.length);

  return jsMap;
}

// In: HAML that has {...} JS embeds in it
// Out: Replace any top-level {...} with:
//      <duckPrefix>="<URI-ENCODED-JS>"
function duckJS(source, duckPrefix) {
  var jsMap = getOuterJS(source);
  var offset = 0;
  jsMap.forEach((result) => {
    var idx = result[0];
    var prop = result[1];
    var js = result[2];

    var replacement = duckPrefix + prop + "=\"" + encodeURI(js) + "\"";
    var head = source.substring(0, offset + idx);
    var tail = source.substring(offset + idx + js.length);

    var newSource = head + replacement + tail;
    offset += newSource.length - source.length;
    source = newSource;
  })
  return source;
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

function renderHAMLJSX(source, openDelim, closeDelim) {
  openDelim = openDelim || "\\(~";
  closeDelim = closeDelim || "~\\)";

  var duckPrefix = "haml-jsx-prop:";

  var regex = openDelim+"([\\s\\S]*)"+closeDelim;
  return source.replace(new RegExp(regex, 'g'), function(all, source) {
    // Take out JS
    source = duckJS(source, duckPrefix);    

    // Transform the now pure-HAML into HTML
    source = renderHAML(source);

    // Re-inject the JS
    var regex = duckPrefix+"\\w+=\"(.*?)\"";
    source = source.replace(new RegExp(regex, 'mg'), (all, js) => {
      js = decodeURI(js);
      // Recursively render any more HAML-JSX that may be hiding in there... :)
      return renderHAMLJSX(js, openDelim, closeDelim);
    });

    return source;
  });
}

module.exports = renderHAMLJSX;