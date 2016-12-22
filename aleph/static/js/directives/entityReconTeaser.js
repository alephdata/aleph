import aleph from '../aleph';

aleph.directive('entityReconTeaser', ['Metadata', function(Metadata) {
  var metadata = {};
  Metadata.get().then(function(md) {
    metadata = md;
  })

  return {
    restrict: 'E',
    transclude: false,
    scope: {},
    templateUrl: 'templates/entities/recon.html',
    link: function (scope, element, attrs, model) {
      scope.getUrl = function() {
        var url = metadata.app.url + 'api/freebase/reconcile';
        if (metadata.session.logged_in) {
          url += '?api_key=' + metadata.session.api_key;
        }
        return url;
      };
    }
  };
}]);
