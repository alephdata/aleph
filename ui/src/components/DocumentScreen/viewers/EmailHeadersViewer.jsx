import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import './EmailHeadersViewer.css';

class EmailHeadersViewer extends Component {
  render() {
    const { headers } = this.props;
    return (
      <div className="EmailHeadersViewer">
        <table className="pt-table pt-bordered">
            <tbody>
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
                {headers.date && (
                    <tr>
                        <th><FormattedMessage id="email.date" defaultMessage="Date"/></th>
                        <td>{headers.date}</td>
                    </tr>
                )}
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
            </tbody>
        </table>
      </div>
    );
  }
}

export default EmailHeadersViewer;
