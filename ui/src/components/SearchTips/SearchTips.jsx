import React from 'react';
import { Drawer, Position } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';


import './SearchTips.scss';


/* eslint-disable jsx-quotes */
export default class SearchTips extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    const { navbarRef } = this.props;
    return (
      <div className="SearchTips" ref={this.ref}>
        <Drawer
          isOpen={this.props.isOpen}
          position={Position.TOP}
          canOutsideClickClose
          usePortal
          hasBackdrop={false}
          enforceFocus={false}
          portalContainer={this.ref.current}
          onClose={(e) => {
            // prevent interaction with Navbar from closing
            if (!navbarRef || !navbarRef.current || !navbarRef.current.contains(e.target)) {
              this.props.onToggle();
            }
          }}
        >
          <div className="SearchTips__content">
            <div className="SearchTips__section">
              <h5 className="SearchTips__section__title">
                <FormattedMessage
                  id="searchTips.exact.title"
                  defaultMessage="Exact matches"
                />
              </h5>
              <ul className="SearchTips__section__content">
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.exact.1"
                    defaultMessage='Use <em>""</em> to return only exact matches.  For example, the search <em>"barack obama"</em> will return only results containing the exact phrase "barack obama"'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
              </ul>
            </div>
            <div className="SearchTips__section">
              <h5 className="SearchTips__section__title">
                <FormattedMessage
                  id="searchTips.spelling.title"
                  defaultMessage="Spelling variants"
                />
              </h5>
              <ul className="SearchTips__section__content">
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.spelling.1"
                    defaultMessage='Use <em>~</em> to increase the fuzziness of a search.  For example, <em>Wladimir~2</em> will return not just the term “Wladimir” but also similar spellings such as "Wladimyr" or "Vladimyr". A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
              </ul>
            </div>
            <div className="SearchTips__section">
              <h5 className="SearchTips__section__title">
                <FormattedMessage
                  id="searchTips.composite.title"
                  defaultMessage="Composite queries"
                />
              </h5>
              <ul className="SearchTips__section__content">
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.composite.1"
                    defaultMessage='The search <em>banana ice cream</em> prioritizes results that contain all three terms: banana, ice, and cream.  Results with one or more of the given terms will follow'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.composite.2"
                    defaultMessage='<em>+banana ice cream</em> requires that only results with the term banana will be returned, while ice and cream are optional'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.composite.3"
                    defaultMessage='<em>-banana ice cream</em> ensures that no results with the term banana will be returned'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.composite.4"
                    defaultMessage='<em>banana AND “ice cream”</em> requires that only results with both banana and ice cream are returned'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.composite.5"
                    defaultMessage='<em>banana OR “ice cream”</em> ensures that only results with either banana or ice cream are returned'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.composite.6"
                    defaultMessage='These operations can be combined as you like.  For example <em>banana AND (“ice cream” OR “gelato”) -chocolate</em> will return results where banana appears with ice cream or gelato in the document but where chocolate is not present'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
              </ul>
            </div>
            <div className="SearchTips__section">
              <h5 className="SearchTips__section__title">
                <FormattedMessage
                  id="searchTips.proximity.title"
                  defaultMessage="Proximity searches"
                />
              </h5>
              <ul className="SearchTips__section__content">
                <li className="SearchTips__section__item">
                  <FormattedMessage
                    id="searchTips.proximity.1"
                    defaultMessage='To search for two terms within a certain distance of each other, use double quotes <em>""</em> around the two words and the tilde <em>~</em> symbol at the end of the phrase.  For example <em>“Bank America”~2</em> will find relevant matches with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".'
                    values={{
                      em: (...chunks) => <em>{chunks}</em>,
                    }}
                  />
                </li>
              </ul>
            </div>
          </div>
        </Drawer>
      </div>
    );
  }
}
/* eslint-enable jsx-quotes */
