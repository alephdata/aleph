
aleph.directive('metadataSidebar', [function() {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'metadata_sidebar.html',
    link: function (scope, element, attrs, model) {
    }
  };
}]);
