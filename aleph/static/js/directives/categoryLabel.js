import aleph from '../aleph';

aleph.directive('categoryLabel', ['Metadata', function(Metadata) {
  var categories = {};

  Metadata.get().then(function(md) {
    categories = md.categories;
  });

  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'subject': '='
    },
    templateUrl: 'templates/util/category_label.html',
    link: function (scope, element, attrs, model) {
      scope.label = null;

      scope.$watch('subject', function(subject) {
        if (!subject) return;
        if (subject && subject.category && categories[subject.category]) {
          scope.label = categories[subject.category];
        }
      });
    }
  };
}]);
