import React from 'react';
import { compose } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import './MappingSplitSection.scss';

const MappingSplitSection = (({ items, sectionContentsRenderer }) => {
  const [things, relationships] = items
    .reduce((result, item) => {
      result[item.schema.isThing ? 0 : 1].push(item);
      return result;
    }, [[], []]);

  return (
    <div className="MappingSplitSection-container">
      <div className="MappingSplitSection">
        <h4 className="MappingSplitSection__title bp3-text-muted">
          <FormattedMessage id="mapping.types.objects" defaultMessage="Objects" />
        </h4>
        {sectionContentsRenderer(things, 'thing')}
      </div>
      <div className="MappingSplitSection">
        <h4 className="MappingSplitSection__title bp3-text-muted">
          <FormattedMessage id="mapping.types.relationships" defaultMessage="Relationships" />
        </h4>
        {sectionContentsRenderer(relationships, 'relationship')}
      </div>
    </div>
  );
});

export default compose(
  injectIntl,
)(MappingSplitSection);
