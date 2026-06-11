import zipfile
import xml.etree.ElementTree as ET

try:
    with zipfile.ZipFile('shivanshvrma.docx') as docx:
        xml_content = docx.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = []
    for p in tree.iterfind('.//w:p', ns):
        texts = [n.text for n in p.iterfind('.//w:t', ns) if n.text]
        if texts:
            paragraphs.append(''.join(texts))
    print('\n'.join(paragraphs))
except Exception as e:
    print(f"Error: {e}")
