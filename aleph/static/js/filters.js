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

aleph.filter('country', ['Metadata', function(Metadata) {
  var countries = {};

  Metadata.get().then(function(md) {
    countries = md.countries;
  });

  return function(code) {
    var label = countries[code];
    return label || code;
  };
}]);


aleph.filter('language', ['Metadata', function(Metadata) {
  var languages = {};

  Metadata.get().then(function(md) {
    languages = md.languages;
  });

  return function(code) {
    var label = languages[code];
    return label || code;
  };
}]);
