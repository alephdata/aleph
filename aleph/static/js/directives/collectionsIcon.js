import aleph from '../aleph';

aleph.directive('collectionsIcon', [function() {
  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'collection': '=',
      'label': '='
    },
    templateUrl: 'templates/collections/icon.html',
    link: function (scope, element, attrs, model) {
      scope.label = !!scope.label;
      scope.icon = 'fa-lock';
      scope.tooltip = 'Visible to some users';

      if (!angular.isUndefined(scope.collection)) {
        if (angular.isUndefined(scope.collection.public) || scope.collection.public) {
          scope.icon = 'fa-globe';
          scope.tooltip = null;
        }
      }

      if (scope.label) {
        scope.labelText = scope.tooltip || 'Public';
        scope.tooltip = null;
      }
    }
  };
}]);
