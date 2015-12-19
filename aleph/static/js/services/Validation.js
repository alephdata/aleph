aleph.factory('Validation', ['Flash', function(Flash) {
  // handle server-side form validation errors.
  return {
    handle: function(form) {
      return function(res) {
        if (res.status == 400 || !form) {
          var errors = [];
          
          for (var field in res.errors) {
            form[field].$setValidity('value', false);
            form[field].$message = res.errors[field];
            errors.push(field);
          }
          if (angular.isDefined(form._errors)) {
            angular.forEach(form._errors, function(field) {
              if (errors.indexOf(field) == -1 && form[field]) {
                form[field].$setValidity('value', true);
              }
            });
          }
          form._errors = errors;
        } else {
          Flash.message(res.message || res.title || 'Server error', 'danger');
        }
      }
    }
  };
}]);

