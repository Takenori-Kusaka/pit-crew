#!/bin/bash
grep -n "nvm" ~/.profile ~/.bashrc ~/.bash_profile 2>/dev/null
ls ~/.bash_profile ~/.bash_login 2>/dev/null
which -a node
