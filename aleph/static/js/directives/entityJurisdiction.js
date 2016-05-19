aleph.directive('entityJurisdiction', ['Metadata', function(Metadata) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'entity': '='
    },
    templateUrl: 'templates/entity_jurisdiction.html',
    link: function (scope, element, attrs, model) {
      scope.jurisdictions = [];

      Metadata.get().then(function(metadata) {
        var jurisdictions = [{
          label: 'No country selected',
          value: null
        }];
        for (var value in metadata.countries) {
          jurisdictions.push({
            value: value,
            label: metadata.countries[value]
          });
        }
        scope.jurisdictions = jurisdictions.sort(function(a, b) {
          if (a.value == null) return -1;
          if (b.value == null) return 1;
          return a.label.localeCompare(b.label);
        });
      });

      scope.isPerson = function() {
        return scope.entity.$schema == '/entity/person.json#';
      };
    }
  };
}]);
