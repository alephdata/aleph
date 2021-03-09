import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { withRouter } from 'react-router';

import { HotKeysContainer } from 'components/common';


class EntityDecisionHotkeys extends Component {
  constructor(props) {
    super(props);
    this.onDecideSelected = this.onDecideSelected.bind(this);
    this.selectNext = this.selectNext.bind(this);
    this.selectPrevious = this.selectPrevious.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { result, selectedIndex } = this.props;
    const newLength = result.results?.length;

    if (prevProps.result.results?.length !== newLength && selectedIndex >= newLength) {
      this.updateQuery(newLength - 1);
    }
  }

  onDecideSelected(judgement) {
    const {onDecide, result, selectedIndex } = this.props;

    const selectedXrefResult = result.results?.[selectedIndex === -1 ? 0 : selectedIndex];
    if (selectedXrefResult) {
      selectedXrefResult.judgement = selectedXrefResult.judgement === judgement ? 'no_judgement' : judgement
      onDecide(selectedXrefResult);
      this.selectNext();
    }
  }

  updateQuery(nextSelected) {
    const { history, location } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedIndex = nextSelected;

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  selectNext() {
    const { result, selectedIndex } = this.props;
    const hasNext = result.results && result.results.length > (selectedIndex + 1)

    if (hasNext) {
      this.updateQuery(selectedIndex + 1);
    }
  }

  selectPrevious() {
    const { result, selectedIndex } = this.props;
    const hasPrevious = result.results?.length && selectedIndex > 0;
    if (hasPrevious) {
      this.updateQuery(selectedIndex - 1);
    }
  }

  render() {
    const { children, } = this.props;

    console.log(this.props.selectedIndex)

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

  return { selectedIndex: parsedHash.selectedIndex ? +parsedHash.selectedIndex : -1 };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(EntityDecisionHotkeys);
