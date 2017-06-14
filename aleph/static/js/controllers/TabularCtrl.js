import aleph from '../aleph';
import {ensureArray, filterFloat} from '../util';

aleph.controller('TabularCtrl', ['$scope', '$location', '$http', '$sce', '$sanitize', '$filter', 'Authz', 'Title', 'History', 'Document', 'data', 'children',
    function($scope, $location, $http, $sce, $sanitize, $filter, Authz, Title, History, Document, data, children) {

  $scope.doc = data.doc;
  $scope.children = children;
  $scope.table = data.table;
  $scope.records = data.records;
  $scope.moreLoading = false;
  $scope.searchCtx = $location.search().ctx;
  $scope.textQuery = $location.search().dq;

  Title.set(data.doc.title || data.doc.file_name, "documents");

  $scope.getClass = function(row, col) {
    var value = row[col.name];
    if (value === null || value === undefined) {
      return;
    }
    if (!isNaN(filterFloat(value))) {
      return 'numeric';
    }
  };

  $scope.formatCell = function(row, col) {
    var data = row.data || {},
        value = data[col.name];
    if (value === null || value === undefined) {
      return $sce.trustAsHtml('&nbsp;');
    }
    if (angular.isString(value)) {
      if (value.toLowerCase().startsWith('http://') || value.toLowerCase().startsWith('https://')) {
        value = '<a target="_new" href=' + value + '>' + $sanitize(value) + '</a>'
        return $sce.trustAsHtml(value);
      }
    }
    return $sce.trustAsHtml($sanitize(value));
  };

  $scope.openParent = function() {
    $location.url(Document.getUrl($scope.doc.parent));
  };

  $scope.backToSearch = function() {
    History.back();
  };

  $scope.hasBackSearch = function() {
    return History.hasLastSearch();
  };

  $scope.updateQuery = function() {
    var q = $location.search();
    q.dq = $scope.textQuery;
    // q.q = null; // wat.
    q.row = null;
    $location.search(q);
  };

  $scope.isHighlighted = function(row) {
    var rows = ensureArray($location.search().row),
        id = row._id + '';
    return rows.indexOf(id) !== -1;
  };

  $scope.loadOffset = function(offset) {
    var query = $location.search();
    query.offset = offset;
    $location.search(query);
  };
}]);
