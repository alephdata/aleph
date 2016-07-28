aleph.directive('collectionsAdd', ['$http', '$q', '$location', 'Authz', 'Collection',
    function($http, $q, $location, Authz, Collection) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'class': '@'
    },
    templateUrl: 'templates/collections_add.html',
    link: function (scope, element, attrs) {
      scope.visible = Authz.logged_in();
      scope.collections = [];
      scope.parts = {};

      var loadCollections = function() {
        var dfd = $q.defer();
        Collection.getUserCollections().then(function(collections) {
          for (var i in collections) {
            var coll = collections[i];
            scope.parts[coll.id] = scope.doc.collection_id.indexOf(coll.id) > -1;
          }
          scope.collections = collections;
          dfd.resolve(collections);
        });
        return dfd.promise;
      };

      scope.toggleDropdown = function(open) {
        if (open && !scope.collections.length) {
          loadCollections();  
        }
      }

      scope.openCollection = function(collection, $event) {
        $event.stopPropagation();
        $location.search({});
        $location.path('/collections/' + collection.id);
      };

      scope.toggleCollection = function(collection) {
        var url = '/api/1/documents/' + scope.doc.id + '/collections';
        $http.get(url).then(function(res) {
          var collections = res.data;
          var idx = collections.indexOf(collection.id);
          if (idx == -1) {
            collections.push(collection.id);
          } else {
            collections.splice(idx, 1);
          }
          if (collections.length) {
            $http.post(url, collections).then(function(res) {
              scope.parts[collection.id] = idx == -1;
            });
          }
        });
      };

      scope.createCollection = function() {
        Collection.create().then(function(collection) {
          collection.can_add = true;
          collection.can_edit = true;
          scope.collections.unshift(collection);
          scope.toggleCollection(collection);
        });
      };
    }
  };
}]);
