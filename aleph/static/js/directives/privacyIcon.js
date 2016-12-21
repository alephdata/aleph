import aleph from '../aleph';

aleph.directive('privacyIcon', [function() {
  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'subject': '=',
      'label': '='
    },
    templateUrl: 'templates/util/privacy_icon.html',
    link: function (scope, element, attrs, model) {
      scope.label = !!scope.label;
      scope.icon = 'fa-lock';
      scope.tooltip = 'Visible to some users';

      if (!angular.isUndefined(scope.subject)) {
        if (angular.isUndefined(scope.subject.public) || scope.subject.public) {
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
