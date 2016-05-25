import os
from flask.ext.assets import Bundle

from aleph.core import assets

base_assets = Bundle(
    # include via CDN
    # 'vendor/jquery/dist/jquery.js',
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
    'vendor/angular-truncate/src/truncate.js',
    'vendor/angular-sanitize/angular-sanitize.js',
    'vendor/angular-loading-bar/src/loading-bar.js',
    'vendor/angular-animate/angular-animate.js',
    'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
    filters='uglifyjs',
    output='assets/angular.js'
)

css_assets = Bundle(
    'style/aleph.scss',
    depends=['**/*.scss'],
    filters='scss,cssutils',
    output='assets/style.css'
)


def generate_custom_scss(app):
    # This is a hack to allow an extra SCSS file to be specified in the
    # settings.
    custom_scss = os.path.join(app.static_folder, 'style', '_custom.scss')
    old_scss_text = None
    if os.path.isfile(custom_scss):
        with open(custom_scss, 'r') as fh:
            old_scss_text = fh.read()
    scss_text = ''
    if app.config.get('CUSTOM_SCSS_PATH'):
        with open(app.config['CUSTOM_SCSS_PATH'], 'r') as fin:
            scss_text = fin.read()
    if scss_text != old_scss_text:
        with open(custom_scss, 'w') as fout:
            fout.write(scss_text)


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
    generate_custom_scss(app)

    assets._named_bundles = {}
    assets.register('base', base_assets)
    assets.register('angular', angular_assets)
    assets.register('app', app_assets)
    assets.register('css', css_assets)
