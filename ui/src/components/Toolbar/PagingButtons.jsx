import React from 'react';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup, Button, AnchorButton, Divider } from '@blueprintjs/core';

import './PagingButtons.scss';


class PagingButtons extends React.PureComponent {
  getPageLink(page) {
    const { location } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.page = page;
    return queryString.stringify(parsedHash);
  }

  getRotateLink(rotation) {
    const { location } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.rotate = rotation < 0 ? (360 + rotation) % 360 : rotation % 360;
    return queryString.stringify(parsedHash);
  }

  render() {
    const { document, location, numberOfPages, onRotate } = this.props;

    if (document.isLoading || !document.links) {
      return null;
    }

    const parsedHash = queryString.parse(location.hash);

    const currentPage = (
      parsedHash.page && parseInt(parsedHash.page, 10) <= numberOfPages
    ) ? parseInt(parsedHash.page, 10) : 1;

    const currentRotation = (
      parsedHash.rotate && parseInt(parsedHash.rotate, 10) % 90 === 0
    ) ? parseInt(parsedHash.rotate, 10) : 0;

    // Only displays paging buttons on PDF docs
    // Having the logic here makes it easier to use this component.
    if (currentPage && currentPage > 0
        && numberOfPages && numberOfPages > 0) {
      return (
        <ButtonGroup className="PagingButtons" fill>
          <AnchorButton minimal href={`#${this.getPageLink(currentPage - 1)}`} icon="arrow-left" disabled={currentPage <= 1} />
          <Button disabled className="paging-text">
            <FormattedMessage
              id="document.paging"
              defaultMessage="Page {currentPage} of {numberOfPages}"
              values={{
                currentPage,
                numberOfPages,
              }}
            />
          </Button>
          <AnchorButton minimal href={`#${this.getPageLink(currentPage + 1)}`} icon="arrow-right" disabled={currentPage >= numberOfPages} />
          <Divider />
          <AnchorButton minimal href={`#${this.getRotateLink(currentRotation - 90)}`} icon="image-rotate-left" />
          <AnchorButton minimal href={`#${this.getRotateLink(currentRotation + 90)}`} icon="image-rotate-right" />
        </ButtonGroup>
      );
    }
    return null;
  }
}


export default withRouter(PagingButtons);
