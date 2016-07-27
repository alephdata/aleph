aleph.directive('collectionsScreen', ['$http', '$q', '$location', 'Authz', 'Collection',
    function($http, $q, $location, Authz, Collection) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'collection': '=',
      'section': '='
    },
    templateUrl: 'templates/collections_screen.html',
    link: function (scope, element, attrs) {
      scope.authz = Authz;
    }
  };
}]);
