aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$anchorScroll', '$route', '$http', '$uibModal', '$q', 'Alert', 'Metadata', 'Ingest',
    function($scope, $rootScope, $location, $anchorScroll, $route, $http, $uibModal, $q, Alert, Metadata, Ingest) {

  $scope.session = {logged_in: false};
  $scope.routeLoaded = false;
  $scope.routeFailed = false;
  $scope.navbarCollapsed = true;
  $scope.uploads = [];

  $scope.$watch('uploads', function(files) {
    if (files.length) {
      $scope.ingestFiles(files);
    }
  });

  $scope.ingestFiles = function(files, $event) {
    if ($event) {
      $event.stopPropagation();  
    }
    Ingest.files(files).then(function() {
      $scope.uploads = [];
    }, function(err) {
      $scope.uploads = [];
    });
  };

  Metadata.get().then(function(metadata) {
    $scope.session = metadata.session;
  });

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    $scope.reportLoading(true);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, next, current) {
    $scope.reportLoading(false);
  });

  $rootScope.$on("$routeChangeError", function (event, next, current) {
    $scope.routeFailed = true;
  });

  $scope.keyDownNotify = function($event) {
    if(angular.lowercase($event.target.tagName) == 'body') {
      $scope.$broadcast('key-pressed', $event.keyCode);
    }
  };

  $rootScope.reportError = function(message) {
    $scope.routeFailed = true;
  };

  $rootScope.reportLoading = function(flag) {
    $scope.routeLoaded = !flag;
    if (flag) {
      $anchorScroll();
      $scope.routeFailed = false;
    }
  };

  $scope.editProfile = function($event) {
    $event.stopPropagation();
    var d = $uibModal.open({
        templateUrl: 'templates/profile.html',
        controller: 'ProfileCtrl',
        backdrop: true,
        resolve: {
          metadata: loadMetadata
        }
    });
  };

  $scope.manageAlerts = function($event) {
    $event.stopPropagation();
    var instance = $uibModal.open({
      templateUrl: 'templates/alerts_manage.html',
      controller: 'AlertsManageCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        alerts: Alert.index()
      }
    });
  };

}]);
