aleph.factory('Flash', ['$rootScope', '$timeout', function($rootScope, $timeout) {
  // Message flashing.
  var currentMessage = null;

  $rootScope.$on("$routeChangeSuccess", function() {
    currentMessage = null;
  });

  return {
    message: function(message, type) {
      currentMessage = [message, type];
      $timeout(function() {
        currentMessage = null;
      }, 2000);
    },
    getMessage: function() {
      return currentMessage;
    }
  };
}]);
