from flask.ext.assets import Bundle

from aleph.core import assets

deps_assets = Bundle(
    'vendor/jquery/dist/jquery.js',
    'vendor/d3/d3.js',
    'vendor/angular/angular.js',
    'vendor/ng-debounce/angular-debounce.js',
    'vendor/angular-route/angular-route.js',
    'vendor/angular-animate/angular-animate.js',
    'vendor/angular-loading-bar/build/loading-bar.js',
    'vendor/angular-truncate/src/truncate.js',
    'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
    'vendor/nginfinitescroll/build/ng-infinite-scroll.js',
    filters='uglifyjs',
    output='assets/deps.js'
)

app_assets = Bundle(
    'js/config.js',
    'js/controllers/AppCtrl.js',
    'js/controllers/ListEntitiesCtrl.js',
    'js/controllers/ListsDeleteCtrl.js',
    'js/controllers/ListsEditCtrl.js',
    'js/controllers/ListsNewCtrl.js',
    'js/controllers/ProfileCtrl.js',
    'js/controllers/SearchExportCtrl.js',
    'js/controllers/SearchGraphCtrl.js',
    'js/controllers/SearchTableCtrl.js',
    'js/controllers/SourcesEditCtrl.js',
    'js/controllers/SourcesIndexCtrl.js',
    'js/controllers/SourcesNewCtrl.js',
    'js/directives/alephPager.js',
    'js/directives/entityIcon.js',
    'js/directives/listsFrame.js',
    'js/directives/searchFrame.js',
    'js/directives/sourcesFrame.js',
    'js/loaders/loadCrawlers.js',
    'js/loaders/loadSearchAttributes.js',
    'js/loaders/loadSearchContext.js',
    'js/loaders/loadSearchGraph.js',
    'js/loaders/loadSearchResult.js',
    'js/loaders/loadSource.js',
    'js/loaders/loadUsers.js',
    'js/services/Flash.js',
    'js/services/Query.js',
    'js/services/QueryContext.js',
    'js/services/Session.js',
    'js/services/Validation.js',
    'js/util.js',
    filters='uglifyjs',
    output='assets/app.js'
)

css_assets = Bundle(
    'style/style.less',
    'vendor/angular-loading-bar/build/loading-bar.css',
    'style/animations.css',
    filters='less',
    output='assets/style.css'
)

assets.register('deps', deps_assets)
assets.register('app', app_assets)
assets.register('css', css_assets)
