import os
from flask.ext.assets import Bundle

from aleph.core import assets, app

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

js_files = []
for (root, dirs, files) in os.walk(os.path.join(app.static_folder, 'js')):
    for file_name in files:
        file_path = os.path.relpath(os.path.join(root, file_name),
                                    app.static_folder)
        js_files.append(file_path)

app_assets = Bundle(*js_files,
                    filters='uglifyjs',
                    output='assets/app.js')

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
