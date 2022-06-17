// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Button } from '@blueprintjs/core';
import c from 'classnames';

import { Summary } from 'components/common';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatus from 'components/Collection/CollectionStatus';
import CollectionHeading from 'components/Collection/CollectionHeading';

import './InvestigationHeading.scss';

class InvestigationHeading extends React.Component {
  constructor(props) {
    super(props);

    this.state = { showMetadata: false };
  }

  toggleMetadata = () => {
    this.setState(({ showMetadata }) => ({ showMetadata: !showMetadata }));
  }

  render() {
    const { collection, activeMode } = this.props;
    const { showMetadata } = this.state;

    return (
      <div className={c('InvestigationHeading', {'metadata-shown': showMetadata })}>
        <div className="InvestigationHeading__inner-container">
          <CollectionHeading collection={collection} link={!!activeMode} />
          {!!activeMode && (
            <div className="InvestigationHeading__metadata">
              {collection.summary && (
                <Summary text={collection.summary} />
              )}
              <CollectionStatus collection={collection} showCancel={collection.writeable} />
              <div className="InvestigationHeading__divider" />
              <div className="InvestigationHeading__metadata__inner-container">
                <CollectionInfo collection={collection} />
              </div>
            </div>
          )}
        </div>
        {!!activeMode && (
          <Button
            onClick={this.toggleMetadata}
            minimal
            small
            fill
            className="InvestigationHeading__metadata-toggle"
            rightIcon={showMetadata ? 'chevron-up' : 'chevron-down'}
          />
        )}
      </div>
    );
  }
}

export default InvestigationHeading;
