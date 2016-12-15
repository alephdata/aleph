aleph.directive('searchFacet', ['Authz', 'Entity', function(Authz, Entity) {
  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'result': '=',
      'query': '=',
      'facet': '@',
      'filter': '@',
      'title': '@',
      'expandable': '='
    },
    templateUrl: 'templates/util/search_facet.html',
    link: function (scope, element, attrs, model) {
      scope.authz = Authz;
      scope.filter = scope.filter || scope.facet;
      scope.expandable = !!scope.expandable;

      scope.$watch('result', function(result) {
        var facets = result.facets || {},
            facet = result.facets[scope.facet] || {},
            missing = angular.isUndefined(result.facets[scope.facet]),
            type = facet.type || '';
        scope.hidden = missing && !scope.expandable;
        scope.collapsed = missing && scope.expandable;
        scope.values = facet.values || [];
        scope.empty = scope.values.length < 1;
        scope.isEntity = type == 'entity';
        scope.isSchema = type == 'schema';
        scope.isCollection = type == 'collection';
      });

      scope.createEntity = function($event) {
        $event.stopPropagation();
        Entity.create({'name': scope.query.state.q});
      };

      scope.editEntity = function(entity, $event) {
        $event.stopPropagation();
        Entity.edit(entity.id);
      };

    }
  };
}]);
