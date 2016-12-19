import aleph from '../aleph';

aleph.factory('Authz', ['$rootScope', function($rootScope) {

  var collection = function(right, collection_id) {
    if ($rootScope.session.permissions && $rootScope.session.permissions[right]) {
      return $rootScope.session.permissions[right].indexOf(collection_id) != -1;
    }
    return false;
  };

  return {
    collection: collection,
    entityWrite: function(entity) {
      return collection('write', entity.collection_id);
    },
    documentWrite: function(doc) {
      return collection('write', doc.collection_id);
    },
    collectionWrite: function(collection_id) {
      return collection('write', collection_id);
    },
    logged_in: function() {
      return $rootScope.session && $rootScope.session.logged_in;
    },
    is_admin: function() {
      return $rootScope.session && $rootScope.session.logged_in && $rootScope.session.role.is_admin;
    },
    READ: 'read',
    WRITE: 'write'
  }
}]);
