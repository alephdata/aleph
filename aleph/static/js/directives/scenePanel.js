aleph.directive('scenePanel', ['$http', function($http) {
  return {
    restrict: 'E',
    require: '^sceneWorkspace',
    templateUrl: 'templates/scene_panel.html',
    link: function (scope, element, attrs, ctrl) {
      scope.search = {'text': ''};

      scope.searchNodes = function() {
        var params = {
          collection_id: ctrl.collection_id,
          ignore: ctrl.getNodeIds(),
          limit: 10
        };
        params = angular.extend(params, scope.search);
        $http.post('/api/1/graph/nodes', params).then(function(res) {
          scope.suggestedNodes = res.data.results;
        });  
      };

      scope.addNode = function(node) {
        var idx = scope.suggestedNodes.indexOf(node);
        scope.suggestedNodes.splice(idx, 1);
        ctrl.addNode(node);
        scope.searchNodes();
      };

      scope.searchNodes();
    }
  };
}]);
