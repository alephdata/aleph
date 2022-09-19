import React from 'react';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import {
  ButtonGroup,
  AnchorButton,
  Divider,
  InputGroup,
} from '@blueprintjs/core';

import withRouter from 'app/withRouter';
import normalizeDegreeValue from 'util/normalizeDegreeValue';

import './PagingButtons.scss';

class PagingButtons extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pageInputVal: props.page,
    };
  }

  componentDidUpdate(prevProps) {
    const { page } = this.props;
    if (prevProps.page !== page) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        pageInputVal: page,
      });
    }
  }

  getPageLink(page) {
    const { location } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.page = page;
    return queryString.stringify(parsedHash);
  }

  getRotateLink(rotateDelta) {
    const { location, rotate } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.rotate = normalizeDegreeValue((rotate || 0) + rotateDelta);
    return queryString.stringify(parsedHash);
  }

  changePageInput = (e) => {
    this.setState({ pageInputVal: e.target.value });
  };

  goToPage = (e) => {
    e.preventDefault();
    const { navigate, location } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.page = this.state.pageInputVal;

    navigate({
      hash: queryString.stringify(parsedHash),
    });
  };

  render() {
    const { document, numberOfPages, page, showRotateButtons } = this.props;
    const { pageInputVal } = this.state;

    if (document.isPending || !document.links) {
      return null;
    }

    // Only displays paging buttons on PDF docs
    // Having the logic here makes it easier to use this component.
    if (page && page > 0 && numberOfPages && numberOfPages > 0) {
      return (
        <ButtonGroup className="PagingButtons" fill>
          <AnchorButton
            minimal
            href={`#${this.getPageLink(page - 1)}`}
            icon="arrow-left"
            disabled={page <= 1}
          />
          <div className="PagingButtons__middle">
            <FormattedMessage
              id="document.paging"
              defaultMessage="Page {pageInput} of {numberOfPages}"
              values={{
                pageInput: (
                  <form
                    className="PagingButtons__input"
                    onSubmit={this.goToPage}
                    autoComplete="off"
                  >
                    <InputGroup
                      id="page"
                      onChange={this.changePageInput}
                      value={pageInputVal}
                      type="number"
                      min={0}
                      max={numberOfPages}
                    />
                  </form>
                ),
                numberOfPages,
              }}
            />
          </div>
          {showRotateButtons && (
            <>
              <AnchorButton
                minimal
                href={`#${this.getRotateLink(-90)}`}
                icon="image-rotate-left"
              />
              <AnchorButton
                minimal
                href={`#${this.getRotateLink(90)}`}
                icon="image-rotate-right"
              />
              <Divider />
            </>
          )}
          <AnchorButton
            minimal
            href={`#${this.getPageLink(page + 1)}`}
            icon="arrow-right"
            disabled={page >= numberOfPages}
          />
        </ButtonGroup>
      );
    }
    return null;
  }
}

export default withRouter(PagingButtons);
