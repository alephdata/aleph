aleph.directive('searchFrame', ['$uibModal', '$route', 'Query', 'Metadata', 'Authz',
    function ($uibModal, $route, Query, Metadata, Authz) {
  return {
    restrict: 'EA',
    scope: {
      'result': '='
    },
    transclude: true,
    templateUrl: 'search_frame.html',
    link: function (scope, element, attrs, model) {
      scope.query = Query;
      scope.metadata = {};
      scope.sources = {};
      scope.session = {};
      scope.watchlists = {};
      scope.fields = {};

      Metadata.get().then(function(metadata) {
        scope.sources = metadata.sources;
        scope.watchlists = metadata.watchlists;
        scope.fields = metadata.fields;
        scope.session = metadata.session;
        scope.metadata = metadata;
      });

      scope.showListFacet = function(id) {
        return Query.load().watchlist.indexOf(id) == -1;
      };

      scope.showFieldFacet = function(field) {
        return Query.load().facet.indexOf(field) == -1;
      };

      scope.canEditSource = function(source) {
        return Authz.source(Authz.WRITE, source.id);
      };

      scope.editSource = function(source, $event) {
        $event.stopPropagation();
        var instance = $uibModal.open({
          templateUrl: 'sources_edit.html',
          controller: 'SourcesEditCtrl',
          backdrop: true,
          size: 'lg',
          resolve: {
            source: ['$q', '$http', function($q, $http) {
              var dfd = $q.defer();
              $http.get('/api/1/sources/' + source.id).then(function(res) {
                dfd.resolve(res.data);
              }, function(err) {
                dfd.reject(err);
              });
              return dfd.promise;
            }],
            users: loadUsers
          }
        });

        instance.result.then(function() {
          console.log('Reload');
          $route.reload();
        });
      };

    }
  };
}]);
