import os
import logging
import subprocess
from servicelayer import env
from distutils.spawn import find_executable

from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class ShellCommand(object):
    """Provides helpers for shell commands."""

    #: Convertion time before the job gets cancelled.
    COMMAND_TIMEOUT = 10 * 60

    @classmethod
    def find_command(self, name):
        config_name = '%s_BIN' % name
        config_name = config_name.replace('-', '_').upper()
        return env.get(config_name, find_executable(name))

    def exec_command(self, command, *args):
        binary = self.find_command(command)
        if binary is None:
            raise RuntimeError("Program not found: %s" % command)
        cmd = [binary]
        cmd.extend(args)
        try:
            code = subprocess.call(cmd, timeout=self.COMMAND_TIMEOUT,
                                   stdout=open(os.devnull, 'wb'))
        except (IOError, OSError) as ose:
            raise ProcessingException('Error: %s' % ose)
        except subprocess.TimeoutExpired:
            raise ProcessingException('Processing timed out.')

        if code != 0:
            raise ProcessingException('Failed: %s' % ' '.join(cmd))

    def assert_outfile(self, path):
        if not path.exists():
            raise ProcessingException('File missing: {}'.format(path))
