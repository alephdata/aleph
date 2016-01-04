aleph.directive('sourcesFrame', ['$http', 'Metadata', function($http, Metadata) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'source': '='
    },
    templateUrl: 'sources_frame.html',
    link: function (scope, element, attrs, model) {
      scope.sources = {};
      Metadata.get().then(function(data) {
        scope.sources = data.sources;
      });
    }
  };
}]);
