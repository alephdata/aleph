import _ from 'lodash';
import React from 'react';
import { Button, MenuDivider, MenuItem } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema, SectionLoading, Skeleton } from 'components/common';
import { selectModel } from 'selectors';

// import './SchemaCounts.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});


class SchemaCounts extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(type) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = type;

    history.push({
      pathname: location.pathname,
      search: "",
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { activeSchema, visibleCounts, selectableSchemata, showSchemaAdd, intl, isPending, onSelect, writeable } = this.props;

    if (isPending && !activeSchema) {
      return <SectionLoading />
    }

    return (
      <>
        {Object.keys(visibleCounts).map(schema => (
          <MenuItem
            id={schema}
            key={schema}
            className="SchemaCounts"
            onClick={() => onSelect(schema)}
            rightIcon={<Count count={visibleCounts[schema]} isPending={isPending} />}
            text={
              <>
                {isPending && <Skeleton.Text type="span" length={15} />}
                {!isPending && <Schema.Label schema={schema} plural icon />}
              </>
            }
          />
        ))}
        {visibleCounts.size > 0 && showSchemaAdd && <MenuDivider />}
        {showSchemaAdd && (
          <MenuItem
            id="new"
            key="new"
            disabled
            className="SchemaCount schema-add-tab"
            text={
              <Schema.Select
                onSelect={this.handleTabChange}
                optionsFilter={schema => selectableSchemata.indexOf(schema.name) !== -1}
              >
                <Button
                  icon="plus"
                  text={intl.formatMessage(messages.addSchemaPlaceholder)}
                />
              </Schema.Select>
            }
          />
        )}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { activeSchema, filterSchemata, schemaCounts } = ownProps;
  const model = selectModel(state);

  const visibleCounts = _.pickBy({[activeSchema]: 0, ...schemaCounts}, (val, key) => {
    const schema = model.getSchema(key);
    return filterSchemata(schema) && !schema.hidden;
  })

  const selectableSchemata = model.getSchemata()
    .filter((schema) => filterSchemata(schema) && !schema.hidden && !(schema in visibleCounts))
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
