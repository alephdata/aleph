import React from 'react';
import { compose } from 'redux';
import { injectIntl } from 'react-intl';

const MappingSplitSection = (({ items, sectionContentsRenderer }) => {
  const [things, relationships] = items
    .reduce((result, item) => {
      result[item.schema.isEdge ? 1 : 0].push(item);
      return result;
    }, [[], []]);

  return (
    <div className="EntityImport__split-section-container">
      <div className="EntityImport__split-section">
        <h4 className="EntityImport__split-section__title">Objects</h4>
        {sectionContentsRenderer(things, 'thing')}
      </div>
      <div className="EntityImport__split-section">
        <h4 className="EntityImport__split-section__title">Relationships</h4>
        {sectionContentsRenderer(relationships, 'relationship')}
      </div>
    </div>
  );
});


export default compose(
  injectIntl,
)(MappingSplitSection);
