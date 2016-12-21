import aleph from '../aleph';

aleph.controller('CollectionsIndexCtrl', ['$scope', '$http', '$route', '$location', '$timeout', '$anchorScroll', 'Collection', 'collections', 'metadata', 'Authz', 'Alert', 'Title',
    function($scope, $http, $route, $location, $timeout, $anchorScroll, Collection, collections, metadata, Authz, Alert, Title) {

  var updateTimeout = null;
  $scope.query = collections.query;
  $scope.collections = collections.result;
  $scope.authz = Authz;
  $scope.metadata = metadata;

  Title.set("Collections", "collections");

  $scope.createCollection = function($event) {
    if (!Authz.logged_in()) return;
    $event.stopPropagation();
    Collection.create().then(function(coll) {
      $location.path('/collections/' + coll.id);
    });
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  $scope.updateQuery = function() {
    $scope.query.set('label', $scope.query.state.q);
  };
}]);
