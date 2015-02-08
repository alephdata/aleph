from flask.ext.assets import Bundle

from aleph.core import assets

deps_assets = Bundle(
    'vendor/jquery/dist/jquery.js',
    'vendor/d3/d3.js',
    'vendor/angular/angular.js',
    'vendor/ng-debounce/angular-debounce.js',
    'vendor/angular-route/angular-route.js',
    'vendor/angular-animate/angular-animate.js',
    'vendor/angular-truncate/src/truncate.js',
    'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
    'vendor/nginfinitescroll/build/ng-infinite-scroll.js',
    filters='uglifyjs',
    output='assets/deps.js'
)

app_assets = Bundle(
    'js/app.js',
    'js/services.js',
    'js/search.js',
    'js/collections.js',
    'js/lists.js',
    'js/entities.js',
    'js/ctrl.js',
    filters='uglifyjs',
    output='assets/app.js'
)

css_assets = Bundle(
    'style/style.less',
    'style/animations.css',
    filters='less',
    output='assets/style.css'
)

assets.register('deps', deps_assets)
assets.register('app', app_assets)
assets.register('css', css_assets)
