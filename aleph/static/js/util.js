function forEachSorted(obj, iterator, context) {
    var keys = sortedKeys(obj);
    for (var i = 0; i < keys.length; i++) {
        iterator.call(context, obj[keys[i]], keys[i]);
    }
    return keys;
}

function sortedKeys(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys.sort();
}

function filterFloat(value) {
    if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
      .test(value))
      return Number(value);
  return NaN;
}

function ensureArray(data) {
  if (!angular.isDefined(data)) {
    return [];
  }
  if (!angular.isArray(data)) {
    return [data];
  }
  return data
};


// polyfill String.startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

// polyfill Array.filter
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun/*, thisArg*/) {
    'use strict';

    if (this === void 0 || this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (fun.call(thisArg, val, i, t)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}

/*
 * Title Caps
 *
 * Ported to JavaScript By John Resig - http://ejohn.org/ - 21 May 2008
 * Original by John Gruber - http://daringfireball.net/ - 10 May 2008
 * License: http://www.opensource.org/licenses/mit-license.php
 */

var small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)";
var punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)";

function titleCaps(title){
  var parts = [], split = /[:.;?!] |(?: |^)["Ò]/g, index = 0;

  while (true) {
    var m = split.exec(title);

    parts.push( title.substring(index, m ? m.index : title.length)
      .replace(/\b([A-Za-z][a-z.'Õ]*)\b/g, function(all){
        return /[A-Za-z]\.[A-Za-z]/.test(all) ? all : upper(all);
      })
      .replace(RegExp("\\b" + small + "\\b", "ig"), lower)
      .replace(RegExp("^" + punct + small + "\\b", "ig"), function(all, punct, word){
        return punct + upper(word);
      })
      .replace(RegExp("\\b" + small + punct + "$", "ig"), upper));

    index = split.lastIndex;

    if ( m ) parts.push( m[0] );
    else break;
  }

  return parts.join("").replace(/ V(s?)\. /ig, " v$1. ")
    .replace(/(['Õ])S\b/ig, "$1s")
    .replace(/\b(AT&T|Q&A)\b/ig, function(all){
      return all.toUpperCase();
    });
};

function lower(word){
  return word.toLowerCase();
}

function upper(word){
  return word.substr(0,1).toUpperCase() + word.substr(1);
}

export {
  forEachSorted, sortedKeys, filterFloat, ensureArray, titleCaps, lower, upper
};
