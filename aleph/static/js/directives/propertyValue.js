aleph.directive('propertyValue', ['Metadata', function(Metadata) {
  var metadata = {};
  Metadata.get().then(function(md) {
    metadata = md;
  });

  return {
    restrict: 'E',
    scope: {
      'value': '=',
      'property': '='
    },
    templateUrl: 'templates/entities/property_value.html',
    link: function (scope, element, attrs, model) {
      scope.label = scope.value;
      if (scope.property.type == 'country') {
        scope.label = metadata.countries[scope.value] || scope.value;
      }
    }
  };
}]);


aleph.directive('propertyValues', [function() {
  return {
    restrict: 'E',
    scope: {
      'values': '=',
      'property': '='
    },
    templateUrl: 'templates/entities/property_values.html'
  };
}]);
