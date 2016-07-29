
aleph.controller('SceneEditorCtrl', ['$scope', '$route', '$location', '$http', 'Scene', 'metadata', 'collection',
    function($scope, $route, $location, $http, Scene, metadata, collection) {

  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.scene = Scene.new(metadata, collection);

  var params = {'collection_id': collection.id};
  $http.get('/api/1/graph/suggest', {params: params}).then(function(res) {
    $scope.scene.fromJSON(res.data);
  });

}]);
