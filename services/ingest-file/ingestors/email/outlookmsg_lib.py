# -*- coding: utf-8 -*-
"""
ExtractMsg:
    Extracts emails and attachments saved in Microsoft Outlook's .msg files

https://github.com/mattgwwalker/msg-extractor
"""
# --- LICENSE -----------------------------------------------------------------
#
#    Copyright 2013 Matthew Walker
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
import olefile as OleFile
from normality import guess_encoding
from normality.cleaning import remove_unsafe_chars
from imapclient.imapclient import decode_utf7


def windowsUnicode(string):  # pragma: no cover
    if string is None:
        return None
    return str(string, 'utf_16_le')


class Attachment:  # pragma: no cover

    def __init__(self, msg, dir_):
        # Get long filename
        self.longFilename = msg._getStringStream(dir_ + ['__substg1.0_3707'])

        # Get short filename
        self.shortFilename = msg._getStringStream(dir_ + ['__substg1.0_3704'])

        # Get mime type
        self.mimeType = msg._getStream(dir_ + ['__substg1.0_370E001E'])

        # Get attachment data
        self.data = msg._getStream(dir_ + ['__substg1.0_37010102'])


class Message(OleFile.OleFileIO):  # pragma: no cover

    def __init__(self, filename):
        OleFile.OleFileIO.__init__(self, filename)

    def _getStream(self, filename):
        if self.exists(filename):
            stream = self.openstream(filename)
            return stream.read()
        else:
            return None

    def _getStringStream(self, filename):
        """Gets a string representation of the requested filename.
        Checks for both ASCII and Unicode representations and returns
        a value if possible.  If there are both ASCII and Unicode
        versions, then the parameter /prefer/ specifies which will be
        returned.
        """

        if isinstance(filename, list):
            # Join with slashes to make it easier to append the type
            filename = "/".join(filename)

        value = windowsUnicode(self._getStream(filename + '001F'))
        if value is None:
            raw = self._getStream(filename + '001E')
            try:
                value = decode_utf7(raw)
            except Exception:
                encoding = guess_encoding(raw)
                value = raw.decode(encoding, 'replace')

        if value is not None and len(value):
            return remove_unsafe_chars(value)

    def getField(self, name):
        return self._getStringStream('__substg1.0_%s' % name)

    @property
    def attachments(self):
        # Get the attachments
        attachmentDirs = []
        dirList = self.listdir()
        # Used to gets the most nested attachment
        dirList = sorted(dirList, key=lambda dir: len(dir), reverse=True)

        for dir_ in dirList:
            if dir_[0].startswith('__attach'):
                result = [dir_[0]]
                for d in dir_[1:]:
                    if (d == "__substg1.0_3701000D") or \
                       (d.startswith('__attach')):
                        result.append(d)
                    else:
                        break
                if len([d for d in [''.join(d) for d in attachmentDirs]
                        if d.startswith("".join(result))]) == 0:
                    # Reject if a more specific dir is known
                    attachmentDirs.append(result)

        for attachmentDir in attachmentDirs:
            yield Attachment(self, attachmentDir)
