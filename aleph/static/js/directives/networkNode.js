aleph.directive('networkNode', ['$http', '$httpParamSerializer', 'Entity', 'Document',
    function($http, $httpParamSerializer, Entity, Document) {

  return {
    restrict: 'E',
    require: '^networkWorkspace',
    scope: {
      'node': '='
    },
    templateUrl: 'templates/networks/node.html',
    link: function (scope, element, attrs, ctrl) {
      scope.query = {text: ''};
      scope.hasEdges = null;
      scope.attributes = scope.node.getAttributes();

      scope.search = function() {
        var params = {
          ignore: ctrl.getEdgeIds(),
          limit: 10,
          directed: false,
          source_id: scope.node.id,
          text: scope.query.text
        };
        $http.post('/api/1/graph/edges', params).then(function(res) {
          if (scope.hasEdges === null) {
            scope.hasEdges = res.data.results.length > 0;
          }
          scope.suggestedEdges = res.data.results.map(function(edge) {
            if (edge.$source.id == scope.node.id) {
              edge.$other = edge.$target;
            } else {
              edge.$other = edge.$source;
            }
            return edge;
          });
        });
      };

      scope.addEdge = function(edge) {
        var idx = scope.suggestedEdges.indexOf(edge);
        scope.suggestedEdges.splice(idx, 1);
        var edge = ctrl.addEdge(edge);
        ctrl.completeNode(edge.source);
        ctrl.completeNode(edge.target);
        ctrl.update();
        scope.search();
      };

      scope.remove = function() {
        ctrl.removeNode(scope.node);
      };

      scope.getDocumentUrl = function() {
        return Document.getUrl({
          id: scope.node.data.alephDocument,
          type: scope.node.data.alephType
        })
      };

      scope.getSearchQuery = function() {
        var query = {}, data = scope.node.data;
        if (data.$label == 'Phone') {
          query['filter:phone_numbers'] = data.fingerprint;
        } else if (data.$label == 'Email') {
          query['filter:emails'] = data.fingerprint;
        } else if (data.alephEntity) {
          query['entity'] = data.alephEntity;
        } else {
          query['q'] = data.name;
        }
        return $httpParamSerializer(query);
      };

      scope.editEntity = function() {
        Entity.edit(scope.node.data.alephEntity);
      };

      scope.search();
    }
  };
}]);
