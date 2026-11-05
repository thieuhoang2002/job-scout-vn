const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

class BrowserLauncher {
  static hasFacebookSession(userDataDir) {
    const cookiesPath = path.join(userDataDir, 'Default', 'Network', 'Cookies');
    const walPath = path.join(userDataDir, 'Default', 'Network', 'Cookies-wal');

    try {
      if (fs.existsSync(cookiesPath)) {
        const buf = fs.readFileSync(cookiesPath);
        if (buf.includes('c_user')) return true;
      }
      if (fs.existsSync(walPath)) {
        const walBuf = fs.readFileSync(walPath);
        if (walBuf.includes('c_user')) return true;
      }
    } catch {
      // EBUSY if currently writing, ignore
    }
    return false;
  }

  static async openInteractiveLogin(userDataDir, onProgress) {
    if (onProgress) {
      onProgress('⚠️ [Facebook] Chưa phát hiện phiên đăng nhập.');
      onProgress('🚀 Đang tự động mở cửa sổ Chrome lên màn hình để bạn đăng nhập Facebook...');
    }

    const chromeCmd = `start "" "chrome.exe" --user-data-dir="${userDataDir}" --new-window "https://www.facebook.com"`;
    exec(chromeCmd, (err) => {
      if (err && onProgress) {
        onProgress(`⚠️ Lỗi khởi chạy Chrome: ${err.message}`);
      }
    });

    // Buộc kích hoạt cửa sổ Chrome nổi lên trên màn hình (Foreground)
    setTimeout(() => {
      exec('powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate(\'Chrome\'); $wshell.AppActivate(\'Facebook\')"');
    }, 1500);

    if (onProgress) {
      onProgress('👉 Cửa sổ Chrome đã bật lên. Bạn hãy đăng nhập tài khoản Facebook trên cửa sổ đó nhé!');
      onProgress('⏳ Hệ thống đang đợi bạn hoàn tất đăng nhập...');
    }

    const startTime = Date.now();
    const maxWaitMs = 180000; // 3 phút

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(r => setTimeout(r, 1500));
      if (BrowserLauncher.hasFacebookSession(userDataDir)) {
        if (onProgress) {
          onProgress('🎉 [Facebook] ĐÃ PHÁT HIỆN ĐĂNG NHẬP THÀNH CÔNG!');
          onProgress('👉 Đang đóng cửa sổ đăng nhập và bắt đầu cào bài viết tự động...');
        }
        await new Promise(r => setTimeout(r, 2000));
        
        // Đóng Chrome tương tác để giải phóng profile cho Puppeteer cào ngầm
        try {
          exec('powershell -Command "Get-CimInstance Win32_Process -Filter \\"name = \'chrome.exe\'\\" | Where-Object { $_.CommandLine -like \'*browser_profile*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"');
        } catch {
          // Ignored
        }
        await new Promise(r => setTimeout(r, 1500));
        return true;
      }
    }

    throw new Error('Hết thời gian chờ đăng nhập (3 phút). Vui lòng chạy lại khi sẵn sàng đăng nhập.');
  }
}

module.exports = BrowserLauncher;
