import textwrap

def to_markdown(parts):
    formatted_parts = []
    for part in parts:
        text = part.text
        text = text.replace('-', ' *')  # Bullet point styling
        text = text.replace('* ', '*')
        text = text.replace('*', '**').replace('**', '')
        text = text.replace('***', ' ')
        text = text.replace('*****', '\n')
        formatted_parts.append(text)
    return textwrap.indent('\n'.join(formatted_parts), '> ', predicate=lambda _: True)
