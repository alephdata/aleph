import _ from 'lodash';
import React from 'react';
import { Alignment, ButtonGroup, Divider, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';

import { Count, Schema } from 'components/common';
import { selectModel } from 'selectors';


import './SchemaCounts.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});


class SchemaCounts extends React.PureComponent {
  render() {
    const { activeSchema, visibleCounts, selectableSchemata, showSchemaAdd, intl, onSelect } = this.props;

    return (
      <ButtonGroup vertical minimal className="SchemaCounts">
        {Object.keys(visibleCounts).map(schema => (
          <Button
            key={schema}
            text={<Schema.Label schema={schema} plural />}
            icon={<Schema.Icon schema={schema} />}
            rightIcon={<Count count={visibleCounts[schema]} />}
            onClick={() => onSelect(schema)}
            active={activeSchema === schema}
            alignText={Alignment.LEFT}
            fill
          />
        ))}
        {_.size(visibleCounts) > 0 && showSchemaAdd && <Divider />}
        {showSchemaAdd && (
          <Schema.Select
            onSelect={schema => onSelect(schema)}
            fill
            optionsFilter={schema => selectableSchemata.indexOf(schema.name) !== -1}
          >
            <Button
              text={intl.formatMessage(messages.addSchemaPlaceholder)}
              icon="plus"
              rightIcon="chevron-down"
              alignText={Alignment.LEFT}
              fill
            />
          </Schema.Select>
        )}
      </ButtonGroup>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { activeSchema, filterSchemata, schemaCounts } = ownProps;
  const model = selectModel(state);

  if (activeSchema && !schemaCounts[activeSchema]) {
    schemaCounts[activeSchema] = 0;
  }

  const visibleCounts = _.pickBy(schemaCounts, (val, key) => {
    const schema = model.getSchema(key);
    return (!filterSchemata || filterSchemata(schema)) && !schema.hidden;
  })

  const selectableSchemata = model.getSchemata()
    .filter((schema) => (!filterSchemata || filterSchemata(schema)) && !schema.hidden && !(schema in visibleCounts))
    .map((schema) => schema.name);

  return {
    visibleCounts,
    selectableSchemata
  }
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(SchemaCounts);
