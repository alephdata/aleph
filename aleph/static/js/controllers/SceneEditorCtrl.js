
aleph.controller('SceneEditorCtrl', ['$scope', '$route', '$location', 'Scene', 'metadata', 'collection',
    function($scope, $route, $location, Scene, metadata, collection) {

  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.scene = Scene.new(metadata, collection);



}]);
