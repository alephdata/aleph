{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
import { HotkeysContainer } from 'components/common';


const messages = defineMessages({
  groupLabel: {
    id: 'hotkeys.judgement.group_label',
    defaultMessage: 'Entity decisions'
  },
  same: {
    id: 'hotkeys.judgement.same',
    defaultMessage: 'Decide same'
  },
  unsure: {
    id: 'hotkeys.judgement.unsure',
    defaultMessage: 'Decide not enough information'
  },
  different: {
    id: 'hotkeys.judgement.different',
    defaultMessage: 'Decide different'
  },
  previous: {
    id: 'hotkeys.judgement.previous',
    defaultMessage: 'Select previous result'
  },
  next: {
    id: 'hotkeys.judgement.next',
    defaultMessage: 'Select next result'
  },
});


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
    const { navigate, location } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedIndex = nextSelected;

    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    }, { replace: true });
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
    const { children, intl } = this.props;

    const commonProps = { group: intl.formatMessage(messages.groupLabel) }

    return (
      <HotkeysContainer
        hotkeys={[
          {
            combo: 'y', label: intl.formatMessage(messages.same), onKeyDown: () => this.onDecideSelected('positive'), ...commonProps
          },
          {
            combo: 'h', label: intl.formatMessage(messages.unsure), onKeyDown: () => this.onDecideSelected('unsure'), ...commonProps
          },
          {
            combo: 'n', label: intl.formatMessage(messages.different), onKeyDown: () => this.onDecideSelected('negative'), ...commonProps
          },
          {
            combo: 'up', label: intl.formatMessage(messages.previous), onKeyDown: this.selectPrevious, ...commonProps
          },
          {
            combo: 'down', label: intl.formatMessage(messages.next), onKeyDown: this.selectNext, ...commonProps
          },
        ]}
      >
        {children}
      </HotkeysContainer>
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
  injectIntl,
)(EntityDecisionHotkeys);
