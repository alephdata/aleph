
aleph.controller('HomeCtrl', ['$scope', '$location', '$route', 'Collection', 'Authz', 'Role', 'Title', 'statistics', 'facets', 'metadata',
    function($scope, $location, $route, Collection, Authz, Role, Title, statistics, facets, metadata) {

  $scope.statistics = statistics;
  $scope.facets = facets;
  $scope.session = metadata.session;
  $scope.metadata = metadata;
  $scope.query = {q: ''};
  $scope.authz = Authz;

  Title.set("Welcome");

  console.log(facets);

  $scope.submitSearch = function(form) {
    $location.path('/search');
    $location.search({q: $scope.query.q});
  };
}]);
