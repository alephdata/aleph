aleph.controller('NetworksCreateCtrl', ['$scope', '$route', '$location', '$http', 'Title', 'metadata', 'collection', 'network',
    function($scope, $route, $location, $http, Title, metadata, collection, network) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.network = network;

}]);
