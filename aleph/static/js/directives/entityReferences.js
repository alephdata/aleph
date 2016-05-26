
aleph.directive('entityReferences', ['$location', function($location) {
  return {
    restrict: 'E',
    scope: {
      'references': '='
    },
    templateUrl: 'templates/entity_references.html',
    link: function (scope, element, attrs, model) {
      scope.lookupReference = function(ref) {
        $location.path('/search');
        $location.search({'entity': ref.entity.id});
      }
    }
  };
}]);
