import React from 'react';
import { Spinner } from '@blueprintjs/core';

import './ScreenLoading.css';

const ScreenLoading = () => (
  <div className="ScreenLoading">
    <div className="spinner">
      <Spinner className="pt-large"/>
    </div>
  </div>
);

export default ScreenLoading;
