
aleph.controller('HomeCtrl', ['$scope', '$location', '$route', 'Source', 'Collection', 'Authz', 'Role', 'Title', 'data', 'metadata',
    function($scope, $location, $route, Source, Collection, Authz, Role, Title, data, metadata) {

  $scope.result = data.result;
  $scope.sources = data.sources;
  $scope.session = metadata.session;
  $scope.metadata = metadata;
  $scope.collections = metadata.collectionsList.sort(function(a, b) {
    return a.label.localeCompare(b.label);
  });
  $scope.title = Title.getSiteTitle();
  $scope.query = {q: ''};
  $scope.authz = Authz;

  Title.set("Welcome");

  $scope.submitSearch = function(form) {
    $location.path('/search');
    $location.search({q: $scope.query.q});
  };

  $scope.editSource = function(source, $event) {
    $event.stopPropagation();
    Source.edit(source).then(function() {
      $route.reload();
    });
  };

  $scope.editCollection = function(collection, $event) {
    $event.stopPropagation();
    Collection.edit(collection).then(function() {
      $route.reload();
    });
  };
}]);
