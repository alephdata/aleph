
aleph.factory('Title', ['$rootScope', 'Metadata', function($rootScope, Metadata) {
  var element = angular.element('title')[0],
      appTitle = 'Open Gazettes South Africa';

  Metadata.get().then(function(metadata) {
    appTitle = metadata.app.title;
  });
      
  return {
    set: function(text, navSection) {
      element.innerHTML = text + ' - ' + appTitle;
      $rootScope.navSection = navSection;
    }
  };
}]);
