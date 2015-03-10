import os
from flask import render_template

from aleph.core import app


def angular_templates():
    partials_dir = os.path.join(app.static_folder, 'templates')
    for (root, dirs, files) in os.walk(partials_dir):
        for file_name in files:
            file_path = os.path.join(root, file_name)
            with open(file_path, 'rb') as fh:
                file_name = file_path[len(partials_dir) + 1:]
                yield (file_name, fh.read().decode('utf-8'))


@app.route('/lists/<path:id>')
@app.route('/lists')
@app.route('/sources/<path:slug>')
@app.route('/sources')
@app.route('/search')
@app.route('/search/export')
@app.route('/search/graph')
@app.route('/graph')
@app.route('/login')
@app.route('/')
def ui(**kwargs):
    return render_template("layout.html", templates=angular_templates())
