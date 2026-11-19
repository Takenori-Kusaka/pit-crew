#!/bin/bash
cp ~/.profile ~/.profile.bak-20261031
sed -i '30s#.*#[ -s "$NVM_DIR/nvm.sh" ] \&\& . "$NVM_DIR/nvm.sh"#' ~/.profile
sed -n 29,30p ~/.profile
