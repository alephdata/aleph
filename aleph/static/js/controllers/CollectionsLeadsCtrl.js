import aleph from '../aleph';

aleph.controller('CollectionsLeadsCtrl', ['$scope', '$http', '$timeout', '$anchorScroll', 'Lead', 'leads', 'metadata', 'collection', 'Authz', 'Title',
    function($scope, $http, $timeout, $anchorScroll, Lead, leads, metadata, collection, Authz, Title) {

  $scope.authz = Authz;
  $scope.collection = collection;
  $scope.metadata = metadata;

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  $scope.isEmpty = function() {
    return !$scope.query.isFiltered() && $scope.result.limit > 0 && $scope.result.total == 0;
  };

  $scope.setJudgement = function(lead, judgement) {
    var url = '/api/1/collections/' + collection.id + '/leads';
    lead.judgement = judgement;
    $http.post(url, lead).then(function(res) {
      console.log(res.data);
    });
  };

  $scope.$on('$routeUpdate', function() {
    reloadSearch();
  });

  var reloadSearch = function() {
    Lead.search(collection.id).then(function(data) {
      updateSearch(data);
    });
  };

  var updateSearch = function(data) {
    $scope.result = data.result;
    $scope.query = data.query;
    Title.set("Leads", "collections");
  };

  updateSearch(leads);
}]);
