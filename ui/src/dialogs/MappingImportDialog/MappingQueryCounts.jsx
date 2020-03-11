import React from 'react';

import { Schema } from 'src/components/common';

const MappingQueryCounts = ({ query }) => {
  const { entities } = query;

  return (
    <div className="MappingQueryCounts">
      {Object.entries(entities).map(([key, { schema }]) => (
        <div className="MappingQueryCounts__items" key={key} >
          <Schema.Smart.Icon schema={schema}/>
          {key}
        </div>
      ))}
    </div>
  );
};

export default MappingQueryCounts;
