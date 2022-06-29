{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React from 'react';
import { Spinner } from '@blueprintjs/core';

import './SectionLoading.scss';

const SectionLoading = (props = {}) => (
  <div className="SectionLoading">
    <div className="spinner">
      <Spinner {...props}/>
    </div>
  </div>
);

export default SectionLoading;
