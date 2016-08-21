aleph.directive('networkLookup', ['$http', function($http) {
  return {
    restrict: 'E',
    require: '^networkWorkspace',
    templateUrl: 'templates/networks/lookup.html',
    link: function (scope, element, attrs, ctrl) {
      scope.query = {
        text: '',
        collectionFilter: true
      };

      scope.search = function() {
        var params = {
          context: ctrl.getNodeIds(),
          limit: 10,
          text: scope.query.text
        };
        if (scope.query.collectionFilter) {
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
        ctrl.completeEdges();
        scope.search();
      };

      scope.search();
    }
  };
}]);
