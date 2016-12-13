aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$anchorScroll', '$httpParamSerializer', '$uibModal', 'cfpLoadingBar', 'Alert', 'Metadata',
    function($scope, $rootScope, $location, $anchorScroll, $httpParamSerializer, $uibModal, cfpLoadingBar, Alert, Metadata) {

  $scope.session = {logged_in: false};
  $scope.routeLoaded = false;
  $scope.routeFailed = false;
  $scope.routeError = null;
  $scope.navbarCollapsed = true;

  Metadata.get().then(function(metadata) {
    $scope.session = metadata.session;
  });

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    cfpLoadingBar.start();
    $scope.reportLoading(true);
  });

  $rootScope.$on("$routeChangeSuccess", function (event, next, current) {
    cfpLoadingBar.complete();
    $scope.reportLoading(false);
  });

  $rootScope.$on("$routeChangeError", function (event, next, current, rejection) {
    cfpLoadingBar.complete();
    $scope.routeFailed = true;
    $scope.routeError = rejection;
    // console.log('Error', rejection);
  });

  $scope.keyDownNotify = function($event) {
    if(angular.lowercase($event.target.tagName) == 'body') {
      $scope.$broadcast('key-pressed', $event.keyCode);
    }
  };

  $rootScope.reportLoading = function(flag) {
    // $scope.routeLoaded = !flag;
    $scope.routeLoaded = true;
    if (flag) {
      $anchorScroll();
      $scope.routeFailed = false;
      $scope.routeError = null;
    }
  };

  $rootScope.triggerLogin = function() {
    if ($scope.session.providers.length == 1) {
      var url = $httpParamSerializer({next: $location.url()});
      document.location.href = $scope.session.providers[0].login + '?' + url;
    } else {
      $uibModal.open({
        templateUrl: 'templates/login.html',
        controller: 'SessionCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          metadata: loadMetadata
        }
      });
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
      templateUrl: 'templates/alerts/manage.html',
      controller: 'AlertsManageCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        alerts: Alert.index()
      }
    });
  };
}]);
