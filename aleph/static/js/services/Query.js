
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
    if (!angular.isDefined(data)) {
      return [];
    }
    return data;
  };

  var load = function() {
    query = {};
    angular.forEach($location.search(), function(v, k) {
      if (!angular.isArray(v)) {
        v = [v];
      }
      query[k] = v;
    });
    query.source = ensureArray(query.source);
    query.attribute = ensureArray(query.attribute);
    query.entity = ensureArray(query.entity);
    query.listfacet = ensureArray(query.listfacet);
    query.facet = ensureArray(query.facet);
    return query;
  };

  var clear = function() {
    $location.search({});
    load();
  };

  var clearDependentFilters = function(name, val) {
    if (name == 'facet') {
      var key = 'filter:' + val;
      query[key] = [];
    }
    if (name == 'listfacet') {
      var key = 'list-' + val;
      if (query.entity) {
        angular.forEach(query[key], function(id) {
          var idx = query.entity.indexOf(id);
          if (idx != -1) {
            query.entity.splice(idx, 1);
          }
        });
      }
      query[key] = [];
    }
  }

  var toggleFilter = function(filter, val, skipReload) {
    // var filter = 'filter:' + name;
    // var filter = 'filter:' + name;
    if (!angular.isArray(query[filter])) {
      query[filter] = [];
    }
    var idx = query[filter].indexOf(val);
    if (idx == -1) {
      query[filter].push(val);
    } else {
      query[filter].splice(idx, 1);
      clearDependentFilters(filter, val);
    }
    $location.search(query);
    if (!skipReload) {
      $route.reload();
    }
  };

  var toggleEntityFilter = function(id, list) {
    toggleFilter('entity', id, true);
    toggleFilter('list-' + list, id);
  };

  var hasFilter = function(name, val) {
    return angular.isArray(query[name]) && query[name].indexOf(val) != -1;
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
      toggleFilter: toggleFilter,
      toggleEntityFilter: toggleEntityFilter
  };

}]);
