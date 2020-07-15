import os
import subprocess
from servicelayer import env
from distutils.spawn import find_executable

from ingestors.util import path_string
from ingestors.exc import ProcessingException


class ShellSupport(object):
    """Provides helpers for shell commands."""

    #: Convertion time before the job gets cancelled.
    COMMAND_TIMEOUT = 10 * 60

    @classmethod
    def find_command(self, name):
        config_name = "%s_BIN" % name
        config_name = config_name.replace("-", "_").upper()
        return env.get(config_name, find_executable(name))

    def exec_command(self, command, *args):
        binary = self.find_command(command)
        if binary is None:
            raise RuntimeError("Program not found: %s" % command)
        cmd = [binary]
        cmd.extend([path_string(a) for a in args])
        try:
            code = subprocess.call(
                cmd, timeout=self.COMMAND_TIMEOUT, stdout=open(os.devnull, "wb")
            )
        except (IOError, OSError) as ose:
            raise ProcessingException("Error: %s" % ose) from ose
        except subprocess.TimeoutExpired as timeout:
            raise ProcessingException("Processing timed out.") from timeout

        if code != 0:
            raise ProcessingException("Failed: %s" % " ".join(cmd))

    def assert_outfile(self, path):
        if not path.exists():
            raise ProcessingException("File missing: {}".format(path))
