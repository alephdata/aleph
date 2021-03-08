import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { withRouter } from 'react-router';

import { ErrorSection, HotKeysContainer } from 'components/common';
import { showWarningToast } from 'app/toast';


class EntityDecisionHotkeys extends Component {
  constructor(props) {
    super(props);
    this.onDecideSelected = this.onDecideSelected.bind(this);
    this.selectNext = this.selectNext.bind(this);
    this.selectPrevious = this.selectPrevious.bind(this);
  }

  getCurrentSelectedIndex() {
    const { result, selectedId } = this.props;

    return result.results?.findIndex(
      item => (item.id || item.entityId) === selectedId,
    );
  }

  onDecideSelected(judgement) {
    const { history, location, onDecide, result, selectedIndex } = this.props;

    const selectedXrefResult = result.results?.[this.getCurrentSelectedIndex()];
    if (selectedXrefResult) {
      selectedXrefResult.judgement = selectedXrefResult.judgement === judgement ? 'no_judgement' : judgement
      onDecide(selectedXrefResult);
      console.log('selecting next');
      this.selectNext();
    }
  }

  updateQuery(nextSelected) {
    const { history, location } = this.props;
    if (!nextSelected) { return; }

    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedId = nextSelected.id || nextSelected.entityId;

    console.log('updating query', nextSelected)

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  selectNext() {
    const { history, location, result } = this.props;
    const selectedIndex = this.getCurrentSelectedIndex();
    const hasNext = result.results && result.results.length > (selectedIndex + 1)
    console.log('hasNext', selectedIndex, hasNext)
    if (hasNext) {
      this.updateQuery(result.results[selectedIndex + 1]);
    }
  }

  selectPrevious() {
    const { history, location, result } = this.props;
    const selectedIndex = this.getCurrentSelectedIndex();
    const hasPrevious = result.results?.length && selectedIndex > 0;
    if (hasPrevious) {
      this.updateQuery(result.results[selectedIndex - 1]);
    }
  }

  render() {
    const { children, } = this.props;

    return (
      <HotKeysContainer
        hotKeys={[
          {
            combo: 'y', global: true, label: 'Decide same', onKeyDown: () => this.onDecideSelected('positive'),
          },
          {
            combo: 'h', global: true, label: 'Decide not enough information', onKeyDown: () => this.onDecideSelected('unsure'),
          },
          {
            combo: 'n', global: true, label: 'Decide different', onKeyDown: () => this.onDecideSelected('negative'),
          },
          {
            combo: 'up', global: true, label: 'Select previous cross reference result', onKeyDown: this.selectPrevious,
          },
          {
            combo: 'down', global: true, label: 'Select next cross reference result', onKeyDown: this.selectNext,
          },
        ]}
      >
        {children}
      </HotKeysContainer>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const parsedHash = queryString.parse(location.hash);

  return { selectedId: parsedHash.selectedId };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(EntityDecisionHotkeys);
