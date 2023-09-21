import _ from 'lodash';
import React from 'react';
import { Alignment, Menu, Divider, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';

import withRouter from 'app/withRouter';
import { Count, Schema, LinkMenuItem } from 'components/common';
import { selectModel } from 'selectors';

import './SchemaCounts.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});

class SchemaCounts extends React.PureComponent {
  constructor() {
    super();
    this.schemaFilter = this.schemaFilter.bind(this);
  }

  schemaFilter(schema) {
    return this.props.selectableSchemata.includes(schema.name);
  }

  render() {
    const { activeSchema, visibleCounts, showSchemaAdd, intl, link, onSelect } =
      this.props;
    const hasVisibleSchemata = _.size(visibleCounts) > 0;

    if (!hasVisibleSchemata && !showSchemaAdd) {
      return null;
    }

    return (
      <Menu className="SchemaCounts">
        {Object.keys(visibleCounts).map((schema) => (
          <LinkMenuItem
            key={schema}
            text={<Schema.Label schema={schema} plural />}
            icon={<Schema.Icon schema={schema} />}
            label={<Count count={visibleCounts[schema]} />}
            to={link(schema)}
            active={activeSchema === schema}
          />
        ))}
        {hasVisibleSchemata && showSchemaAdd && <Divider />}
        {showSchemaAdd && (
          <Schema.Select
            onSelect={onSelect}
            fill
            optionsFilter={this.schemaFilter}
          >
            <Button
              text={intl.formatMessage(messages.addSchemaPlaceholder)}
              icon="plus"
              rightIcon="chevron-down"
              alignText={Alignment.LEFT}
              fill
              minimal
            />
          </Schema.Select>
        )}
      </Menu>
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
  });

  const selectableSchemata = model
    .getSchemata()
    .filter(
      (schema) =>
        (!filterSchemata || filterSchemata(schema)) &&
        !schema.hidden &&
        !(schema in visibleCounts)
    )
    .map((schema) => schema.name);

  return {
    visibleCounts,
    selectableSchemata,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(SchemaCounts);
