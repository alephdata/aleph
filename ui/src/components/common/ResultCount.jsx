import React from 'react';
import Count from 'components/common/Count';

const ResultCount = ({ result, ...rest }) => (
  <Count
    count={result.total}
    isPending={result.shouldLoad || result.isPending}
    {...rest}
  />
);
export default ResultCount;
