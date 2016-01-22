
aleph.controller('SearchCtrl', ['$scope', '$route', '$location', '$http', '$uibModal', 'result', 'Query', 'Metadata', 'Authz',
    function($scope, $route, $location, $http, $uibModal, result, Query, Metadata, Authz) {

  var isLoading = false;
  $scope.result = result;
  $scope.query = Query;
  $scope.metadata = {};
  $scope.session = {};
  $scope.fields = {};
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

  Metadata.get().then(function(metadata) {
    $scope.fields = metadata.fields;
    $scope.session = metadata.session;
    $scope.metadata = metadata;
  });

  $scope.showListFacet = function(id) {
    return Query.load().watchlist.indexOf(id) == -1;
  };

  $scope.showFieldFacet = function(field) {
    return Query.load().facet.indexOf(field) == -1;
  };

  $scope.canEditSource = function(source) {
    if (!source || !source.id) {
      return false;
    }
    return Authz.source(Authz.WRITE, source.id);
  };

  $scope.canEditWatchlist = function(watchlist) {
    if (!watchlist || !watchlist.id) {
      return false;
    }
    return Authz.source(Authz.WRITE, watchlist.id);
  };

  $scope.editSource = function(source, $event) {
    $event.stopPropagation();
    var instance = $uibModal.open({
      templateUrl: 'sources_edit.html',
      controller: 'SourcesEditCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        source: ['$q', '$http', function($q, $http) {
          var dfd = $q.defer();
          Metadata.getRoles().then(function() {
            $http.get('/api/1/sources/' + source.id).then(function(res) {
              dfd.resolve(res.data);
            }, function(err) {
              dfd.reject(err);
            });
          }, function(err) {
            dfd.reject(err);
          });
          return dfd.promise;
        }]
      }
    });

    instance.result.then(function() {
      $route.reload();
    });
  };

  $scope.selectWatchlists = function($event) {
    $event.stopPropagation();
    var instance = $uibModal.open({
      templateUrl: 'watchlists_select.html',
      controller: 'WatchlistsSelectCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        watchlists: function() {
          return Query.load().watchlist;
        }
      }
    });

    instance.result.then(function(watchlists) {
      Query.set('watchlist', watchlists);
    });
  };

  var compareFacetOptions = function(a, b) {
    var counts = b.count - a.count;
    if (counts !== 0) {
      return counts;
    }
    var al = a.label || a.name || a.id;
    var bl = b.label || b.name || b.id;
    return al.localeCompare(bl);
  };

  $scope.getSources = function() {
    return result.sources.values.sort(function(a, b) {
      var af = Query.hasFilter('filter:source_id', a.id),
          bf = Query.hasFilter('filter:source_id', b.id);
      if (af && !bf) { return -1; }
      if (!af && bf) { return 1; }
      return compareFacetOptions(a, b);
    });
  };

  $scope.getEntities = function() {
    return result.entities.sort(function(a, b) {
      var af = Query.hasFilter('entity', a.id),
          bf = Query.hasFilter('entity', b.id);
      if (af && !bf) { return -1; }
      if (!af && bf) { return 1; }
      return compareFacetOptions(a, b);
    });
  };

  $scope.getFacet = function(name) {
    if (!result.facets[name]) {
      return [];
    }
    return result.facets[name].values.sort(function(a, b) {
      var af = Query.hasFilter('filter:' + name, a.id),
          bf = Query.hasFilter('filter:' + name, b.id);
      if (af && !bf) { return -1; }
      if (!af && bf) { return 1; }
      return compareFacetOptions(a, b);
    });
  };

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next !== null;
  };

  $scope.loadMore = function() {
    if (!$scope.result.next) {
      return;
    }
    isLoading = true;
    $http.get($scope.result.next).then(function(res) {
      $scope.result.results = $scope.result.results.concat(res.data.results);
      $scope.result.next = res.data.next;
      isLoading = false;
    });
  };
}]);
