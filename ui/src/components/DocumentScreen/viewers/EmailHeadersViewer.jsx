import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import './EmailHeadersViewer.css';

class EmailHeadersViewer extends Component {
  render() {
    const { document } = this.props;
    const { headers = {} } = document;

    return (
      <div className="EmailHeadersViewer">
        <table className="pt-table">
            <tbody>
                {headers.date && (
                  <tr>
                    <th><FormattedMessage id="email.date" defaultMessage="Date"/></th>
                    <td>{headers.date}</td>
                  </tr>
                )}
                {headers.from && (
                  <tr>
                    <th><FormattedMessage id="email.from" defaultMessage="From"/></th>
                    <td>{headers.from}</td>
                  </tr>
                )}
                <tr>
                  <th><FormattedMessage id="email.subject" defaultMessage="Subject"/></th>
                  <td>{headers.subject}</td>
                </tr>
                {headers.to && (
                  <tr>
                    <th><FormattedMessage id="email.to" defaultMessage="Recipient"/></th>
                    <td>{headers.to}</td>
                  </tr>
                )}
                {headers.cc && (
                  <tr>
                    <th><FormattedMessage id="email.cc" defaultMessage="CC"/></th>
                    <td>{headers.cc}</td>
                  </tr>
                )}
                {headers.bcc && (
                  <tr>
                    <th><FormattedMessage id="email.bcc" defaultMessage="BCC"/></th>
                    <td>{headers.bcc}</td>
                  </tr>
                )}
                {!!document.children && (
                  <tr>
                    <th><FormattedMessage id="email.attachment" defaultMessage="Attachments"/></th>
                    <td>
                      <a href="#children">
                        <i className="fa fa-paperclip" aria-hidden="true"></i>
                        {' '}
                        <FormattedMessage id="email.attachment.count"
                                          defaultMessage="{count} attached files"
                                          values={{
                                            count: document.children
                                          }} />
                      </a>
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
      </div>
    );
  }
}

export default EmailHeadersViewer;
