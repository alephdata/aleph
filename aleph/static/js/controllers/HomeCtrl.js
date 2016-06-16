
aleph.controller('HomeCtrl', ['$scope', '$location', '$route', 'Collection', 'Authz', 'Role', 'Title', 'data', 'metadata', 'collections',
    function($scope, $location, $route, Collection, Authz, Role, Title, data, metadata, collections) {

  $scope.documents = data.documents;
  $scope.session = metadata.session;
  $scope.metadata = metadata;
  $scope.title = Title.getSiteTitle();
  $scope.query = {q: ''};
  $scope.authz = Authz;

  Title.set("Welcome");

  $scope.submitSearch = function(form) {
    $location.path('/search');
    $location.search({q: $scope.query.q});
  };

  $scope.editCollection = function(collection, $event) {
    $event.stopPropagation();
    Collection.edit(collection).then(function() {
      $route.reload();
    });
  };

  var handleCollections = function(collections, data) {
    var documentCollections = {},
        watchlists = [];
    for (var i in data.documents.facets.collections.values) {
      var collection = data.documents.facets.collections.values[i],
          category = collection.category || 'other';
      if (!documentCollections[category]) {
        documentCollections[category] = [collection];
      } else {
        documentCollections[category].push(collection);
      }
    }

    for (var i in collections) {
      var collection = collections[i];
      if (collection.category == 'watchlist') {
        watchlists.push(collection);
      }
    }
    $scope.watchlists = watchlists.sort(function(a, b) {
      return a.label.localeCompare(b.label);
    });
    $scope.documentCollections = documentCollections;
  }

  handleCollections(collections, data);
}]);
