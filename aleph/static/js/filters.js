aleph.filter('date', function() {
  return function(val) {
    return moment(val).format('YYYY-MM-DD');
  };
});


aleph.filter('relativeDate', function() {
  return function(val) {
    return moment(val).fromNow();
  };
});


aleph.filter('calendar', function() {
  return function(val) {
    return moment(val).calendar();
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


aleph.filter('schemaLabel', ['Metadata', function(Metadata) {
  var schemata = {};

  Metadata.get().then(function(md) {
    schemata = md.schemata;
  });

  return function(schema, plural) {
    var obj = schemata[schema];
    if (!obj) return schema;
    return plural ? obj.plural : obj.label;
  };

}]);


aleph.filter('collectionCategory', ['Metadata', function(Metadata) {
  var categories = {};

  Metadata.get().then(function(md) {
    categories = md.categories;
  });

  return function(code) {
    if (!code) {
      return 'Uncategorized';
    }
    var label = categories[code];
    return label || code;
  };
}]);
