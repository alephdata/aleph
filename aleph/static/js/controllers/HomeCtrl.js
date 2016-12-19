import aleph from '../aleph';

aleph.controller('HomeCtrl', ['$scope', '$location', '$route', 'Collection', 'Authz', 'Role', 'Title', 'statistics', 'facets', 'collections', 'metadata',
    function($scope, $location, $route, Collection, Authz, Role, Title, statistics, facets, collections, metadata) {

  $scope.statistics = statistics;
  $scope.facets = facets;
  $scope.collections = collections;
  $scope.session = metadata.session;
  $scope.metadata = metadata;
  $scope.query = {q: ''};
  $scope.authz = Authz;

  Title.set("Welcome");

  $scope.submitSearch = function(form) {
    $location.path('/documents');
    $location.search({q: $scope.query.q});
  };

  $scope.createCollection = function($event) {
    Collection.create().then(function(coll) {
      $location.path('/collections/' + coll.id);
    });
  };

}]);
