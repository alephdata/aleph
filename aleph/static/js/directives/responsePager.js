import aleph from '../aleph';

aleph.directive('responsePager', ['$timeout', function ($timeout) {
  return {
    restrict: 'E',
    scope: {
      'response': '=',
      'load': '&load'
    },
    templateUrl: 'templates/response_pager.html',
    link: function (scope, element, attrs, model) {
      var pageOffset = function(page) {
        return (page-1) * scope.response.limit;
      }

      scope.$watch('response', function(e) {
        scope.showPager = false;
        scope.pages = [];
        var pagesCount = Math.ceil(scope.response.total / scope.response.limit);
        if (pagesCount <= 1) {
          return;
        }
        var pages = [],
          current = (scope.response.offset / scope.response.limit) + 1,
          num = Math.ceil(scope.response.total / scope.response.limit),
          range = 2,
          low = current - range,
          high = current + range;

        if (low < 1) {
          low = 1;
          high = Math.min((2*range)+1, num);
        }
        if (high > num) {
          high = num;
          low = Math.max(1, num - (2*range)+1);
        }
        for (var page = low; page <= high; page++) {
          pages.push({
            page: page,
            offset: pageOffset(page),
            current: page == current
          });
        }
        scope.prev = current == low ? -1 : pageOffset(current - 1);
        scope.next = current == high ? -1 : pageOffset(current + 1);
        scope.showPager = true;
        scope.pages = pages;
      });
    }
  };
}]);
