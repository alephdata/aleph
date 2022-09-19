import React from 'react';
import { compose } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import './MappingSplitSection.scss';

const MappingSplitSection = ({ mappings, sectionContentsRenderer }) => (
  <div className="MappingSplitSection-container">
    <div className="MappingSplitSection">
      <h4 className={c('MappingSplitSection__title', Classes.TEXT_MUTED)}>
        <FormattedMessage id="mapping.types.objects" defaultMessage="Objects" />
      </h4>
      {sectionContentsRenderer(mappings.getThingMappings(), 'thing')}
    </div>
    <div className="MappingSplitSection">
      <h4 className={c('MappingSplitSection__title', Classes.TEXT_MUTED)}>
        <FormattedMessage
          id="mapping.types.relationships"
          defaultMessage="Relationships"
        />
      </h4>
      {sectionContentsRenderer(mappings.getNonThingMappings(), 'relationship')}
    </div>
  </div>
);

export default compose(injectIntl)(MappingSplitSection);
