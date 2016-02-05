
aleph.controller('SearchCtrl', ['$scope', '$route', '$location', '$http', '$uibModal', '$sce', 'data', 'Query', 'Authz', 'Metadata', 'Title',
    function($scope, $route, $location, $http, $uibModal, $sce, data, Query, Authz, Metadata, Title) {

  var isLoading = false;
  $scope.result = {};
  $scope.fields = data.metadata.fields;
  $scope.session = data.metadata.session;
  $scope.metadata = data.metadata;
  $scope.query = Query;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};
  
  if (Query.state.q) {
    Title.set("Search for '" + Query.state.q + "'");  
  } else {
    Title.set("Search documents");  
  }
  

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

  var sortedFilters = function(data, name) {
    if (!data || !data.length) {
      return [];
    }
    // data = angular.copy(data);
    return data.sort(function(a, b) {
      var af = Query.hasFilter(name, a.id),
          bf = Query.hasFilter(name, b.id);
      if (af && !bf) { return -1; }
      if (!af && bf) { return 1; }
      var counts = b.count - a.count;
      if (counts !== 0) {
        return counts;
      }
      var al = a.label || a.name || a.id;
      var bl = b.label || b.name || b.id;
      return al.localeCompare(bl);
    });
  };

  var initFacets = function() {
    $scope.sourceFacets = sortedFilters(data.result.sources.values, 'filter:source_id');
    $scope.entityFacets = sortedFilters(data.result.entities, 'entity');

    var queryFacets = Query.load().facet,
        facets = {};
    for (var i in queryFacets) {
      var facet = queryFacets[i];
      if (data.result.facets[facet]) {
        if (data.result.facets[facet]) {
          var values = data.result.facets[facet].values;
          facets[facet] = sortedFilters(values, 'filter:' + name);  
        }
      }
    }

    $scope.facets = facets;
  };

  var initResults = function() {
    // allow HTML highlight results:
    for (var i in data.result.results) {
      var doc = data.result.results[i];
      for (var j in doc.records.results) {
        var rec = doc.records.results[j];
        rec.snippets = [];
        for (var n in rec.text) {
          var text = rec.text[n];
          rec.snippets.push($sce.trustAsHtml(text));
        }
      }
    }
    $scope.result = data.result;
    isLoading = false;
  };

  initFacets();
  initResults();

  $scope.hasMore = function() {
    return $scope.result.next !== null;
  };

  $scope.loadMore = function() {
    if (!$scope.result.next || isLoading) {
      return;
    }
    isLoading = true;
    $http.get($scope.result.next).then(function(res) {
      data.result.results = data.result.results.concat(res.data.results);
      data.result.next = res.data.next;
      
      initResults();
    });
  };
}]);
