import os

frontend_public = os.path.join(os.path.dirname(os.getcwd()), 'frontend', 'public')
cakes_dir = os.path.join(frontend_public, 'images', 'cakes')
feedback_dir = os.path.join(frontend_public, 'images', 'feedback')
os.makedirs(cakes_dir, exist_ok=True)
os.makedirs(feedback_dir, exist_ok=True)

def create_cake_svg(filename, title, subtitle, bg_grad, cake_color):
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_grad[0]}" />
      <stop offset="100%" stop-color="{bg_grad[1]}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#421225" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="800" fill="url(#bg)" />
  <circle cx="400" cy="400" r="320" fill="#FFF8ED" opacity="0.6" />
  <circle cx="400" cy="400" r="260" fill="#F8EFE2" opacity="0.8" />

  <!-- Cake Stand -->
  <ellipse cx="400" cy="580" rx="220" ry="35" fill="#F3E6D5" filter="url(#shadow)" />
  <rect x="370" y="580" width="60" height="70" fill="#E5D4BC" rx="6" />
  <ellipse cx="400" cy="650" rx="110" ry="20" fill="#D6C2A7" />

  <!-- Main Cake Tiers -->
  <g filter="url(#shadow)">
    <!-- Bottom Tier -->
    <path d="M220,440 L220,550 Q400,600 580,550 L580,440 Z" fill="{cake_color}" />
    <ellipse cx="400" cy="440" rx="180" ry="40" fill="#FFF8ED" />

    <!-- Middle Tier / Details -->
    <path d="M260,320 L260,440 Q400,480 540,440 L540,320 Z" fill="{cake_color}" opacity="0.9" />
    <ellipse cx="400" cy="320" rx="140" ry="30" fill="#F8EFE2" />

    <!-- Top Tier -->
    <path d="M300,220 L300,320 Q400,350 500,320 L500,220 Z" fill="{cake_color}" opacity="0.95" />
    <ellipse cx="400" cy="220" rx="100" ry="22" fill="#FFF8ED" />
  </g>

  <!-- Cake Topper / Flowers -->
  <circle cx="400" cy="190" r="24" fill="#7A1F3D" />
  <circle cx="375" cy="205" r="16" fill="#C87D93" />
  <circle cx="425" cy="205" r="16" fill="#E0A8B7" />
  <circle cx="400" cy="215" r="12" fill="#FFF8ED" />

  <!-- Typography overlay label -->
  <rect x="200" y="690" width="400" height="55" rx="28" fill="#7A1F3D" filter="url(#shadow)" />
  <text x="400" y="725" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#FFF8ED" text-anchor="middle">{title}</text>
</svg>'''
    with open(os.path.join(cakes_dir, filename), 'w', encoding='utf-8') as f:
        f.write(svg_content)

cakes_list = [
    ('wedding-hero.jpg', 'Bakelicious Signature Tier', 'Wedding Cake', ['#FFF8ED', '#F3E6D5'], '#7A1F3D'),
    ('bento-floating.jpg', 'Mini Bento Cake', 'Cute Personal', ['#FFF8ED', '#F8EFE2'], '#5A1630'),
    ('chocolate-delight.jpg', 'Classic Chocolate Truffle', 'Rich Ganache', ['#F8EFE2', '#F3E6D5'], '#421225'),
    ('belgian-chocolate.jpg', 'Belgian Chocolate Cake', 'Imports', ['#FFF8ED', '#F3E6D5'], '#360E1E'),
    ('red-velvet.jpg', 'Red Velvet Cream Cake', 'Cream Cheese', ['#FFF8ED', '#F8EFE2'], '#8A1C36'),
    ('fresh-fruit.jpg', 'Fresh Fruit Cream Cake', 'Berries', ['#F8EFE2', '#F3E6D5'], '#9B2A4B'),
    ('butterscotch.jpg', 'Butterscotch Crunch Cake', 'Praline', ['#FFF8ED', '#F3E6D5'], '#B06D3B'),
    ('vanilla-celebration.jpg', 'Vanilla Celebration Cake', 'Madagascar', ['#FFF8ED', '#F8EFE2'], '#7A1F3D'),
    ('bento-pastel-pink.jpg', 'Customised Pastel Bento', 'Hand Lettered', ['#FFF8ED', '#F3E6D5'], '#C87D93'),
    ('wedding-3tier-floral.jpg', 'Rose Pink 3-Tier Cake', 'Wedding', ['#FFF8ED', '#F8EFE2'], '#7A1F3D'),
    ('wedding-spacer-ring.jpg', 'Ring Stand Tier Cake', 'Wedding', ['#F8EFE2', '#F3E6D5'], '#5A1630'),
    ('wedding-classic-white.jpg', 'Elegant Floral Wedding', 'Grand', ['#FFF8ED', '#F3E6D5'], '#7A1F3D'),
    ('cake-platter-1.jpg', 'Celebration Cake Platter', 'Assorted Slices', ['#FFF8ED', '#F8EFE2'], '#421225'),
    ('cake-platter-2.jpg', 'Dessert Sampler Platter', 'Brownies Bento', ['#F8EFE2', '#F3E6D5'], '#7A1F3D')
]

for fn, t, st, bg, cc in cakes_list:
    create_cake_svg(fn, t, st, bg, cc)

def create_feedback_svg(filename, platform, name, text):
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" rx="24" fill="#FFF8ED" stroke="#E5D4BC" stroke-width="4" />
  <rect x="0" y="0" width="600" height="60" fill="{'#075E54' if platform=='WhatsApp' else '#833AB4'}" rx="20" />
  <text x="30" y="38" font-family="sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">{platform} Customer Review</text>

  <!-- User Info -->
  <circle cx="50" cy="110" r="24" fill="#7A1F3D" />
  <text x="50" y="117" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#FFF8ED" text-anchor="middle">{name[0]}</text>
  <text x="90" y="108" font-family="sans-serif" font-size="16" font-weight="bold" fill="#2D2020">{name}</text>
  <text x="90" y="128" font-family="sans-serif" font-size="12" fill="#806F6F">Verified Buyer • Kolkata</text>

  <!-- Stars -->
  <text x="480" y="115" font-size="18">⭐⭐⭐⭐⭐</text>

  <!-- Speech Bubble -->
  <rect x="30" y="160" width="540" height="200" rx="16" fill="#F8EFE2" stroke="#F3E6D5" stroke-width="2" />
  <text x="50" y="200" font-family="sans-serif" font-size="15" fill="#2D2020" font-style="italic">"{text}"</text>
  <text x="50" y="330" font-family="sans-serif" font-size="12" font-weight="bold" fill="#7A1F3D">❤️ Bakelicious Gourmet Bakery</text>
</svg>'''
    with open(os.path.join(feedback_dir, filename), 'w', encoding='utf-8') as f:
        f.write(svg_content)

create_feedback_svg('whatsapp_review_1.png', 'WhatsApp', 'Priya Patel', 'Everyone at the party loved the fresh fruit cream cake! So light and delicious!')
create_feedback_svg('instagram_review_1.png', 'Instagram', 'Rahul Sharma', 'The celebration platter was a huge hit at our office meeting. Truffle slices gone in 5 min!')

print("Generated local cake and feedback assets successfully!")
