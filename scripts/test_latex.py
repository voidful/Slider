import sys
import json
import base64
sys.path.insert(0, '/Users/voidful/PycharmProjects/paper-slide/scripts')
from render_slideshow_artifact import normalize_latex_in_slides

eq = r"$$f^{\star}=\arg\min_f\;\mathbb{E}_x\big[\mathrm{KL}(f(\cdot\mid x),p(\cdot\mid x)) - \gamma\,\mathcal{H}(f(\cdot\mid x))\big]$$"
slides = [{'equation': eq}]
print('Original:', repr(eq))
res = normalize_latex_in_slides(slides)
print('After norm:', repr(res[0]['equation']))

encoded = base64.b64encode(json.dumps(res).encode('utf-8')).decode('ascii')
print('\nBase64 Payload:', encoded)
