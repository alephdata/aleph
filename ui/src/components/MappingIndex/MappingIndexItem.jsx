import React, { PureComponent } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Callout, Intent } from '@blueprintjs/core';
import { Link } from 'react-router-dom';

import { fetchEntity } from 'actions';
import { selectEntity } from 'selectors';
import {
  Date, Entity, Skeleton, Schema
} from 'src/components/common';

import './MappingIndexItem.scss';


class MappingIndexItem extends PureComponent {
  constructor(props) {
    super(props);
    this.getIntent = this.getIntent.bind(this);
  }

  renderSkeleton = () => (
    <Callout
      className="MappingIndexItem"
      icon={null}
    >
      <div className="MappingIndexItem__section">
        <Skeleton.Text type="h4" length={10} className="MappingIndexItem__title bp3-heading" />
      </div>
      <div className="MappingIndexItem__section">
        <div className="MappingIndexItem__schemata">
          <Skeleton.Text type="span" length={10} className="SchemaLabel" />
        </div>
      </div>
      <div className="MappingIndexItem__section">
        <Skeleton.Text type="p" length={10} className="MappingIndexItem__statusItem bp3-text-muted" />
        <Skeleton.Text type="p" length={10} className="MappingIndexItem__statusItem bp3-text-muted" />
      </div>
    </Callout>
  )

  componentDidUpdate() {
    const { mapping, tableEntity } = this.props;
    if (mapping?.table_id && tableEntity?.shouldLoad) {
      this.props.fetchEntity({ id: mapping?.table_id });
    }
  }

  getIntent() {
    const status = this.props.mapping?.last_run_status;
    switch(status) {
      case 'successful':
        return Intent.PRIMARY;
      case 'error':
        return Intent.DANGER;
      default:
        return null;
    }
  }

  renderContent() {
    const { isPending, mapping, tableEntity } = this.props;
    if (isPending) {
      return this.renderSkeleton();
    }

    const { last_run_status, last_run_err_msg, query, updated_at } = mapping;
    const title = tableEntity && <Entity.Link entity={tableEntity} icon />;

    return (
      <Callout
        className="MappingIndexItem"
        icon={null}
        intent={this.getIntent()}
      >
        <div className="MappingIndexItem__section">
          <h4 className="MappingIndexItem__title bp3-heading">{title}</h4>
        </div>
        <div className="MappingIndexItem__section">
          <div className="MappingIndexItem__schemata">
            {Object.values(query).map(({ schema }) => <Schema.Label schema={schema} icon plural />)}
          </div>
        </div>
        <div className="MappingIndexItem__section">
          <p className="MappingIndexItem__statusItem bp3-text-muted">
            <span>
              <FormattedMessage
                id="mapping.status.updated"
                defaultMessage="Last updated: "
              />
            </span>
            <span>
              <Date value={updated_at} showTime />
            </span>
          </p>
          {last_run_status && (
            <p className="MappingIndexItem__statusItem bp3-text-muted">
              <span>
                <FormattedMessage
                  id="mapping.status.status"
                  defaultMessage="Status: "
                />
              </span>
              <span>
                {mapping.last_run_status}
              </span>
            </p>
          )}
          {last_run_err_msg && (
            <p className="MappingIndexItem__statusItem bp3-text-muted">
              <span>
                <FormattedMessage
                  id="mapping.status.error"
                  defaultMessage="Error:"
                />
              </span>
              <span>
                {last_run_err_msg}
              </span>
            </p>
          )}
        </div>
      </Callout>
    );
  }

  render() {
    const { link } = this.props;
    if (link) {
      return (
        <Link to={link}>
          {this.renderContent()}
        </Link>
      );
    }
    return this.renderContent();
  }
}

const mapStateToProps = (state, ownProps) => {
  const { mapping } = ownProps;
  return { tableEntity: mapping?.table_id && selectEntity(state, mapping.table_id) };
};
const mapDispatchToProps = { fetchEntity };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(MappingIndexItem);
