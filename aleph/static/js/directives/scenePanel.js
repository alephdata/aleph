aleph.directive('scenePanel', ['$http', function($http) {
  return {
    restrict: 'E',
    require: '^sceneWorkspace',
    templateUrl: 'templates/scene_panel.html',
    link: function (scope, element, attrs, ctrl) {
      scope.search = {
        'text': '',
        'collectionFilter': true
      };

      scope.getIcon = function(data) {
        var type = data.alephSchema || data.$label;
        return ctrl.config.icons[type] || '\uf0c8'
      };

      scope.getColor = function(data) {
        var type = data.alephSchema || data.$label;
        return ctrl.config.colors[type] || '#777777'
      };

      scope.searchNodes = function() {
        var params = {
          ignore: ctrl.getNodeIds(),
          limit: 10,
          text: scope.search.text
        };
        if (scope.search.collectionFilter) {
          params.collection_id = ctrl.collection_id;
        }
        $http.post('/api/1/graph/nodes', params).then(function(res) {
          scope.suggestedNodes = res.data.results;
        });
      };

      scope.addNode = function(node) {
        var idx = scope.suggestedNodes.indexOf(node);
        scope.suggestedNodes.splice(idx, 1);
        ctrl.addNode(node);
        ctrl.completeNode(node);
        scope.searchNodes();
      };

      scope.searchNodes();
    }
  };
}]);
