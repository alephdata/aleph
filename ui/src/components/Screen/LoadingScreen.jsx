import React from 'react';
import { Classes, Spinner } from '@blueprintjs/core';

import Screen from 'components/Screen/Screen';

import './LoadingScreen.scss';

const LoadingScreen = (props) => (
  <Screen {...props}>
    <div className="LoadingScreen">
      <div className="spinner">
        <Spinner className={Classes.LARGE} />
      </div>
    </div>
  </Screen>
);

export default LoadingScreen;
