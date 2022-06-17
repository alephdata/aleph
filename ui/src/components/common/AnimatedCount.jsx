// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Numeric, Skeleton } from 'components/common';

import './AnimatedCount.scss';

const AnimatedCount = ({ count, isPending, label}) => {
  if (!isPending && count === undefined) {
    return null;
  }
  return (
    <div className="AnimatedCount">
      {isPending && <Skeleton.Text className="AnimatedCount__count" type="span" length="3" />}
      {!isPending && <span className="AnimatedCount__count"><Numeric num={count} abbr animate /></span>}
      <p className="AnimatedCount__label">{label}</p>
    </div>
  );
}
export default AnimatedCount;
