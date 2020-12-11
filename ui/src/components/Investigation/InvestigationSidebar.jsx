import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Alignment, Classes, ButtonGroup, Button, Divider, Tooltip } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Count, ResultCount, SearchBox, Summary } from 'components/common';
import InvestigationHeading from 'components/Investigation/InvestigationHeading';

import './InvestigationSidebar.scss';

class InvestigationSidebar extends React.Component {
  constructor(props) {
    super(props);

    this.navigate = this.navigate.bind(this);
  }

  navigate(mode, type) {
    const { history, isCollapsed, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    if (type) {
      parsedHash.type = type
    } else {
      delete parsedHash.type;
    }

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  renderButtonGroup(items) {
    const { activeMode, collection } = this.props;

    return (
      <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
        {items.map(id => (
          <Button
            icon={<CollectionView.Icon id={id} />}
            text={<CollectionView.Label id={id} />}
            rightIcon={<CollectionView.Count id={id} collection={collection} />}
            onClick={() => this.navigate(id)}
            active={activeMode === id}
            alignText={Alignment.LEFT}
            fill
          />
        ))}
      </ButtonGroup>
    );
  }

  render() {
    const {
      collection, activeMode, activeType, isCollapsed, toggleCollapsed, minimalHeader,
      intl, schemaCounts
    } = this.props;

    const entityTools = [collectionViewIds.DIAGRAMS, collectionViewIds.LISTS, collectionViewIds.XREF];
    const docTools = [collectionViewIds.DOCUMENTS, collectionViewIds.MAPPINGS];

    return (
      <div className={c('InvestigationSidebar', {static: true})}>
        <div className="InvestigationSidebar__scroll-container">
          <InvestigationHeading collection={collection} activeMode={activeMode} minimal={minimalHeader} />
          <div className="InvestigationSidebar__content">
            <div className="InvestigationSidebar__section">
              <h6 className="bp3-heading InvestigationSidebar__section__title">
                <FormattedMessage id="collection.info.entities" defaultMessage="Entities" />
              </h6>
              {this.renderButtonGroup(entityTools)}
            </div>
            <div className="InvestigationSidebar__section">
              <h6 className="bp3-heading InvestigationSidebar__section__title">
                <FormattedMessage id="collection.info.documents" defaultMessage="Documents" />
              </h6>
              {this.renderButtonGroup(docTools)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  return {
    schemaCounts: collection?.statistics?.schema?.values || {},
    activeMode: hashQuery.mode,
    activeType: hashQuery.type,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationSidebar);
