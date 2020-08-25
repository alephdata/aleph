import React from 'react';
import CountUp from 'react-countup';
// import Count from 'components/common/Count';

const AnimatedCount = ({ count, isPending, label}) => (
  <>
    <CountUp end={count} />
    <h5>{label}</h5>
  </>
)
export default AnimatedCount;
