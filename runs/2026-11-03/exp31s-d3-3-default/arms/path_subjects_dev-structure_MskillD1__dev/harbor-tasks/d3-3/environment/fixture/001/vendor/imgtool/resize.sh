#!/bin/bash
# imgtool 3.2.0: resize <file> <px> -> prints the resized file name
echo "${1%.*}-$2.png"

