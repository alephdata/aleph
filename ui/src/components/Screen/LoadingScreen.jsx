import React from 'react';
import { Spinner } from '@blueprintjs/core';

import Screen from 'src/components/Screen/Screen';

import './LoadingScreen.css';

const LoadingScreen = () => (
  <Screen>
    <div className="LoadingScreen">
      <div className="spinner">
        <Spinner className="bp3-large"/>
      </div>
    </div>
  </Screen>
);

export default LoadingScreen;
