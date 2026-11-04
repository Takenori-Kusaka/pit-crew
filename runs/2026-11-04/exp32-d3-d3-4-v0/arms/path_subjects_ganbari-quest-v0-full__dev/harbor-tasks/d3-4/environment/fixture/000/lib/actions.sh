#!/bin/bash
# Form actions: a form posts to its own page with the action named in the query (?/name).
action_url() { echo "?/$1"; }
# Prints the action named by a query string, or nothing.
action_from_query() { case "$1" in /*) echo "${1#/}" ;; esac; }

