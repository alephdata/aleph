import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { connect } from "react-redux";
import c from 'classnames';
import { Tabs, Tab } from '@blueprintjs/core';
import queryString from "query-string";

import { Count } from 'src/components/common';
import { queryEntitySimilar } from 'src/queries';
import { selectEntityReferences, selectEntityTags, selectSchemata, selectEntitiesResult } from "src/selectors";
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityInfoMode from "src/components/Entity/EntityInfoMode";
import reverseLabel from 'src/util/reverseLabel';
import TextLoading from "src/components/common/TextLoading";

import './ViewsMenu.css';

class EntityViewsMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mode: props.activeMode
    };

    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(mode) {
    const { history, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if(isPreview) {
      parsedHash['preview:mode'] = mode;
    } else {
      parsedHash['mode'] = mode;
    }
    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
    this.setState({mode: mode});
  }

  render() {
    const { intl, isPreview, activeMode, entity, references, tags, similar, schemata } = this.props;
    const { mode } = this.state;

    return (
      <Tabs id="EntityInfoTabs" onChange={this.handleTabChange} selectedTabId={mode} className='info-tabs-padding'>
        {isPreview && (<Tab id="info"
                            title={
                              <React.Fragment>
                                <i className='fa fa-fw fa-info'/>
                                <FormattedMessage id="entity.info.info" defaultMessage="Info"/>
                              </React.Fragment>
                            }
                            panel={
                              <EntityInfoMode entity={entity} />
                            }
        />)}
        {references.results !== undefined && references.results.map((ref) => (
          <Tab id={ref.property.qname}
               key={ref.property.qname}
               title={
                 <React.Fragment>
                   <i className={c('fa', 'fa-fw', schemata[ref.schema].icon)} />
                   <FormattedMessage id="entity.info.overview" defaultMessage={reverseLabel(schemata, ref)}/>
                   <Count count={ref.count} />
                 </React.Fragment>
               }
               panel={
                 <EntityReferencesMode entity={entity} mode={activeMode} />
               }
          />
        ))}
        <Tab id="tags"
             disabled={tags.total < 1}
             title={
                <TextLoading children={<React.Fragment>
                  <i className='fa fa-fw fa-tags'/>
                  <FormattedMessage id="entity.info.tags" defaultMessage="Tags"/>
                  <Count count={tags.total} />
                </React.Fragment>} loading={tags.isLoading}/>
             }
             panel={
                <EntityTagsMode entity={entity} />
             } />
        <Tab id="similar"
             disabled={similar.total < 1}
             title={
                <TextLoading children={<React.Fragment>
                  <i className='fa fa-fw fa-repeat'/>
                  <FormattedMessage id="entity.info.similar" defaultMessage="Similar"/>
                  <Count count={similar.total} />
                </React.Fragment>} loading={similar.isLoading}/>
             }
             panel={
                <EntitySimilarMode entity={entity} />
             } />
      </Tabs>
    );

  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  return {
    references: selectEntityReferences(state, entity.id),
    tags: selectEntityTags(state, entity.id),
    similar: selectEntitiesResult(state, queryEntitySimilar(location, entity.id)),
    schemata: selectSchemata(state)
  };
};

EntityViewsMenu = connect(mapStateToProps)(EntityViewsMenu);
EntityViewsMenu = injectIntl(EntityViewsMenu);
EntityViewsMenu = withRouter(EntityViewsMenu);
export default EntityViewsMenu;