import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Alignment, Classes, ButtonGroup, Button, Divider, Tooltip } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import { Count, ResultCount, SchemaCounts, SearchBox, Summary } from 'components/common';
import InvestigationHeading from 'components/Investigation/InvestigationHeading';
import InvestigationSidebarButton from 'components/Investigation/InvestigationSidebarButton';
import { CollectionMode, collectionModes, getModesByCategory } from 'components/Collection/collectionModes';

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

    if (!isCollapsed && collectionModes[mode]?.collapsed) {
      parsedHash.collapsed = true;
    }

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, activeType, isCollapsed, toggleCollapsed, minimalHeader,
      intl, schemaCounts
    } = this.props;

    return (
      <div className={c('InvestigationSidebar', {static: !activeMode})}>
        <div className="InvestigationSidebar__scroll-container">
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
                  isCollapsed={isCollapsed}
                />
                {getModesByCategory('entityTool').map(id => (
                  <InvestigationSidebarButton
                    key={id}
                    text={<CollectionMode.Label id={id} />}
                    onClick={() => this.navigate(id)}
                    active={activeMode === id}
                    isCollapsed={isCollapsed}
                    icon={<CollectionMode.Icon id={id} />}
                    rightIcon={<CollectionMode.Count id={id} collection={collection} />}
                  />
                ))}
              </ButtonGroup>
            </div>
            <div className="InvestigationSidebar__section">
              <h6 className="bp3-heading InvestigationSidebar__section__title">
                <FormattedMessage id="collection.info.documents" defaultMessage="Documents" />
              </h6>
              <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
                {getModesByCategory('docTool').map(id => (
                  <InvestigationSidebarButton
                    key={id}
                    text={<CollectionMode.Label id={id} />}
                    onClick={() => this.navigate(id)}
                    active={activeMode === id}
                    isCollapsed={isCollapsed}
                    icon={<CollectionMode.Icon id={id} />}
                    rightIcon={<CollectionMode.Count id={id} collection={collection} />}
                  />
                ))}
              </ButtonGroup>
            </div>
          </div>
        </div>
        {!!activeMode && (
          <div className="InvestigationSidebar__footer">
            <Button
              minimal
              fill
              icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
              onClick={toggleCollapsed}
              text={isCollapsed ? null : 'Collapse'}
              className="InvestigationSidebar__collapse-toggle"
            />
          </div>
        )}
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
