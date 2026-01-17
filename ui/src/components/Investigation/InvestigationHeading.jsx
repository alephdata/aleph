import React from 'react';
import { Button } from '@blueprintjs/core';
import c from 'classnames';

import { Summary } from '/src/components/common/index.jsx';
import CollectionInfo from '/src/components/Collection/CollectionInfo';
import CollectionStatus from '/src/components/Collection/CollectionStatus';
import CollectionHeading from '/src/components/Collection/CollectionHeading';

import './InvestigationHeading.scss';

class InvestigationHeading extends React.Component {
  constructor(props) {
    super(props);

    this.state = { showMetadata: false };
  }

  toggleMetadata = () => {
    this.setState(({ showMetadata }) => ({ showMetadata: !showMetadata }));
  };

  render() {
    const { collection, activeMode } = this.props;
    const { showMetadata } = this.state;

    return (
      <div
        className={c('InvestigationHeading', {
          'metadata-shown': showMetadata,
        })}
      >
        <div className="InvestigationHeading__inner-container">
          <CollectionHeading collection={collection} link={!!activeMode} />
          {!!activeMode && (
            <div className="InvestigationHeading__metadata">
              {collection.summary && <Summary text={collection.summary} />}
              <CollectionStatus
                collection={collection}
                showCancel={collection.writeable}
              />
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
