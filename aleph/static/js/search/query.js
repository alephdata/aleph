
aleph.factory('Query', ['$route', '$location', function($route, $location) {
  var query = {};

  var mode = function() {
    if ($route.current) {
      var ctrl = $route.current.$$route.controller;
      if (ctrl == 'SearchExportCtrl') return 'export';
      if (ctrl == 'SearchTableCtrl') return 'table';
      if (ctrl == 'SearchGraphCtrl') return 'graph';
    }
  }

  var ensureArray = function(data) {
    if (!angular.isArray(data)) {
      if (angular.isDefined(data) && data.length) {
        data = [data];
      } else {
        data = [];
      }
    }
    return data;
  };

  var load = function() {
    query = $location.search();
    query.source = ensureArray(query.source);
    query.attribute = ensureArray(query.attribute);
    query.entity = ensureArray(query.entity);

    query.listfacet = ensureArray(query.listfacet);
    query.attributefacet = ensureArray(query.attributefacet);

    return query;
  };

  var clear = function() {
    $location.search({});
    load();
  };

  var toggleFilter = function(name, val, skipReload) {
    var idx = query[name].indexOf(val);
    if (idx == -1) {
      query[name].push(val);
    } else {
      query[name].splice(idx, 1);
    }
    $location.search(query);
    if (!skipReload) {
      $route.reload();  
    }
  };

  var hasFilter = function(name, val) {
    var q = load();
    return q[name].indexOf(val) != -1;
  };

  load();

  return {
      state: query,
      load: load,
      mode: mode,
      clear: clear,
      queryString: function() {
        return queryString(query);
      },
      hasFilter: hasFilter,
      toggleFilter: toggleFilter
  };

}]);

