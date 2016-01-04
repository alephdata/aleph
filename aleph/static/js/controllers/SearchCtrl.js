
aleph.controller('SearchCtrl', ['$scope', '$location', '$http', '$uibModal', 'result', 'Query', 'Metadata', 'Authz',
  function($scope, $location, $http, $uibModal, result, Query, Metadata, Authz) {

  var isLoading = false;
  $scope.result = result;
  $scope.query = Query;
  $scope.metadata = {};
  $scope.session = {};
  $scope.watchlists = {};
  $scope.fields = {};
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

  Metadata.get().then(function(metadata) {
    $scope.watchlists = metadata.watchlists;
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
    return Authz.source(Authz.WRITE, source.id);
  };

  $scope.canEditWatchlist = function(watchlist) {
    return Authz.source(Authz.WRITE, watchlist.id);
  };

  $scope.editSource = function(source, $event) {
    $event.stopPropagation();
    var instance = $uibModal.open({
      templateUrl: 'sources_edit.html',
      controller: 'SourcesEditCtrl',
      backdrop: true,
      size: 'lg',
      resolve: {
        source: ['$q', '$http', function($q, $http) {
          var dfd = $q.defer();
          $http.get('/api/1/sources/' + source.id).then(function(res) {
            dfd.resolve(res.data);
          }, function(err) {
            dfd.reject(err);
          });
          return dfd.promise;
        }],
        users: loadUsers
      }
    });

    instance.result.then(function() {
      $route.reload();
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
