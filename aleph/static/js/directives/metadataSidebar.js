
aleph.directive('metadataSidebar', [function() {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'templates/metadata_sidebar.html',
    link: function (scope, element, attrs, model) {
    }
  };
}]);
