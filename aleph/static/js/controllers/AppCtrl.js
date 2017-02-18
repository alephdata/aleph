import aleph from '../aleph';
import loadMetadata from '../loaders/loadMetadata';

aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$anchorScroll', '$httpParamSerializer', '$uibModal', '$http', 'cfpLoadingBar', 'Alert', 'Metadata',
    function($scope, $rootScope, $location, $anchorScroll, $httpParamSerializer, $uibModal, $http, cfpLoadingBar, Alert, Metadata) {

  $scope.session = {logged_in: false};
  $scope.routeLoaded = false;
  $scope.routeFailed = false;
  $scope.routeError = null;
  $scope.navbarCollapsed = true;

  Metadata.get().then(function(metadata) {
    $scope.session = metadata.session;
    $scope.metadata = metadata;
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
    $scope.reportLoading(false);
    $scope.routeFailed = true;
    $scope.routeError = rejection;
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

  $rootScope.inviteEmail = function(provider) {
    var email = $rootScope.invitationEmail;
    var url = provider.register;
    $http.post(url, {email: email}).then(function(res){
      $rootScope.hideInvitationFormMsg = res.data.status;
    });
  };

  $rootScope.emailPasswordLogin = function() {
    var provider = $scope.session.providers.filter(
      function(p){ return p.name == 'password'});

    if(provider.length < 1) {
      return;
    };

    var url = provider[0].login;
    var email = $rootScope.loginEmail;
    var password = $rootScope.loginPassword;

    $http.post(url, {email: email, password: password}).then(function(res){
      document.location.href = '/';
    });
  };

  $rootScope.triggerLogin = function() {
    var providers = $scope.session.providers;

    if (providers.length == 1 && providers[0].name != 'password') {
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
