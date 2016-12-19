import aleph from '../aleph';

aleph.factory('Title', ['$rootScope', 'Metadata', function($rootScope, Metadata) {
  var element = angular.element('title')[0],
      appTitle = '', viewTitle = 'Welcome';

  function set(text, navSection) {
    viewTitle = text;
    element.innerHTML = viewTitle + ' - ' + appTitle;
    $rootScope.navSection = navSection;
  }

  Metadata.get().then(function(metadata) {
    appTitle = metadata.app.title;
    set(viewTitle, $rootScope.navSection);
  });

  return {set: set};
}]);
