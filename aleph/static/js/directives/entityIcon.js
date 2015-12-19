aleph.directive('entityIcon', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'category': '='
    },
    templateUrl: 'entity_icon.html',
    link: function (scope, element, attrs, model) {
    }
  };
}]);
