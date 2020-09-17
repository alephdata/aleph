import React from 'react';
import CountUp from 'react-countup';
import { Skeleton } from 'components/common';

import './AnimatedCount.scss';

const AnimatedCount = ({ count, isPending, label}) => {
  if (!isPending && count === undefined) {
    return null;
  }
  return (
    <div className="AnimatedCount">
      {isPending && <Skeleton.Text className="AnimatedCount__count" type="span" length="3" />}
      {!isPending && <CountUp className="AnimatedCount__count" end={count} separator="," />}
      <p className="AnimatedCount__label">{label}</p>
    </div>
  );
}
export default AnimatedCount;
