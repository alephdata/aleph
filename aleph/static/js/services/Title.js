
aleph.factory('Title', ['$rootScope', function($rootScope) {
  var element = angular.element('title')[0],
      originalTitle = element.innerHTML;
      
  return {
      set: function(text, navSection) {
        element.innerHTML = text + ' - ' + originalTitle;
        $rootScope.navSection = navSection;
      },
      getSiteTitle: function() {
        return originalTitle;
      }
  };
}]);
