import aleph from '../aleph';

aleph.directive('collectionsReviewTeaser', [function() {
  return {
    restrict: 'E',
    scope: {
      'collection': '='
    },
    templateUrl: 'templates/collections/review_teaser.html',
    link: function (scope, element, attrs) {}
  };
}]);
