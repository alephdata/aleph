import React from 'react';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';

import './MappingSplitSection.scss';

const MappingSplitSection = (({ items, sectionContentsRenderer }) => {
  const [things, relationships] = items
    .reduce((result, item) => {
      result[item.schema.isEdge ? 1 : 0].push(item);
      return result;
    }, [[], []]);

  return (
    <div className="MappingSplitSection-container">
      <div className="MappingSplitSection">
        <h4 className="MappingSplitSection__title">Objects</h4>
        {sectionContentsRenderer(things, 'thing')}
      </div>
      <div className="MappingSplitSection">
        <h4 className="MappingSplitSection__title">Relationships</h4>
        {sectionContentsRenderer(relationships, 'relationship')}
      </div>
    </div>
  );
});

export default compose(
  injectIntl,
)(MappingSplitSection);
