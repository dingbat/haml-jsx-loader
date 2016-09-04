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

module.exports = replaceMatching;
