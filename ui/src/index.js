// import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import App from 'app/App';
process.on('SIGINT', function() {
    //Error docker stop unresponsive fix
    process.exit(0);
});
ReactDOM.render(
  React.createElement(App),
  document.getElementById('root'),
);
