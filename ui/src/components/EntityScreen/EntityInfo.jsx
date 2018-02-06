import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import _ from 'lodash';

import Property from './Property';
import Entity from './Entity';
import EntityInfoTags from './EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import Date from 'src/components/common/Date';
import Schema from 'src/components/common/Schema';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';
import { fetchEntityReferences } from '../../actions/index';

import './EntityInfo.css';

class EntityInfo extends Component {
  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { references, entity, schema } = this.props;

    const properties = _.values(schema.properties).filter((prop) => {
      if (prop.caption) {
        return false;
      }
      return prop.featured || !!entity.properties[prop.name];
    });
  
    return (
      <DualPane.InfoPane>
        <h1>
          <Entity.Label entity={entity} />
        </h1>

        <ul className="info-sheet">
          <li>
            <span className="key"><FormattedMessage id="entity.type" defaultMessage="Type"/></span>
            <span className="value">
              <Schema.Icon schema={entity.schema}/>
              <Schema.Name schema={entity.schema}/>
            </span>
          </li>
          { properties.map((prop) => (
            <li key={prop.name}>
              <span className="key">
                <Property.Name model={prop} />
              </span>
              <span className="value">
                <Property.Values model={prop} values={entity.properties[prop.name]} />
              </span>
            </li>
          ))}
          <li>
            <span className="key">
              <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
            </span>
            <span className="value">
              <Date value={entity.updated_at} />
            </span>
          </li>
        </ul>

        <h2>
          <FormattedMessage id="collection.section.origin" defaultMessage="Origin"/>
        </h2>
        <div>
          <CollectionCard collection={entity.collection} />
        </div>

        { references && references.results && !!references.results.length && (
          <div className="references">
            <h2>
              <FormattedMessage id="collection.section.links" defaultMessage="Relationships"/>
            </h2>
            <ul className="info-rank">
              { references.results.map((ref) => (
                <li key={ref.property.qname}>
                  <span className="key">
                    <Schema.Icon schema={ref.schema} />
                    <Property.Reverse model={ref.property} />
                  </span>
                  <span className="value">
                    <FormattedNumber value={ref.count} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <EntityInfoTags entity={entity} />
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    references: state.entityReferences[ownProps.entity.id],
    schema: state.metadata.schemata[ownProps.entity.schema]
  };
};

export default connect(mapStateToProps, {fetchEntityReferences})(EntityInfo);
