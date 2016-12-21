import aleph from '../aleph';

aleph.directive('errorMessage', ['$route', '$location', '$rootScope', function($route, $location, $rootScope) {
  return {
    restrict: 'E',
    scope: {
      'error': '=',
      'session': '='
    },
    templateUrl: 'templates/error_message.html',
    link: function (scope, element, attrs) {
      scope.mode = 'other';

      scope.login = function() {
        $rootScope.triggerLogin();
      };

      scope.$watch('error', function(error) {
        if (!error) {
          return;
        }

        scope.message = "He's dead, Jim.";
        if (error.data && error.data.message) {
          scope.message = error.data.message;
        }
        if (error.status && (error.status == 403 || error.status == 401)) {
          scope.mode = 'denied';
          return;
        }
        if (error.status == -1 && error.data === null) {
          scope.message = 'Connection failure.';
        }
      });
    }
  };
}]);
