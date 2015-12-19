aleph.directive('sourcesFrame', ['$http', 'QueryContext', function($http, QueryContext) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'source': '='
    },
    templateUrl: 'sources_frame.html',
    link: function (scope, element, attrs, model) {
      scope.sources = {};
      QueryContext.get().then(function(data) {
        scope.sources = data.sources;
      });
    }
  };
}]);
