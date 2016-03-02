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

function queryString(params) {
    var parts = [];
    forEachSorted(params, function(value, key) {
      if (value === null || angular.isUndefined(value)) return;
      if (!angular.isArray(value)) value = [value];

      angular.forEach(value, function(v) {
        if (angular.isObject(v)) {
          if (angular.isDate(v)) {
            v = v.toISOString();
          } else {
            v = angular.toJson(v);
          }
        }
        parts.push(encodeURIComponent(key) + '=' +
                   encodeURIComponent(v));
      });
    });
    return parts.join('&');
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
  return data;
};

function alephUrlBlob(obj) {
  return btoa(JSON.stringify(obj));
}

function alephUrlUnBlob(val) {
  return JSON.parse(atob(val));
}


// polyfill startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}
