aleph.directive('entityIcon', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'type': '='
    },
    templateUrl: 'entity_icon.html',
    link: function (scope, element, attrs, model) {
    }
  };
}]);
