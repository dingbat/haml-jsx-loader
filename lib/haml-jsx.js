var haml = require("haml");

function replaceMatching(string, options, replacement) {
  var open = options.open;
  var close = options.close;
  var findRegex = options.findRegex;

  var newString = "";

  var counter = 0;

  do {
    var unsearched = string.substring(counter);
    var match;
    var foundIndex;
    if (findRegex) {
      match = unsearched.match(findRegex);
      if (match === null) break;
      foundIndex = match.index;
      
      // Assuming the first group in the regex is the prefix,
      // we want to replace, but don't want to search for the
      // opening delimiter for. (i.e., the do loop will never
      // get beyond the first pass because brackets are only
      // found after the prefix.)
      counter += match[1].length
    }
    else {
      foundIndex = unsearched.indexOf(open);
      if (foundIndex === -1) break;
    }
    
    var head = string.substring(counter, counter + foundIndex);

    // Advance the counter
    counter += foundIndex;
    
    var idx = counter;

    var brackets = 0;
    do {
      if (string[counter] === open) {
        brackets += 1;
      }
      if (string[counter] === close) {
        brackets -= 1;
      }
      counter += 1;
    } while (brackets !== 0);

    var inside = string.substring(idx, counter);
    var sub = replacement(inside, match);
    newString += head + sub;

  } while (counter < string.length);

  newString += string.substring(counter);

  return newString;
}

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

function renderHamlJSX(source, openDelim, closeDelim) {
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
      return renderHamlJSX(js, openDelim, closeDelim);
    });

    return source;
  });
}

module.exports = {
  renderHamlJSX: renderHamlJSX,
  replaceMatching: replaceMatching,
};
