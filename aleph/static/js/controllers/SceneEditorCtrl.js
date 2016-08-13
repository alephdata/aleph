aleph.controller('SceneEditorCtrl', ['$scope', '$route', '$location', '$http', 'Scene', 'Title', 'metadata', 'collection',
    function($scope, $route, $location, $http, Scene, Title, metadata, collection) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.metadata = metadata;

  $scope.scene = {
    collection_id: collection.id
  };
}]);
