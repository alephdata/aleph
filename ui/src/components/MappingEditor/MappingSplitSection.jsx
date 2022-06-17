// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { compose } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import './MappingSplitSection.scss';

const MappingSplitSection = (({ mappings, sectionContentsRenderer }) => (
  <div className="MappingSplitSection-container">
    <div className="MappingSplitSection">
      <h4 className="MappingSplitSection__title bp3-text-muted">
        <FormattedMessage id="mapping.types.objects" defaultMessage="Objects" />
      </h4>
      {sectionContentsRenderer(mappings.getThingMappings(), 'thing')}
    </div>
    <div className="MappingSplitSection">
      <h4 className="MappingSplitSection__title bp3-text-muted">
        <FormattedMessage id="mapping.types.relationships" defaultMessage="Relationships" />
      </h4>
      {sectionContentsRenderer(mappings.getNonThingMappings(), 'relationship')}
    </div>
  </div>
));

export default compose(
  injectIntl,
)(MappingSplitSection);
