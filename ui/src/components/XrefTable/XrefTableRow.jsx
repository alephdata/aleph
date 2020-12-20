import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  Collection, Skeleton, JudgementButtons, Score,
} from 'components/common';
import EntityCompare from 'components/Entity/EntityCompare';
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
          <EntityCompare isPending={true} />
        </td>
        <td className="entity">
          <EntityCompare isPending={true} />
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
          <EntityCompare entity={xref.entity} other={xref.match} showEmpty={true} />
        </td>
        <td className="entity">
          <EntityCompare entity={xref.match} other={xref.entity} showEmpty={true} />
        </td>
        <td className="numeric narrow">
          <Score score={xref.score} />
        </td>
        <td className="collection">
          <Collection.Link collection={xref.match?.collection} icon />
        </td>
      </tr >
    );
  }
}

XrefTableRow = connect(null, { pairwiseJudgement })(XrefTableRow);
export default XrefTableRow;
