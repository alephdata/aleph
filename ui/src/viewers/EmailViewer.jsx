import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Pre } from '@blueprintjs/core';

import Property from 'src/components/common/Property';
import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';

import './EmailViewer.scss';


class EmailViewer extends React.Component {
  headerProperty(name) {
    const { document } = this.props;
    const prop = document.schema.getProperty(name);
    const values = document.getProperty(prop);
    if (values.length === 0) {
      return null;
    }
    return (
      <tr key={prop.name}>
        <th>{prop.label}</th>
        <td>
          <Property.Values prop={prop} values={values} separator=", " />
        </td>
      </tr>
    );
  }

  renderHeaders() {
    let { headers } = this.props.content;
    headers = headers || {};
    return (
      <div className="email-header">
        <table className="bp3-html-table">
          <tbody>
            {this.headerProperty('from')}
            {headers.from && (
              <tr>
                <th><FormattedMessage id="email.from" defaultMessage="From" /></th>
                <td>{headers.from}</td>
              </tr>
            )}
            {this.headerProperty('sender')}
            {this.headerProperty('date')}
            {headers.date && (
              <tr>
                <th><FormattedMessage id="email.date" defaultMessage="Date" /></th>
                <td>{headers.date}</td>
              </tr>
            )}
            {this.headerProperty('subject')}
            {headers.subject && (
              <tr>
                <th><FormattedMessage id="email.subject" defaultMessage="Subject" /></th>
                <td>{headers.subject}</td>
              </tr>
            )}
            {this.headerProperty('to')}
            {headers.to && (
              <tr>
                <th><FormattedMessage id="email.to" defaultMessage="Recipient" /></th>
                <td>{headers.to}</td>
              </tr>
            )}
            {this.headerProperty('cc')}
            {headers.cc && (
              <tr>
                <th><FormattedMessage id="email.cc" defaultMessage="CC" /></th>
                <td>{headers.cc}</td>
              </tr>
            )}
            {this.headerProperty('bcc')}
            {headers.bcc && (
              <tr>
                <th><FormattedMessage id="email.bcc" defaultMessage="BCC" /></th>
                <td>{headers.bcc}</td>
              </tr>
            )}
            {this.headerProperty('emitters')}
            {this.headerProperty('recipients')}
          </tbody>
        </table>
      </div>
    );
  }

  renderBody() {
    const { content } = this.props;
    if (content.html && content.html.length) {
      return <span dangerouslySetInnerHTML={{ __html: content.html }} />;
    }
    if (content.text && content.text.length > 0) {
      return <Pre>{content.text}</Pre>;
    }
    return (
      <p className="bp3-text-muted">
        <FormattedMessage id="email.body.empty" defaultMessage="No message body." />
      </p>
    );
  }

  render() {
    const { content } = this.props;
    if (content.shouldLoad || content.isLoading) {
      return <SectionLoading />;
    }
    return (
      <div className="outer">
        <div className="inner EmailViewer">
          {this.renderHeaders()}
          <div className="email-body">
            {this.renderBody()}
          </div>
        </div>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    content: selectDocumentContent(state, document.id),
  };
};

export default connect(mapStateToProps)(EmailViewer);
