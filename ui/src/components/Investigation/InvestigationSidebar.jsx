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
import { Count, ResultCount, SearchBox, SchemaCounts, Summary } from 'components/common';
import InvestigationHeading from 'components/Investigation/InvestigationHeading';

import './InvestigationSidebar.scss';

class InvestigationSidebar extends React.Component {
  constructor(props) {
    super(props);

    this.navigate = this.navigate.bind(this);
  }

  navigate(mode, type) {
    const { history, location } = this.props;
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

  renderButton = (id) => {
    const { activeMode, collection } = this.props;

    return (
      <Button
        icon={<CollectionView.Icon id={id} />}
        text={<CollectionView.Label id={id} />}
        rightIcon={<CollectionView.Count id={id} collection={collection} />}
        onClick={() => this.navigate(id)}
        active={activeMode === id}
        alignText={Alignment.LEFT}
        fill
      />
    );
  }

  render() {
    const {
      collection, activeMode, activeType, minimalHeader,
      intl, schemaCounts
    } = this.props;

    const entityTools = [collectionViewIds.DIAGRAMS, collectionViewIds.LISTS, collectionViewIds.XREF];
    const docTools = [collectionViewIds.DOCUMENTS, collectionViewIds.MAPPINGS, collectionViewIds.MENTIONS];

    return (
      <div className="InvestigationSidebar">
        <InvestigationHeading collection={collection} activeMode={activeMode} minimal={minimalHeader} />
        <div className="InvestigationSidebar__content">
          <div className="InvestigationSidebar__section">
            <h6 className="bp3-heading InvestigationSidebar__section__title">
              <FormattedMessage id="collection.info.entities" defaultMessage="Entities" />
            </h6>
            <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
              <SchemaCounts
                filterSchemata={schema => !schema.isDocument()}
                schemaCounts={schemaCounts}
                onSelect={schema => this.navigate('entities', schema)}
                showSchemaAdd={collection.writeable}
                activeSchema={activeType}
              />
              {entityTools.map(this.renderButton)}
            </ButtonGroup>
          </div>
          <div className="InvestigationSidebar__section">
            <h6 className="bp3-heading InvestigationSidebar__section__title">
              <FormattedMessage id="collection.info.documents" defaultMessage="Documents" />
            </h6>
            <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
              {docTools.map(this.renderButton)}
            </ButtonGroup>
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
