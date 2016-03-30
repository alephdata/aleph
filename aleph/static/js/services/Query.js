
aleph.factory('Query', ['$route', '$location', function($route, $location) {
  var query = {};

  var load = function() {
    query = {};
    angular.forEach($location.search(), function(v, k) {
      if (!angular.isArray(v)) {
        v = [v];
      }
      query[k] = v;
    });
    query.offset = null;
    query.entity = ensureArray(query.entity);
    query.collection = ensureArray(query.collection);
    query.facet = ensureArray(query.facet);
    return query;
  };

  var clear = function() {
    $location.search({});
  };

  var set = function(name, val) {
    query[name] = val;
    $location.search(query);
  };

  var toggleFilter = function(filter, val) {
    var q = load();
    if (!angular.isArray(q[filter])) {
      q[filter] = [];
    }
    val = val + '';
    var idx = q[filter].indexOf(val);
    if (idx == -1) {
      q[filter].push(val);
    } else {
      q[filter].splice(idx, 1);
    }
    $location.search(q);
    query = q;
  };

  var hasFilter = function(name, val) {
    val = val + '';
    return angular.isArray(query[name]) && query[name].indexOf(val) != -1;
  };

  load();

  return {
      state: query,
      load: load,
      clear: clear,
      set: set,
      queryString: function() {
        return queryString(query);
      },
      hasFilter: hasFilter,
      toggleFilter: toggleFilter
  };

}]);
