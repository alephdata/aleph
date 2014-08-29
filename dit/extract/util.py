from os import path


def file_empty(file_name):
    if not path.exists(file_name):
        return True
    with open(file_name, 'rb') as fh:
        fh.seek(0, 2)
        return fh.tell() < 10
