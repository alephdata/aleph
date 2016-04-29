aleph.directive('entityIcon', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'schema': '='
    },
    templateUrl: 'templates/entity_icon.html',
    link: function (scope, element, attrs, model) {
    }
  };
}]);
