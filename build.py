import pathlib, sys
root = pathlib.Path(__file__).parent
src = root / 'src'
js_files = sorted((src / 'js').glob('*.js'))
js = '\n'.join(f.read_text(encoding='utf-8') for f in js_files)
js = "(() => {\n" + js + "\n})();"
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'game_check.js').write_text(js, encoding='utf-8')
css = (src / 'style.css').read_text(encoding='utf-8')
html = (src / 'template.html').read_text(encoding='utf-8')
assert '/*CSS*/' in html and '/*JS*/' in html
html = html.replace('/*CSS*/', css).replace('/*JS*/', js)
out = root / 'dist' / 'tiefgang.html'
out.write_text(html, encoding='utf-8')
print('built', out, len(html), 'bytes', len(html.splitlines()), 'lines')
