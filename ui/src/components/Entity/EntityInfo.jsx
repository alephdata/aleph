import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { Property, Entity, DualPane, Schema } from 'src/components/common';
import { Toolbar, CloseButton } from 'src/components/Toolbar';
import { CollectionOverview } from 'src/components/Collection';
import { selectMetadata } from 'src/selectors';
import getPath from 'src/util/getPath';


class EntityInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'overview'
    };
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(activeTabId) {
    this.setState({ activeTabId });
  }

  render() {
    const { entity, schema, showToolbar } = this.props;
    const isThing = entity && entity.schemata && entity.schemata.indexOf('Thing') !== -1;

    if (schema === undefined) {  // entity hasn't loaded.
      return null;
    }
    
    const entityProperties = _.values(schema.properties).filter((prop) => {
      return !prop.caption && (schema.featured.indexOf(prop.name) !== -1 || entity.properties[prop.name]);
    });
    
    return (
      <DualPane.InfoPane className="EntityInfo with-heading">
        {showToolbar && (
          <Toolbar className="toolbar-preview">
            {isThing && (
              <Link to={getPath(entity.links.ui)} className="pt-button button-link">
                <span className={`pt-icon-share`}/>
                <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
              </Link>
            )}
            <CloseButton/>
          </Toolbar>
        )}
        <div className="pane-heading">
          <span>
            <Schema.Label schema={entity.schema} icon={true} />
          </span>
          <h1>
            {isThing && (
              <Entity.Label entity={entity} addClass={true}/>
            )}
          </h1>
        </div>
        <div className="pane-content">
          <ul className="info-sheet">
            { entityProperties.map((prop) => (
              <li key={prop.name}>
                <span className="key">
                  <Property.Name model={prop} />
                </span>
                <span className="value">
                  <Property.Values model={prop} values={entity.properties[prop.name]} />
                </span>
              </li>
            ))}
          </ul>
          <span className="source-header">
            <FormattedMessage id="entity.info.source" defaultMessage="Source"/>
          </span>
          <CollectionOverview collection={entity.collection} hasHeader={true}/>   
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity } = ownProps;
  return {
    schema: selectMetadata(state).schemata[entity.schema]
  };
};

EntityInfo = connect(mapStateToProps, {})(EntityInfo);
export default EntityInfo;
