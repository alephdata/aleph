aleph.controller('NetworksEditorCtrl', ['$scope', '$route', '$location', '$http', 'Scene', 'Title', 'metadata', 'collection',
    function($scope, $route, $location, $http, Scene, Title, metadata, collection) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.metadata = metadata;

  $scope.network = {
    collection_id: collection.id
  };
}]);
