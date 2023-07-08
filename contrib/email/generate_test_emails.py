# This script generates minimal RFC2822 email messages to test how Aleph ingests
# and displays different types of emails
#
# Usage: python3 generate_test_emails.py EXAMPLE
#
# Examples:
# - plaintext
# - html
# - alternative
# - mixed
# - nested
# - empty
# - attached-plaintext
# - attached-alternative
# - attached-inline
# - base64

import sys
from email.message import EmailMessage
from email.iterators import _structure
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

sender = "john.doe@example.org"
recipient = "jane.doe@example.org"

def plaintext_only():
    """Generate a plaintext-only email."""
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "Plaintext only"
    msg.set_content("This is the body of a plaintext message.")

    return msg


def html_only():
    """Generate an email with a single HTML part."""
    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "HTML only"

    html_part = MIMEText("This is the body of an <strong>HTML</strong> message.", "html")
    msg.attach(html_part)

    return msg


def multipart_alternative():
    """Generate an email with HTML and plaintext alternatives."""
    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "Multipart alternative"

    text_part = MIMEText("This is a **multipart/alternative** message.\n", "plain")
    html_part = MIMEText("This is a <strong>multipart/alterantive</strong> message.\n", "html")

    msg.attach(text_part)
    msg.attach(html_part)

    return msg


def multipart_mixed():
    """Generate an email with multiple HTML and plaintext parts, but not alternatives."""
    msg = MIMEMultipart("mixed")
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "Multipart mixed"

    part_1 = MIMEText("This is the first part (plaintext)\n", "plain")
    part_2 = MIMEText("This is the second part (HTML)\n", "html")
    part_3 = MIMEText("This is the third part (plaintext)\n", "plain")
    part_4 = MIMEText("This is the fourth part (HTML)\n", "html")

    msg.attach(part_1)
    msg.attach(part_2)
    msg.attach(part_3)
    msg.attach(part_4)

    return msg


def multipart_nested():
    """Generate a nested multipart email."""
    msg = MIMEMultipart("mixed")
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "Nested multipart email"

    part_1 = MIMEMultipart("alternative")
    part_1_text = MIMEText("This is the **first** part\n", "plain")
    part_1_html = MIMEText("This is the <strong>first</strong> part\n", "html")
    part_1.attach(part_1_text)
    part_1.attach(part_1_html)

    part_2 = MIMEText("This is the second part\n", "plain")

    msg.attach(part_1)
    msg.attach(part_2)

    return msg


def empty():
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "Empty body"

    return msg


def attached_plaintext():
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "This message has an email attachment"
    msg.set_content("This is the body of the email that contains the attachment.")
    msg.add_attachment(plaintext_only())

    return msg


def attached_alternative():
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "This message has a multipart email attachment"
    msg.set_content("This is the body of the email that contains the attachment.")
    msg.add_attachment(multipart_alternative())

    return msg


def attached_inline():
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "This message contains an inline RFC2822 message"
    msg.set_content("This is the body of the email.")
    msg.add_attachment(plaintext_only(), disposition="inline")

    return msg


def base64():
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = "This message has a base64 encoded payload"
    msg.set_content("Base64 email payload", cte="base64")

    return msg


if __name__ == "__main__":
    examples = {
        "plaintext": plaintext_only(),
        "html": html_only(),
        "alternative": multipart_alternative(),
        "mixed": multipart_mixed(),
        "nested": multipart_nested(),
        "empty": empty(),
        "attached-plaintext": attached_plaintext(),
        "attached-alternative": attached_alternative(),
        "attached-inline": attached_inline(),
        "base64": base64(),
    }

    args = sys.argv[1:]

    if not len(args) or args[0] not in examples.keys():
        print(plaintext_only())
    else:
        print(examples[args[0]])
