import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { MenuDivider } from '@blueprintjs/core';
import queryString from 'query-string';

import withRouter from '/src/app/withRouter.jsx';
import collectionViewIds from '/src/components/Collection/collectionViewIds';
import CollectionView from '/src/components/Collection/CollectionView';
import { LinkMenuItem, SchemaCounts } from '/src/components/common/index.jsx';
import InvestigationHeading from '/src/components/Investigation/InvestigationHeading';

import './InvestigationSidebar.scss';

class InvestigationSidebar extends React.Component {
  constructor(props) {
    super(props);
    this.getLink = this.getLink.bind(this);
    this.getEntitiesLink = this.getEntitiesLink.bind(this);
    this.onSchemaSelect = this.onSchemaSelect.bind(this);
  }

  getLink(mode, type) {
    const { location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.mode = mode;
    parsedHash.type = type || undefined;

    return `${location.pathname}#${queryString.stringify(parsedHash)}`;
  }

  getEntitiesLink(schema) {
    return this.getLink('entities', schema);
  }

  onSchemaSelect(schema) {
    const { navigate } = this.props;
    navigate(this.getEntitiesLink(schema));
  }

  render() {
    const { collection, activeMode, activeType, schemaCounts } = this.props;

    const entityTools = [
      collectionViewIds.DIAGRAMS,
      collectionViewIds.TIMELINES,
      collectionViewIds.LISTS,
      collectionViewIds.XREF,
    ];
    const docTools = [
      collectionViewIds.DOCUMENTS,
      collectionViewIds.MAPPINGS,
      collectionViewIds.MENTIONS,
    ];

    return (
      <div className="InvestigationSidebar">
        <InvestigationHeading collection={collection} activeMode={activeMode} />
        <div className="InvestigationSidebar__content">
          <ul className="InvestigationSidebar__section">
            <MenuDivider
              className="InvestigationSidebar__section__title"
              title={
                <FormattedMessage
                  id="collection.info.entities"
                  defaultMessage="Entities"
                />
              }
            />
            <SchemaCounts
              filterSchemata={(schema) => !schema.isDocument()}
              schemaCounts={schemaCounts}
              link={this.getEntitiesLink}
              onSelect={this.onSchemaSelect}
              showSchemaAdd={collection.writeable}
              activeSchema={activeType}
            />

            {entityTools.map((toolId) => (
              <LinkMenuItem
                key={toolId}
                icon={<CollectionView.Icon id={toolId} />}
                text={<CollectionView.Label id={toolId} isCasefile />}
                label={
                  <CollectionView.Count
                    id={toolId}
                    collectionId={collection.id}
                  />
                }
                to={this.getLink(toolId)}
                active={activeMode === toolId}
              />
            ))}
          </ul>

          <ul className="InvestigationSidebar__section">
            <MenuDivider
              className="InvestigationSidebar__section__title"
              title={
                <FormattedMessage
                  id="collection.info.documents"
                  defaultMessage="Documents"
                />
              }
            />
            {docTools.map((toolId) => (
              <LinkMenuItem
                key={toolId}
                icon={<CollectionView.Icon id={toolId} />}
                text={<CollectionView.Label id={toolId} isCasefile />}
                label={
                  <CollectionView.Count
                    id={toolId}
                    collectionId={collection.id}
                  />
                }
                to={this.getLink(toolId)}
                active={activeMode === toolId}
              />
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;

  return {
    schemaCounts: collection?.statistics?.schema?.values || {},
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(InvestigationSidebar);
