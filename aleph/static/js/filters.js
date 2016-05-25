aleph.filter('date', function() {
  return function(val) {
    return moment(val).format('LL');
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


aleph.filter('schemaPlural', ['Metadata', function(Metadata) {
  var schemata = {};

  Metadata.get().then(function(md) {
    schemata = md.schemata;
  });

  return function(schema_id) {
    if (schemata[schema_id]) {
      return schemata[schema_id].plural;
    }
    return schema_id;
  };
}]);


aleph.filter('sourceCategory', ['Metadata', function(Metadata) {
  var categories = {};

  Metadata.get().then(function(md) {
    categories = md.source_categories;
  });

  return function(code) {
    if (!code) {
      return 'Unclassified';
    }
    var label = categories[code];
    return label || code;
  };
}]);
