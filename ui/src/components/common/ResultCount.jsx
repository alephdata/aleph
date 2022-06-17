// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
