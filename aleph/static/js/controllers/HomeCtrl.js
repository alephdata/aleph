
aleph.controller('HomeCtrl', ['$scope', '$location', '$route', '$uibModal', 'Query', 'Authz', 'Metadata', 'Title', 'data',
    function($scope, $location, $route, $uibModal, Query, Authz, Metadata, Title, data) {

  $scope.result = data.result;
  $scope.sources = data.sources;
  $scope.session = data.metadata.session;
  $scope.metadata = data.metadata;
  $scope.collections = data.metadata.collectionsList.sort(function(a, b) {
    return a.label.localeCompare(b.label);
  });
  $scope.query = Query.load();
  $scope.title = Title.getSiteTitle();

  Title.set("Welcome");

  $scope.canEditSource = function(source) {
    if (!source || !source.id) {
      return false;
    }
    return Authz.source(Authz.WRITE, source.id);
  };

  $scope.submitSearch = function(form) {
    var search = Query.load();
    search.q = $scope.query.q;
    $location.search(search);
    $location.path('/search');
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
}]);
