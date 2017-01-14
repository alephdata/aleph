import aleph from '../aleph';

aleph.directive('entitySource', ['Dataset', 'Collection', function(Dataset, Collection) {
  return {
    restrict: 'E',
    transclude: false,
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
        if (scope.facets) {
          for (var i in facets.dataset.values) {
            var cand = facets.dataset.values[i];
            if (cand.id == scope.entity.dataset) {
              scope.dataset = cand;
            }
          }
        }
        if (!angular.isDefined(scope.dataset)) {
          Dataset.getBase(scope.entity.dataset).then(function(dataset) {
            scope.dataset = dataset;
          })
        }
      }

      if (scope.isCollection) {
        if (scope.facets) {
          for (var i in facets.collections.values) {
            var cand = facets.collections.values[i];
            if (parseInt(cand.id, 10) == scope.entity.collection_id) {
              scope.collection = cand;
            }
          }
        }

        if (!angular.isDefined(scope.collection)) {
          Collection.get(scope.entity.collection_id).then(function(coll) {
            scope.collection = coll;
          })
        }
      }
    }
  };
}]);
