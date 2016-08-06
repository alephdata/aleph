
aleph.controller('SceneEditorCtrl', ['$scope', '$route', '$location', '$http', 'Scene', 'Title', 'metadata', 'collection',
    function($scope, $route, $location, $http, Scene, Title, metadata, collection) {

  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.scene = Scene.new(metadata, collection);

  $scope.search = {'text': ''};
  Title.set(collection.label, "collections");  

  $scope.searchNodes = function() {
    var params = angular.extend({'collection_id': collection.id}, $scope.search);
    $http.get('/api/1/graph/nodes', {params: params}).then(function(res) {
      console.log(res.data);
      $scope.suggestedNodes = res.data.results;
      // $scope.scene.fromJSON(res.data);
    });  
  };
  
  $scope.searchNodes();
}]);
