aleph.filter('date', function() {
  return function(val) {
    return moment(val).format('LL');
  };
});

aleph.filter('host', function() {
  return function(val) {
    var l = document.createElement("a");
    l.href = val;
    return l.hostname;
  };
});
