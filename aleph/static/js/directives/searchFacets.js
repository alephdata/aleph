aleph.directive('searchFacets', ['$location', '$q', '$route', '$http', '$timeout', '$timeout', 'Authz', 'Entity',
    function($location, $q, $route, $http, $timeout, $timeout, Authz, Entity) {
  return {
    restrict: 'E',
    scope: {
      query: '=',
      result: '=',
      metadata: '=',
      collection: '=',
      only: '@',
      exclude: '@',
    },
    templateUrl: 'templates/documents/search_facets.html',
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

        var queryFacets = scope.query.getArray('facet'),
            facets = [],
            only = scope.only ? scope.only.split(",") : [],
            exclude = scope.exclude ? scope.exclude.split(",") : [];

        for (var name in scope.metadata.fields) {
          if (only.length && only.indexOf(name) == -1 ||
              exclude.indexOf(name) != -1)
            continue;

          var facet = {
            field: name,
            label: scope.metadata.fields[name],
            active: queryFacets.indexOf(name) != -1
          };
          if (result.facets && result.facets[name]) {
            facet.values = result.facets[name].values;
          }
          facets.push(facet);
        }
        scope.facets = facets;
      });
    }
  };
}]);
