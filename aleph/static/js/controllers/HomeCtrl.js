
aleph.controller('HomeCtrl', ['$scope', '$location', '$route', 'Collection', 'Authz', 'Role', 'Title', 'statistics', 'metadata',
    function($scope, $location, $route, Collection, Authz, Role, Title, statistics, metadata) {

  $scope.statistics = statistics;
  $scope.session = metadata.session;
  $scope.metadata = metadata;
  $scope.query = {q: ''};
  $scope.authz = Authz;

  Title.set("Welcome");

  $scope.submitSearch = function(form) {
    $location.path('/search');
    $location.search({q: $scope.query.q});
  };
}]);
