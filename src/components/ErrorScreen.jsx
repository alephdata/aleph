import React from 'react';

const ErrorScreen = ({ location }) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
)

export default ErrorScreen;
