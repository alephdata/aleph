import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Alignment, ButtonGroup, Button } from '@blueprintjs/core';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { SchemaCounts } from 'components/common';
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
    parsedHash.type = type || undefined;
    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  renderButton = (id) => {
    const { activeMode, collection } = this.props;

    return (
      <Button
        key={id}
        icon={<CollectionView.Icon id={id} />}
        text={<CollectionView.Label id={id} isCasefile />}
        rightIcon={<CollectionView.Count id={id} collectionId={collection.id} />}
        onClick={() => this.navigate(id)}
        active={activeMode === id}
        alignText={Alignment.LEFT}
        fill
      />
    );
  }

  render() {
    const { collection, activeMode, activeType, schemaCounts } = this.props;

    const entityTools = [collectionViewIds.DIAGRAMS, collectionViewIds.TIMELINES, collectionViewIds.LISTS, collectionViewIds.XREF];
    const docTools = [collectionViewIds.DOCUMENTS, collectionViewIds.MAPPINGS, collectionViewIds.MENTIONS];

    return (
      <div className="InvestigationSidebar">
        <InvestigationHeading collection={collection} activeMode={activeMode} />
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
  const { collection } = ownProps;

  return {
    schemaCounts: collection?.statistics?.schema?.values || {}
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationSidebar);
