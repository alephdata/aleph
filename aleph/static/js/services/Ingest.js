import aleph from '../aleph';

aleph.factory('Ingest', ['$uibModal', '$q', '$http', 'Metadata', 'Query',
    function($uibModal, $q, $http, Metadata, Query) {

  return {
    files: function(files, collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/documents/ingest.html',
        controller: 'IngestFilesCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          files: function() {
            return files || [];
          },
          collection: function() {
            return collection;
          },
          metadata: Metadata.get()
        }
      });
      return instance.result;
    }
  };
}]);
