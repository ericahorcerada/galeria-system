# Editable Homepage Admin

This version keeps the 8 artists and adds an admin homepage editor.

Open `/admin/homepage` to edit:
- Hero label, title, highlight, and description
- Primary and secondary button text/links
- Customer homepage background image
- Featured card image/text

Images can be uploaded from your computer or pasted as an internet image URL.
Uploaded homepage images are saved in `public/uploads/homepage`.
Homepage settings are saved in MySQL table `homepage_settings`.

The customer homepage reads `/api/homepage`, so saved admin changes reflect on the customer homepage after refresh.
