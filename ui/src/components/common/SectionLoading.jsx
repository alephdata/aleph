import React from 'react';
import { Spinner } from '@blueprintjs/core';

import './SectionLoading.scss';

const SectionLoading = () => (
  <div className="SectionLoading">
    <div className="spinner">
      <Spinner />
    </div>
  </div>
);

export default SectionLoading;
