
aleph.factory('Title', [function() {
  var element = angular.element('title')[0],
      originalTitle = element.innerHTML;
      
  return {
      set: function(text) {
        element.innerHTML = text + ' - ' + originalTitle;
      },
      getSiteTitle: function() {
        return originalTitle;
      }
  };
}]);
