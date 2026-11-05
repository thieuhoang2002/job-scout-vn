@echo off
chcp 65001 >nul
echo ========================================================
echo  🎯 Job Scout VN - Kích Hoạt Phiên Facebook
echo ========================================================
echo Đang mở trình duyệt Chrome an toàn cho Job Scout VN...
echo.
set "CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_BIN%" set "CHROME_BIN=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_BIN%" set "CHROME_BIN=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_BIN%" set "CHROME_BIN=chrome.exe"

start "" "%CHROME_BIN%" --user-data-dir="%USERPROFILE%\.job-scout-vn\browser_profile" "https://www.facebook.com"
echo 👉 Cửa sổ Chrome đã hiện lên màn hình.
echo 👉 Vui lòng đăng nhập tài khoản Facebook của bạn.
echo 👉 Sau khi đăng nhập xong, bạn có thể quay lại AI Chat để quét việc làm bình thường!
echo ========================================================
pause

