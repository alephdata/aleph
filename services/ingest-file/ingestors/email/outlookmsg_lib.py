# -*- coding: utf-8 -*-
"""
ExtractMsg:
    Extracts emails and attachments saved in Microsoft Outlook's .msg files

https://github.com/mattgwwalker/msg-extractor
"""
import string
import olefile as OleFile
from normality import guess_encoding
from normality.cleaning import remove_unsafe_chars
from imapclient.imapclient import decode_utf7

RANDOM_NAME = string.ascii_uppercase + string.digits

__author__ = "Matthew Walker"
__date__ = "2013-11-19"
__version__ = '0.2'


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

# This property information was sourced from
# http://www.fileformat.info/format/outlookmsg/index.htm
# on 2013-07-22.
properties = {
    '001A': 'Message class',
    '0037': 'Subject',
    '003D': 'Subject prefix',
    '0040': 'Received by name',
    '0042': 'Sent repr name',
    '0044': 'Rcvd repr name',
    '004D': 'Org author name',
    '0050': 'Reply rcipnt names',
    '005A': 'Org sender name',
    '0064': 'Sent repr adrtype',
    '0065': 'Sent repr email',
    '0070': 'Topic',
    '0075': 'Rcvd by adrtype',
    '0076': 'Rcvd by email',
    '0077': 'Repr adrtype',
    '0078': 'Repr email',
    '007D': 'Header',
    '0C1A': 'Sender name',
    '0C1E': 'Sender adr type',
    '0C1F': 'Sender email',
    '0E02': 'Display BCC',
    '0E03': 'Display CC',
    '0E04': 'Display To',
    '0E1D': 'Subject (normalized)',
    '0E28': 'Recvd account1 (uncertain)',
    '0E29': 'Recvd account2 (uncertain)',
    '1000': 'Body',
    '1008': 'RTF sync body tag',
    '1035': 'Message ID',
    '1046': 'Sender email',
    '3001': 'Display name',
    '3002': 'Address type',
    '3003': 'Email address',
    '39FE': '7-bit email (uncertain)',
    '39FF': '7-bit display name',

    # Attachments (37xx)
    '3701': 'Attachment data',
    '3703': 'Attachment extension',
    '3704': 'Attachment short filename',
    '3707': 'Attachment long filename',
    '370E': 'Attachment mime tag',
    '3712': 'Attachment ID (uncertain)',

    # Address book (3Axx):
    '3A00': 'Account',
    '3A02': 'Callback phone no',
    '3A05': 'Generation',
    '3A06': 'Given name',
    '3A08': 'Business phone',
    '3A09': 'Home phone',
    '3A0A': 'Initials',
    '3A0B': 'Keyword',
    '3A0C': 'Language',
    '3A0D': 'Location',
    '3A11': 'Surname',
    '3A15': 'Postal address',
    '3A16': 'Company name',
    '3A17': 'Title',
    '3A18': 'Department',
    '3A19': 'Office location',
    '3A1A': 'Primary phone',
    '3A1B': 'Business phone 2',
    '3A1C': 'Mobile phone',
    '3A1D': 'Radio phone no',
    '3A1E': 'Car phone no',
    '3A1F': 'Other phone',
    '3A20': 'Transmit dispname',
    '3A21': 'Pager',
    '3A22': 'User certificate',
    '3A23': 'Primary Fax',
    '3A24': 'Business Fax',
    '3A25': 'Home Fax',
    '3A26': 'Country',
    '3A27': 'Locality',
    '3A28': 'State/Province',
    '3A29': 'Street address',
    '3A2A': 'Postal Code',
    '3A2B': 'Post Office Box',
    '3A2C': 'Telex',
    '3A2D': 'ISDN',
    '3A2E': 'Assistant phone',
    '3A2F': 'Home phone 2',
    '3A30': 'Assistant',
    '3A44': 'Middle name',
    '3A45': 'Dispname prefix',
    '3A46': 'Profession',
    '3A48': 'Spouse name',
    '3A4B': 'TTYTTD radio phone',
    '3A4C': 'FTP site',
    '3A4E': 'Manager name',
    '3A4F': 'Nickname',
    '3A51': 'Business homepage',
    '3A57': 'Company main phone',
    '3A58': 'Childrens names',
    '3A59': 'Home City',
    '3A5A': 'Home Country',
    '3A5B': 'Home Postal Code',
    '3A5C': 'Home State/Provnce',
    '3A5D': 'Home Street',
    '3A5F': 'Other adr City',
    '3A60': 'Other adr Country',
    '3A61': 'Other adr PostCode',
    '3A62': 'Other adr Province',
    '3A63': 'Other adr Street',
    '3A64': 'Other adr PO box',

    '3FF7': 'Server (uncertain)',
    '3FF8': 'Creator1 (uncertain)',
    '3FFA': 'Creator2 (uncertain)',
    '3FFC': 'To email (uncertain)',
    '403D': 'To adrtype (uncertain)',
    '403E': 'To email (uncertain)',
    '5FF6': 'To (uncertain)'}


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
