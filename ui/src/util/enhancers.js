import { compose } from 'redux';
import { connect } from 'react-redux';
import withRouter from 'react-router/es/withRouter';
import { injectIntl } from 'react-intl';


export function connectedWithRouter({
  mapStateToProps = () => {}, mapDispatchToProps, mergeProps, options,
}) {
  return compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps, mergeProps, options),
  );
}
export function translatableConnected({
  mapStateToProps = () => {}, mapDispatchToProps, mergeProps, options,
}) {
  return compose(
    connect(mapStateToProps, mapDispatchToProps, mergeProps, options),
    injectIntl,
  );
}

export function enhancer({
  mapStateToProps = () => {}, mapDispatchToProps, mergeProps, options,
}) {
  return compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps, mergeProps, options),
    injectIntl,
  );
}

export function withRouterTranslation() {
  return compose(
    withRouter,
    injectIntl,
  );
}
