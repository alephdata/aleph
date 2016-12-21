import aleph from '../aleph';

aleph.controller('HomeCtrl', ['$scope', '$location', '$route', 'Collection', 'Authz', 'Role', 'Title', 'statistics', 'metadata',
    function($scope, $location, $route, Collection, Authz, Role, Title, statistics, metadata) {

  $scope.statistics = statistics;
  $scope.session = metadata.session;
  $scope.metadata = metadata;
  $scope.entitiesQuery = {q: ''};
  $scope.documentsQuery = {q: ''};
  $scope.authz = Authz;

  Title.set("Welcome");

  $scope.searchDocuments = function(form) {
    $location.path('/documents');
    $location.search({q: $scope.documentsQuery.q});
  };

  $scope.searchEntities = function(form) {
    $location.path('/entities');
    $location.search({q: $scope.entitiesQuery.q});
  };

  $scope.createCollection = function($event) {
    Collection.create().then(function(coll) {
      $location.path('/collections/' + coll.id);
    });
  };

}]);
