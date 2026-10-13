cd backend
dir /s /B *.java > raw_sources.txt
powershell -Command "(Get-Content raw_sources.txt) | ForEach-Object { \"\"\"$_\"\"\" } | Out-File -Encoding ASCII sources.txt"
javac -d bin @sources.txt
