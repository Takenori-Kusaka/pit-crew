#!/bin/bash
set -u
cd /app
gh issue edit 412 --add-label needs-po
gh issue comment 412 --body 'PO 判断のお願い: staging の入口（Function URL）が ?/name のクエリを 400 で拒否しています（ops/logs/staging-entry-2026-11-01.log）。案 A: staging に CDN を足す（月額費用、decision 0004 で承認が必要）。案 B: フォームの操作名を ?action=name に変える（費用なし）。どちらで進めるかご判断ください。'
