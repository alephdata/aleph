import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Pre } from '@blueprintjs/core';

import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';

import './EmailViewer.scss';

const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    content: selectDocumentContent(state, document.id),
  };
};

@connect(mapStateToProps)
export default class EmailViewer extends React.Component {
  renderBody() {
    const { content } = this.props;
    if (content.html && content.html.length) {
      return <span className="email-body" dangerouslySetInnerHTML={{ __html: content.html }} />;
    }
    if (content.text && content.text.length > 0) {
      return <Pre className="email-body">{content.text}</Pre>;
    }
    return (
      <p className="email-no-body bp3-text-muted">
        <FormattedMessage id="email.body.empty" defaultMessage="No message body." />
      </p>
    );
  }

  render() {
    const { content } = this.props;
    const { headers = {} } = content;
    if (content.shouldLoad || content.isLoading) {
      return <SectionLoading />;
    }

    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner EmailViewer">
            <div className="email-header">
              <table className="bp3-html-table">
                <tbody>
                  {headers.date && (
                    <tr>
                      <th><FormattedMessage id="email.date" defaultMessage="Date" /></th>
                      <td>{headers.date}</td>
                    </tr>
                  )}
                  {headers.from && (
                    <tr>
                      <th><FormattedMessage id="email.from" defaultMessage="From" /></th>
                      <td>{headers.from}</td>
                    </tr>
                  )}
                  <tr>
                    <th><FormattedMessage id="email.subject" defaultMessage="Subject" /></th>
                    <td>{headers.subject}</td>
                  </tr>
                  {headers.to && (
                    <tr>
                      <th><FormattedMessage id="email.to" defaultMessage="Recipient" /></th>
                      <td>{headers.to}</td>
                    </tr>
                  )}
                  {headers.cc && (
                    <tr>
                      <th><FormattedMessage id="email.cc" defaultMessage="CC" /></th>
                      <td>{headers.cc}</td>
                    </tr>
                  )}
                  {headers.bcc && (
                    <tr>
                      <th><FormattedMessage id="email.bcc" defaultMessage="BCC" /></th>
                      <td>{headers.bcc}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <React.Fragment>
              {this.renderBody()}
            </React.Fragment>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
