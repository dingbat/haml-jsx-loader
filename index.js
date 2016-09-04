var haml = require("haml");
var loaderUtils = require("loader-utils");
  
var OPEN_DELIM, CLOSE_DELIM;

// In: HAML
// Out: Array of [Index, JS]
function getOuterJS(haml) {
  var jsMap = [];
  var counter = 0;

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

    jsMap.push([idx, match[2] || "inline", haml.substring(idx, counter)]);

  } while (counter < haml.length);

  return jsMap;
}

function duckJSXDuringTransform(source, transform) {
  // Take out JS
  var jsMap = getOuterJS(source);
  var offset = 0;
  jsMap.map((result) => {
    var idx = result[0];
    var prop = result[1];
    var js = result[2];

    var tail = source.substring(offset + idx + js.length);
    var newSource = source.substring(0, offset + idx) + "haml-jsx-prop:" + prop + "=\"" + encodeURI(js) + "\"" + tail;

    offset += newSource.length - source.length;
    source = newSource;
  })

  // Transform
  source = transform(source);

  // Re-inject the JS
  return source.replace(/haml-jsx-prop:\w+="(.*?)"/mg, (all, js) => {
    // Recursively render any HAML that may be hiding in here... :)
    return renderHAMLJSX(decodeURI(js));
  });
}

function renderHAML(source) {
  // Optimize the HAML a bit

  // TODO: Ignore comments!

  // Turn plain dots into %divs
  source = source.replace(/^(\s*)\.(.*)$/mg, (all, one, two) => {
    return one+'%div'+two;
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

function renderHAMLJSX(source) {
  var regex = OPEN_DELIM+"([\\s\\S]*)"+CLOSE_DELIM;
  return source.replace(new RegExp(regex, 'g'), function(all, haml) {
    return duckJSXDuringTransform(haml, renderHAML);
  });
}

module.exports = function (source) {
  this.cacheable && this.cacheable(true);
  var query = loaderUtils.parseQuery(this.query);
  OPEN_DELIM = query.open || "\\(~";
  CLOSE_DELIM = query.close || "~\\)";

  var result;
  try {
    result = renderHAMLJSX(source);
  } catch (e) {
    this.emitError('HAML: ' + e);
    throw e;
  }

  return result;
}
