
aleph.factory('Query', ['$route', '$location', function($route, $location) {

  var ParsedQuery = function() {
    this.state = $location.search();
  };

  ParsedQuery.prototype.toString = function() {
    return queryString(this.state);
  };

  ParsedQuery.prototype.getArray = function(key) {
    return ensureArray(this.state[key]).map(function(v) {
      return v + '';
    });
  };

  ParsedQuery.prototype.hasField = function(name, val) {
    var cur = this.getArray(name + ''),
        valStr = val ? val + '' : null;
    return cur.indexOf(valStr) != -1;
  };

  ParsedQuery.prototype.hasFilter = function(name, val) {
    return this.hasField('filter:' + name, val);
  };

  ParsedQuery.prototype.clear = function() {
    $location.search({});
  };

  ParsedQuery.prototype.set = function(name, val) {
    this.state[name] = val;
    $location.search(this.state);
  };

  ParsedQuery.prototype.toggle = function(name, val) {
    var values = this.getArray(name),
        valStr = val ? val + '' : null;
    var idx = values.indexOf(valStr);
    if (idx == -1) {
      values.push(valStr);
    } else {
      values.splice(idx, 1);
    }
    this.set(name, values);
  };

  ParsedQuery.prototype.toggleFilter = function(name, val) {
    return this.toggle('filter:' + name, val);
  };

  return {
    parse: function() {
      return new ParsedQuery();
    }
  };
}]);
