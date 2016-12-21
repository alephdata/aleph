import aleph from '../aleph';

aleph.directive('entityJurisdiction', ['Metadata', function(Metadata) {
  var jurisdictions = [], countries = {};

  Metadata.get().then(function(metadata) {
    countries = metadata.countries;
    jurisdictions.push({
      label: 'No country selected',
      value: null
    });
    for (var value in metadata.countries) {
      jurisdictions.push({
        value: value,
        label: metadata.countries[value]
      });
    }
    jurisdictions = jurisdictions.sort(function(a, b) {
      if (a.value == null) return -1;
      if (b.value == null) return 1;
      return a.label.localeCompare(b.label);
    });
  });

  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'entity': '=',
      'simple': '='
    },
    templateUrl: 'templates/entities/jurisdiction.html',
    link: function (scope, element, attrs, model) {
      scope.getJurisdictions = function() {
        return jurisdictions;
      };

      scope.value = function(code) {
        if (arguments.length) {
          scope.entity.data.country = code;
        } else {
          return countries[scope.entity.data.country];
        }
      };

      scope.isPerson = function() {
        return scope.entity.schema == 'Person';
      };
    }
  };
}]);
