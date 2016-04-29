import os
from flask.ext.assets import Bundle

from aleph.core import assets

base_assets = Bundle(
    'vendor/jquery/dist/jquery.js',
    'vendor/moment/moment.js',
    'vendor/pdfjs-dist/build/pdf.js',
    'vendor/pdfjs-dist/build/pdf.worker.js',
    filters='uglifyjs',
    output='assets/base.js'
)

angular_assets = Bundle(
    'vendor/angular/angular.js',
    'vendor/angular-pdf/dist/angular-pdf.js',
    'vendor/angular-route/angular-route.js',
    'vendor/angular-sanitize/angular-sanitize.js',
    'vendor/angular-animate/angular-animate.js',
    'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
    'vendor/angulartics/src/angulartics.js',
    'vendor/angulartics/src/angulartics-piwik.js',
    filters='uglifyjs',
    output='assets/angular.js'
)

css_assets = Bundle(
    'style/aleph.scss',
    depends=['**/*.scss'],
    filters='scss,cssutils',
    output='assets/style.css'
)


def compile_assets(app):
    js_files = []
    js_path = os.path.join(app.static_folder, 'js')
    for (root, dirs, files) in os.walk(js_path):
        for file_name in sorted(files):
            file_path = os.path.relpath(os.path.join(root, file_name),
                                        app.static_folder)
            js_files.append(file_path)

    app_assets = Bundle(*js_files,
                        filters='uglifyjs',
                        output='assets/app.js')

    assets._named_bundles = {}
    assets.register('base', base_assets)
    assets.register('angular', angular_assets)
    assets.register('app', app_assets)
    assets.register('css', css_assets)
