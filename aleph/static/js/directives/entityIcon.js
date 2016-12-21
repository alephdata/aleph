import aleph from '../aleph';

aleph.directive('entityIcon', ['Metadata', function(Metadata) {
  var schemata = {};

  Metadata.get().then(function(md) {
    schemata = md.schemata;
  });

  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'schema': '='
    },
    templateUrl: 'templates/entities/icon.html',
    link: function (scope, element, attrs, model) {
      scope.data = schemata[scope.schema];
    }
  };
}]);
