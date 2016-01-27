
aleph.directive('metadataSidebar', ['$http', '$q', 'Metadata',
    function($http, $q, Metadata) {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'metadata_sidebar.html',
    link: function (scope, element, attrs, model) {
      var metadata = {languages: {}, countries: {}};

      Metadata.get().then(function(md) {
        metadata = md;
      });

      scope.getLanguageLabel = function(code) {
        var label = metadata.languages[code];
        return label || code;
      };

      scope.getCountryLabel = function(code) {
        var label = metadata.countries[code];
        return label || code;
      };
    }
  };
}]);
