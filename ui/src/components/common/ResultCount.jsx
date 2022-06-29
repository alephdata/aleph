{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React from 'react';
import Count from 'components/common/Count';

const ResultCount = ({result, ...rest}) => (
  <Count
    count={result.total}
    isPending={result.shouldLoad || result.isPending}
    {...rest}
  />
)
export default ResultCount;
