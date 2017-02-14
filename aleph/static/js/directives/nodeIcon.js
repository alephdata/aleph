aleph.directive('nodeIcon', ['Metadata', function(Metadata) {
  var graph = {};

  Metadata.get().then(function(md) {
    graph = md.graph;
  });

  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'node': '='
    },
    templateUrl: 'templates/networks/icon.html',
    link: function (scope, element, attrs, model) {
      var codepoint = '\uf0c8';
      if (graph.active) {
        if (scope.node.$label == 'Entity' && scope.node.alephSchema) {
          codepoint = graph.icons[scope.node.alephSchema] || codepoint;
        } else {
          codepoint = graph.icons[scope.node.$label] || codepoint;
        }
      }
      scope.codepoint = codepoint;
    }
  };
}]);
