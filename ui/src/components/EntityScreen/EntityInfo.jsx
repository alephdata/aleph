import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import Property from './Property';
import Entity from './Entity';
import DualPane from 'src/components/common/DualPane';
import Date from 'src/components/common/Date';
import Schema from 'src/components/common/Schema';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';
import { fetchEntityReferences } from '../../actions/index';

import './EntityInfo.css';

class EntityInfo extends Component {
  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { references, entity } = this.props;
    console.log(references);
  
    return (
      <DualPane.InfoPane>
        <h1>
          <Entity.Label entity={entity} />
        </h1>

        <Property.Table properties={entity.properties} schema={entity.schema}>
          <tr>
            <th>
              <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
            </th>
            <td>
              <Date value={entity.updated_at} />
            </td>
          </tr>
        </Property.Table>

        <h3>
          <FormattedMessage id="collection.section.origin" defaultMessage="Origin"/>
        </h3>
        <div>
          <CollectionCard collection={entity.collection} />
        </div>

        { references && references.results && (
          <div className="references">
            <h3>
              <FormattedMessage id="collection.section.links" defaultMessage="Relationships"/>
            </h3>
            <table className="pt-table pt-condensed">
              <tbody>
                { references.results.map((ref) => (
                  <tr key={ref.property.qname}>
                    <td>
                      <Schema.Icon schema={ref.schema} />
                      { ref.property.reverse }
                    </td>
                    <td className="numeric">
                      <FormattedNumber value={ref.count} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const references = state.entityReferences[ownProps.entity.id];
  return {
    references: references,
  };
};
export default connect(mapStateToProps, {fetchEntityReferences})(EntityInfo);
