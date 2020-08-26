import React from 'react';
import CountUp from 'react-countup';
// import Count from 'components/common/Count';

import './AnimatedCount.scss';

const AnimatedCount = ({ count, isPending, label}) => (
  <div className="AnimatedCount">
    <CountUp className="AnimatedCount__count" end={count} separator="," />
    <p className="AnimatedCount__label">{label}</p>
  </div>
)
export default AnimatedCount;
