////
// Does what replace() does, but with a thing that can't be
// captured in a regex -- content inside a set of top-level
// matching braces. For instance, replace everything inside
// brackets, { and }.
//
function replaceMatching(string, options, replacementFunc) {
  var open = options.open;
  var close = options.close;
  var findRegex = options.findRegex;

  var newString = "";
  var offset = 0;

  do {
    var unsearched = string.substring(offset);
    var match, head, foundIndex;

    // Check if we are given a regex to find the opening brace
    if (findRegex) {
      match = unsearched.match(findRegex);
      if (match === null) break;
      foundIndex = match.index;

      // Assuming the first group in the regex is the prefix,
      // we want to replace, but don't want to search for the
      // opening delimiter for the first bracket. (i.e., the
      // do loop will never get beyond the first pass because
      // brackets are only found _after_ the prefix.)

      // So, increase the offset to jump to the bracket. But,
      // we do want to exclude it from the head, so calculate
      // the head first.
      head = string.substring(offset, offset + foundIndex);
      offset += match[1].length;
    }
    else {
      foundIndex = unsearched.indexOf(open);
      head = string.substring(offset, offset + foundIndex);
      if (foundIndex === -1) break;
    }

    // Advance the offset. Add to, not set, because we're only
    // indexing starting from the offset.
    offset += foundIndex;
    
    // Mark the beginning of this segment.
    var idx = offset + open.length;

    // Keep adding to the segment until we match delimiters...
    var brackets = 0;
    do {
      if (string.substring(offset, offset+open.length) === open) {
        brackets += 1;
      }
      if (string.substring(offset, offset+close.length) === close) {
        brackets -= 1;
      }
      offset += 1;
    }
    while (brackets !== 0 && offset < string.length);
    if (brackets !== 0) {
      throw new Error("Couldn't find closing match ('"+close+"') for delimiter '"+open+"'");
    }
  
    var segment = string.substring(idx, offset - 1);
    var sub = replacementFunc(segment, match);
    
    newString += head + sub;

    // We only offset by one in the count, but the close
    // delimiter could be bigger than that, which we don't want
    // to include in the tail end of our new string.
    offset += close.length - 1;
  }
  while (offset < string.length);

  // Tack on the rest of the string
  newString += string.substring(offset);

  return newString;
}

module.exports = replaceMatching;
