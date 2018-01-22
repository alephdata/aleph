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
      if (prop.hidden) {
        return false;
      }
      return prop.featured || !!entity.properties[prop.name];
    });
  
    return (
      <DualPane.InfoPane>
        <h1>
          <Entity.Label entity={entity} />
        </h1>

        <table className="info-sheet">
          <tbody>
            <tr>
              <th><FormattedMessage id="entity.type" defaultMessage="Type"/></th>
              <td>
                <Schema.Icon schema={entity.schema}/>
                <Schema.Name schema={entity.schema}/>
              </td>
            </tr>
            { properties.map((prop) => (
              <tr key={prop.name}>
                <th>
                  <Property.Name model={prop} />
                </th>
                <td>
                  <Property.Values model={prop} values={entity.properties[prop.name]} />
                </td>
              </tr>
            ))}
            <tr>
              <th>
                <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
              </th>
              <td>
                <Date value={entity.updated_at} />
              </td>
            </tr>
          </tbody>
        </table>

        <h3>
          <FormattedMessage id="collection.section.origin" defaultMessage="Origin"/>
        </h3>
        <div>
          <CollectionCard collection={entity.collection} />
        </div>

        { references && references.results && !!references.results.length && (
          <div className="references">
            <h3>
              <FormattedMessage id="collection.section.links" defaultMessage="Relationships"/>
            </h3>
            <table className="info-rank">
              <tbody>
                { references.results.map((ref) => (
                  <tr key={ref.property.qname}>
                    <th>
                      <Schema.Icon schema={ref.schema} />
                      { ref.property.reverse }
                    </th>
                    <td className="numeric">
                      <FormattedNumber value={ref.count} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
