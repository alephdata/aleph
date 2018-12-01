import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';

import App from 'src/app/App';

ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);
