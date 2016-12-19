import aleph from '../aleph';

aleph.directive('collectionsIcon', [function() {
  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'collection': '='
    },
    templateUrl: 'templates/collections/icon.html',
    link: function (scope, element, attrs, model) {
      scope.icon = 'fa-lock';
      scope.tooltip = 'Only available to some users';

      if (!angular.isUndefined(scope.collection)) {
        if (angular.isUndefined(scope.collection.public) || scope.collection.public) {
          scope.icon = 'fa-globe';
          scope.tooltip = null;
        }
      }
    }
  };
}]);
