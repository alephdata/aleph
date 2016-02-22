import os
from flask import render_template

from aleph.core import app
from aleph.views.cache import enable_cache


def angular_templates():
    partials_dir = os.path.join(app.static_folder, 'templates')
    for (root, dirs, files) in os.walk(partials_dir):
        for file_name in files:
            file_path = os.path.join(root, file_name)
            with open(file_path, 'rb') as fh:
                file_name = file_path[len(partials_dir) + 1:]
                yield (file_name, fh.read().decode('utf-8'))


@app.route('/')
def ui(**kwargs):
    enable_cache(server_side=True)
    return render_template("layout.html", templates=angular_templates())
