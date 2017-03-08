import aleph from '../aleph';

aleph.directive('collectionsScreen', ['$http', '$q', '$location', 'Authz', 'Collection', 'Ingest',
    function($http, $q, $location, Authz, Collection, Ingest) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'collection': '=',
      'section': '@'
    },
    templateUrl: 'templates/collections/screen.html',
    link: function (scope, element, attrs) {
      scope.is_admin = Authz.is_admin();
      scope.writeable = Authz.collection(Authz.WRITE, scope.collection.id);
      scope.showLeads = scope.collection.lead_count;
      scope.disableDocuments = !scope.collection.doc_count;
      scope.disableEntities = !scope.collection.entity_count;

      scope.uploads = [];

      scope.$watch('uploads', function(files) {
        if (files.length > 0) {
          scope.ingestFiles(files);
        }
      });

      scope.ingestFiles = function(files, $event) {
        if ($event) {
          $event.stopPropagation();
        }
        Ingest.files(files, scope.collection).then(function() {
          scope.uploads = [];
          $location.path('/collections/' + scope.collection.id);
        }, function(err) {
          scope.uploads = [];
        });
      };
    }
  };
}]);
