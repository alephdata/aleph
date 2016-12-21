import aleph from '../aleph';
import {ensureArray} from '../util';

aleph.factory('Query', ['$route', '$location', '$httpParamSerializer',
    function($route, $location, $httpParamSerializer) {

  var ParsedQuery = function(prefix) {
    var search = $location.search();
    this.prefix = prefix || '';
    this.state = {};
    for (var key in search) {
      if (key.startsWith(this.prefix)) {
        this.state[key.substr(this.prefix.length)] = search[key];
      }
    }
  };

  ParsedQuery.prototype.update = function() {
    var search = angular.copy($location.search());
    for (var key in search) {
      if (key.startsWith(this.prefix)) {
        delete search[key];
      }
    }
    for (var key in this.state) {
      search[this.prefix + key] = this.state[key];
    }
    $location.search(search);
    return search;
  };

  ParsedQuery.prototype.toString = function() {
    return $httpParamSerializer(this.state);
  };

  ParsedQuery.prototype.getArray = function(key) {
    return ensureArray(this.state[key]).map(function(v) {
      return v + '';
    }).filter(function(v) {
      return v.trim().length > 0;
    });
  };

  ParsedQuery.prototype.hasField = function(name, val) {
    var cur = this.getArray(name + ''),
        valStr = val ? val + '' : null;
    return cur.indexOf(valStr) != -1;
  };

  ParsedQuery.prototype.getQ = function() {
    var q = this.state.q || '';
    q = q.trim();
    if (!q.length) {
      return null;
    }
    return q;
  };

  ParsedQuery.prototype.hasFilter = function(name, val) {
    return this.hasField('filter:' + name, val);
  };

  ParsedQuery.prototype.clear = function() {
    this.state = {};
    this.update();
  };

  ParsedQuery.prototype.set = function(name, val) {
    this.state.offset = 0;
    this.state[name] = val;
    this.update();
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
    return this.set(name, values);
  };

  ParsedQuery.prototype.toggleFilter = function(name, val) {
    return this.toggle('filter:' + name, val);
  };

  ParsedQuery.prototype.isFiltered = function() {
    if (this.getQ()) {
      return true;
    }
    for (var key in this.state) {
      if (key.startsWith('filter:') && this.getArray(key).length > 0) {
        return true;
      }
    }
    return false;
  };

  return {
    parse: function(prefix) {
      return new ParsedQuery(prefix);
    }
  };
}]);
