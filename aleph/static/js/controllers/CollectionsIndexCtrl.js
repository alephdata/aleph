
aleph.controller('CollectionsIndexCtrl', ['$scope', '$http', '$timeout', '$anchorScroll', 'Collection', 'Entity', 'collections', 'metadata', 'Authz', 'Alert', 'Title',
    function($scope, $http, $timeout, $anchorScroll, Collection, Entity, collections, metadata, Authz, Alert, Title) {

  $scope.collections = collections;
  $scope.metadata = metadata;


}]);
