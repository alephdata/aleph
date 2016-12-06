aleph.directive('entitySource', [function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'entity': '=',
      'facets': '='
    },
    templateUrl: 'templates/entities/source.html',
    link: function (scope, element, attrs, model) {
      scope.isDataset = !!scope.entity.dataset;
      scope.isCollection = !!scope.entity.collection_id;

      var facets = scope.facets || {};

      if (scope.isDataset) {
        for (var i in facets.dataset.values) {
          var cand = facets.dataset.values[i];
          if (cand.id == scope.entity.dataset) {
            scope.dataset = cand;
          }
        }
      }

      if (scope.isCollection) {
        for (var i in facets.collections.values) {
          var cand = facets.collections.values[i];
          if (parseInt(cand.id, 10) == scope.entity.collection_id) {
            scope.collection = cand;
          }
        }
      }
    }
  };
}]);
