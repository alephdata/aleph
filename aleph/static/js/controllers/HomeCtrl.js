
aleph.controller('HomeCtrl', ['$scope', '$location', '$route', '$uibModal', 'Authz', 'Role', 'Title', 'data',
    function($scope, $location, $route, $uibModal, Authz, Role, Title, data) {

  $scope.result = data.result;
  $scope.sources = data.sources;
  $scope.session = data.metadata.session;
  $scope.metadata = data.metadata;
  $scope.collections = data.metadata.collectionsList.sort(function(a, b) {
    return a.label.localeCompare(b.label);
  });
  $scope.title = Title.getSiteTitle();
  $scope.query = {q: ''};

  Title.set("Welcome");

  $scope.canEditSource = function(source) {
    if (!source || !source.id) {
      return false;
    }
    return Authz.source(Authz.WRITE, source.id);
  };

  $scope.submitSearch = function(form) {
    $location.path('/search');
    $location.search({q: $scope.query.q});
  };

  $scope.editSource = function(source, $event) {
    $event.stopPropagation();
    var instance = $uibModal.open({
      templateUrl: 'templates/sources_edit.html',
      controller: 'SourcesEditCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        source: ['$q', '$http', function($q, $http) {
          var dfd = $q.defer();
          Role.getAll().then(function() {
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
