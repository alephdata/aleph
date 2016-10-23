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

      scope.show_paths = !!scope.collection.path_count;
      scope.show_networks = !!scope.collection.network_count;
      scope.show_states = scope.collection.can_edit && scope.collection.crawler_state_count;
      scope.disable_documents = !scope.collection.doc_count;
      scope.disable_entities = !scope.collection.entity_count;
      
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
          $location.path('/collections/' + scope.collection.id + '/states');
        }, function(err) {
          scope.uploads = [];
        });
      };
    }
  };
}]);
