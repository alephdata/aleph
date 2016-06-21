aleph.controller('IngestFilesCtrl', ['$scope', '$uibModalInstance', 'Upload', 'metadata', 'files',
    function($scope, $uibModalInstance, Upload, metadata, files) {

  $scope.files = files;
  $scope.collectionCallback = null;

  $scope.progress = null;

  $scope.canUpload = function() {
    if (!$scope.files.length) {
      return false;
    }
    return $scope.uploadForm.$valid && $scope.collectionCallback != null;
  };

  $scope.setCollection = function(callback) {
    $scope.collectionCallback = callback;
  };

  $scope.getFileText = function() {
    if (!$scope.files.length) {
      return 'No files selected';
    }
    return $scope.files.map(function(f) {
      return f.name;
    }).join(', ');
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.isUploading = function() {
    return $scope.progress !== null;
  };

  $scope.upload = function() {
    if (!$scope.canUpload()) {
      return false;
    }
    $scope.progress = 0;
    $scope.collectionCallback().then(function(collection) {
      Upload.upload({
        url: '/api/1/collections/' + collection.id + '/ingest',
        data: {file: $scope.files}
      }).then(function(res) {
        $uibModalInstance.close(res.data);
      }, function(err) {
        $scope.progress = null;
      }, function(evt) {
        $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
      });
    });
  };

}]);
