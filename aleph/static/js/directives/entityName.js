import aleph from '../aleph';

aleph.directive('entityName', [function() {
  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'entity': '='
    },
    templateUrl: 'templates/entities/name.html',
    link: function (scope, element, attrs, model) {}
  };
}]);
