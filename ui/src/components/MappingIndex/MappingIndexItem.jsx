import React, { PureComponent } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import c from 'classnames';

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
    <div className="MappingIndexItem">
      <Skeleton.Text type="h5" length={25} className="MappingIndexItem__title bp3-heading" />
      <div className="MappingIndexItem__schemata">
        <Skeleton.Text type="span" length={10} className="SchemaLabel" />
        <Skeleton.Text type="span" length={10} className="SchemaLabel" />
      </div>
      <div className="MappingIndexItem__statusItems">
        <Skeleton.Text type="p" length={20} className="MappingIndexItem__statusItem bp3-text-muted" />
        <Skeleton.Text type="p" length={20} className="MappingIndexItem__statusItem bp3-text-muted" />
      </div>
    </div>
  )

  componentDidUpdate() {
    const { mapping, tableEntity } = this.props;
    if (mapping?.table_id && tableEntity?.shouldLoad) {
      this.props.fetchEntity({ id: mapping?.table_id });
    }
  }

  getIntent() {
    const status = this.props.mapping?.last_run_status;
    switch (status) {
      case 'successful':
        return 'bp3-intent-primary';
      case 'error':
        return 'bp3-intent-danger';
      default:
        return null;
    }
  }

  getTitle() {
    const { link, tableEntity } = this.props;

    if (tableEntity && !tableEntity.isPending) {
      const title = <Entity.Label entity={tableEntity} icon />;
      if (link) {
        return <Link to={link}>{title}</Link>
      } else {
        return title;
      }
    }
    return <Skeleton.Text type="span" length={25} className="" />
  }

  render() {
    const { isPending, mapping } = this.props;
    if (isPending) {
      return this.renderSkeleton();
    }

    const { last_run_status, last_run_err_msg, query, updated_at } = mapping;

    return (
      <div className="MappingIndexItem">
        <h5 className="MappingIndexItem__title bp3-heading">{this.getTitle()}</h5>
        <div className="MappingIndexItem__schemata">
          {Object.entries(query).map(([key, { schema }]) => <Schema.Label key={key} schema={schema} icon plural />)}
        </div>
        <div className="MappingIndexItem__statusItems">
          <p className="MappingIndexItem__statusItem bp3-text-muted">
            <span>
              <FormattedMessage
                id="mapping.status.updated"
                defaultMessage="Last updated: "
              />
            </span>
            <span className="MappingIndexItem__statusItem__value">
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
              <span className={c("MappingIndexItem__statusItem__value", this.getIntent())}>
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
              <span className="MappingIndexItem__statusItem__value">
                {last_run_err_msg}
              </span>
            </p>
          )}
        </div>
      </div>
    );
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
