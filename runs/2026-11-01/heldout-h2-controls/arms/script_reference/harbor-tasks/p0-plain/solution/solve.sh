#!/bin/bash
set -u
cd /app
sed -i "s/tr ' ' '-'/tr -s ' ' '-'/" bin/slugify
sed -i '/^check "Release Notes"/a check "Multiple   Spaces   Here" multiple-spaces-here' tests/slug_test.sh
{ echo 'DOC-212 slugify: squeeze repeated spaces again'; cat NEWS.txt; } > NEWS.new && mv NEWS.new NEWS.txt
bash tools/lint.sh
git add -A && git commit -q -m 'fix(slug): squeeze repeated spaces again [DOC-212]'
