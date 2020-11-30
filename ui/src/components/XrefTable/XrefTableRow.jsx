import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedNumber } from 'react-intl';

import {
  Collection, Entity, Property, Skeleton, JudgementButtons,
} from 'components/common';
import { showWarningToast } from 'app/toast';
import { pairwiseJudgement } from 'actions';


class XrefTableRow extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(xref) {
    try {
      await this.props.pairwiseJudgement(xref);
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  renderSkeleton() {
    return (
      <tr>
        <td className="decision" />
        <td className="entity bordered">
          <Skeleton.Text type="span" length={15} />
        </td>
        <td className="entity">
          <Skeleton.Text type="span" length={15} />
        </td>
        <td className="numeric narrow">
          <Skeleton.Text type="span" length={2} />
        </td>
        <td className="collection">
          <Skeleton.Text type="span" length={15} />
        </td>
      </tr>
    );
  }

  getCommonProperties() {
    const { entity, match } = this.props.xref;
    const properties = [...entity.schema.getFeaturedProperties()];

    match.schema.getFeaturedProperties().forEach((prop) => {
      if (properties.indexOf(prop) === -1) {
        properties.push(prop);
      }
    });

    return properties.filter((prop) => {
      return entity.hasProperty(prop) || match.hasProperty(prop);
    });
  }

  renderProperties(entity) {
    const properties = this.getCommonProperties();

    return (
      <>
        <Entity.Link entity={entity} preview icon />
        <div className="XrefTableRow__properties">
          {properties.map((prop) => (
            <div className="XrefTableRow__property" key={prop.name}>
              <span className="XrefTableRow__property__name text-muted">
                <Property.Name prop={prop} />
              </span>
              <span className="XrefTableRow__property__value">
                <Property.Values prop={prop} values={entity.getProperty(prop)} translitLookup={entity.latinized} />
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  render() {
    const { isPending, xref } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }

    if (!xref.entity || !xref.match) {
      return null;
    }
    return (
      <tr className="XrefTableRow">
        <td className="numeric narrow">
          <JudgementButtons obj={xref} onChange={this.onDecide} />
        </td>
        <td className="entity bordered">
          {this.renderProperties(xref.entity)}
        </td>
        <td className="entity">
          {this.renderProperties(xref.match)}
        </td>
        <td className="numeric narrow">
          <FormattedNumber value={parseInt(parseFloat(xref.score) * 100, 10)} />
        </td>
        <td className="collection">
          <Collection.Link preview collection={xref.match_collection} icon />
        </td>
      </tr >
    );
  }
}

XrefTableRow = connect(null, { pairwiseJudgement })(XrefTableRow);
export default injectIntl(XrefTableRow);
