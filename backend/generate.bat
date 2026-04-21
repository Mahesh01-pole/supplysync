@echo off
set TEMP=D:\Temp
set TMP=D:\Temp
set NODE_OPTIONS=--max-old-space-size=512
npx prisma generate
