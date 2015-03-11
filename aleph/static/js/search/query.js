
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
    query.attributefacet = ensureArray(query.attributefacet);
    return query;
  };

  var clear = function() {
    $location.search({});
    load();
  };

  var clearDependentFilters = function(name, val) {
    if (name == 'attributefacet') {
      var key = 'attribute-' + val;
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

  var toggleEntityFilter = function(id, list) {
    toggleFilter('entity', id, true);
    toggleFilter('list-' + list, id);
  }

  var toggleFilter = function(name, val, skipReload) {
    if (!angular.isArray(query[name])) {
      query[name] = [];
    }
    var idx = query[name].indexOf(val);
    if (idx == -1) {
      query[name].push(val);
    } else {
      query[name].splice(idx, 1);
      clearDependentFilters(name, val);
    }
    $location.search(query);
    if (!skipReload) {
      $route.reload();  
    }
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

