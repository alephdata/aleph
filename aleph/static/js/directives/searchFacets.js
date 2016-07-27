aleph.directive('searchFacets', ['$location', '$q', '$route', '$http', '$timeout', '$timeout', 'Authz', 'Entity',
    function($location, $q, $route, $http, $timeout, $timeout, Authz, Entity) {
  return {
    restrict: 'E',
    scope: {
      query: '=',
      result: '=',
      metadata: '=',
      collection: '='
    },
    templateUrl: 'templates/search_facets.html',
    link: function (scope, element, attrs) {
      scope.authz = Authz;
      scope.entityFacet = [];
      scope.facets = [];

      scope.createEntity = function($event) {
        $event.stopPropagation();
        Entity.create({'name': scope.query.state.q});
      };

      scope.editEntity = function(entity, $event) {
        $event.stopPropagation();
        Entity.edit(entity.id);
      };

      scope.$watch('result', function(result) {
        if (!result || result.error) {
          return;
        }
        var entityValues = result.facets.entities.values;
        scope.entityFacet = scope.query.sortFacet(entityValues, 'entity');

        var queryFacets = scope.query.getArray('facet'),
            facets = [];

        for (var name in scope.metadata.fields) {
          var facet = {
            field: name,
            label: scope.metadata.fields[name],
            active: queryFacets.indexOf(name) != -1
          };
          if (result.facets[name]) {
            var values = result.facets[name].values;
            facet.values = scope.query.sortFacet(values, 'filter:' + name);  
          }
          facets.push(facet);
        }
        scope.facets = facets;
      });
    }
  };
}]);
