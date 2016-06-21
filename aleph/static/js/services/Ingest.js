aleph.factory('Ingest', ['$uibModal', '$q', '$http', 'Metadata', 'Query',
    function($uibModal, $q, $http, Metadata, Query) {

  return {
    files: function(files) {
      var instance = $uibModal.open({
        templateUrl: 'templates/ingest_files.html',
        controller: 'IngestFilesCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          files: function() {
            return files || [];
          },
          metadata: Metadata.get()
        }
      });
      return instance.result;
    }
  };
}]);
