@echo off
title Rahul Scripts - SocialFlow AI Desktop Studio
echo Starting SocialFlow AI Desktop Studio...
cd /d " %~dp0frontend\
start \\ npx electron electron/main.cjs
exit
