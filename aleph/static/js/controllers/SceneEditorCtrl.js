
aleph.controller('SceneEditorCtrl', ['$scope', '$route', '$location', '$http', 'Scene', 'Title', 'metadata', 'collection',
    function($scope, $route, $location, $http, Scene, Title, metadata, collection) {

  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.scene = Scene.new(metadata, collection);
  $scope.scene.addNode({'name': 'Ten Characters', 'id': 3});

  $scope.search = {'text': ''};
  Title.set(collection.label, "collections");  

  $scope.searchNodes = function() {
    var params = {collection_id: collection.id, limit: 10};
    params = angular.extend(params, $scope.search);
    $http.get('/api/1/graph/nodes', {params: params}).then(function(res) {
      // console.log(res.data);
      $scope.suggestedNodes = res.data.results;
      $scope.scene.addNode(res.data.results[0]);
      // $scope.scene.fromJSON(res.data);
    });  
  };
  
  $scope.searchNodes();
}]);
