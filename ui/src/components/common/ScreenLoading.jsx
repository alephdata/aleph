import React from 'react';
import { Spinner } from '@blueprintjs/core';

import { Screen } from 'src/components/common';

import './ScreenLoading.css';

const ScreenLoading = () => (
  <Screen>
    <div className="ScreenLoading">
      <div className="spinner">
        <Spinner className="pt-large"/>
      </div>
    </div>
  </Screen>
);

export default ScreenLoading;
