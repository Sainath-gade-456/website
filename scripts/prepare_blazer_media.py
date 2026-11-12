import os
from PIL import Image

ROOT = os.getcwd()
ASSETS = os.path.join(ROOT, 'assets')

# 1. Detail shot from mewos_tailored_blazer.png
blazer_orig = os.path.join(ASSETS, 'mewos_tailored_blazer.png')
if os.path.exists(blazer_orig):
    im_blazer = Image.open(blazer_orig)
    # Crop focused on lapel and closure button
    im_detail = im_blazer.crop((200, 120, 820, 740)).resize((1024, 1024), Image.Resampling.LANCZOS)
    im_detail.convert('RGB').save(os.path.join(ASSETS, 'mewos_blazer_detail.jpg'), quality=95)
    print("Created mewos_blazer_detail.jpg")

    # Second angle / back/sleeve silhouette crop
    im_sleeve = im_blazer.crop((100, 100, 924, 924)).resize((1024, 1024), Image.Resampling.LANCZOS)
    im_sleeve.convert('RGB').save(os.path.join(ASSETS, 'mewos_blazer_angle.jpg'), quality=95)
    print("Created mewos_blazer_angle.jpg")

# 2. If test_inna.jpg exists, create mewos_blazer_model.jpg
inna_path = os.path.join(ASSETS, 'test_inna.jpg')
if os.path.exists(inna_path):
    im_model = Image.open(inna_path)
    w, h = im_model.size
    size = min(w, h)
    left = (w - size) // 2
    top = int(h * 0.15)
    right = left + size
    bottom = min(top + size, h)
    im_model_cropped = im_model.crop((left, top, right, bottom)).resize((1024, 1024), Image.Resampling.LANCZOS)
    im_model_cropped.save(os.path.join(ASSETS, 'mewos_blazer_model.jpg'), quality=95)
    os.remove(inna_path)
    print("Created mewos_blazer_model.jpg")
