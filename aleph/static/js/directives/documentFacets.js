import aleph from '../aleph';

aleph.directive('searchFacets', [function() {
  return {
    restrict: 'E',
    scope: {
      query: '=',
      result: '=',
      metadata: '=',
      collection: '='
    },
    templateUrl: 'templates/documents/facets.html',
    link: function (scope, element, attrs) {
      var facets = [];
      for (var name in scope.metadata.fields) {
        var label = scope.metadata.fields[name];
        facets.push({field: name, label: label});
      }
      scope.facets = facets;
    }
  };
}]);
