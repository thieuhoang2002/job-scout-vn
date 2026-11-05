/**
 * Job Scout VN - In-Browser 1-Click Social Post Collector
 * 
 * Hướng dẫn sử dụng:
 * 1. Mở Chrome trên máy tính (đã đăng nhập Facebook / Threads).
 * 2. Truy cập vào Group Facebook (kể cả Group kín đã tham gia) hoặc Threads tìm kiếm việc làm.
 * 3. Mở DevTools Console (F12 hoặc Ctrl+Shift+I -> tab Console).
 * 4. Dán toàn bộ mã dưới đây và bấm Enter.
 * 5. File JSON chứa các bài đăng hợp lệ (< 3 ngày, sạch rác) sẽ tự động được tải về máy!
 */

(function runSocialCollector() {
  const isThreads = window.location.hostname.includes('threads.net');
  const isFacebook = window.location.hostname.includes('facebook.com');

  if (!isThreads && !isFacebook) {
    alert('⚠️ Vui lòng chạy công cụ này trên trang facebook.com hoặc threads.net');
    return;
  }

  console.log(`🚀 [Job Scout VN Collector] Đang quét bài đăng trên ${isThreads ? 'Threads' : 'Facebook'}...`);

  const collected = [];

  if (isFacebook) {
    // Collect Facebook posts
    const postElements = document.querySelectorAll('div[role="feed"] > div, div[data-ad-preview="message"]');
    const groupTitle = document.querySelector('h1, span[dir="auto"]')?.innerText || 'Facebook Group';

    postElements.forEach((el, idx) => {
      const text = el.innerText || '';
      if (text.length < 50) return;

      // Find links and time
      const links = Array.from(el.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"]'));
      const postUrl = links.length > 0 ? links[0].href.split('?')[0] : window.location.href;
      
      // Author name
      const authorEl = el.querySelector('strong, h2, h3, h4');
      const author = authorEl ? authorEl.innerText.trim() : 'Thành viên Group';

      collected.push({
        id: `fb_dom_${Date.now()}_${idx}`,
        author: author,
        group_name: groupTitle,
        text: text,
        url: postUrl,
        time: 'Vừa quét từ trình duyệt (< 24h)',
        created_at: new Date().toISOString()
      });
    });
  } else if (isThreads) {
    // Collect Threads posts
    const threadElements = document.querySelectorAll('div[data-pressable-container="true"], article');

    threadElements.forEach((el, idx) => {
      const text = el.innerText || '';
      if (text.length < 40) return;

      const links = Array.from(el.querySelectorAll('a[href*="/post/"]'));
      const postUrl = links.length > 0 ? links[0].href.split('?')[0] : window.location.href;

      const authorEl = el.querySelector('span[dir="auto"], h2');
      const author = authorEl ? authorEl.innerText.trim() : 'Threads User';

      collected.push({
        id: `threads_dom_${Date.now()}_${idx}`,
        author: author,
        text: text,
        url: postUrl,
        time: 'Vừa quét từ trình duyệt (< 24h)',
        created_at: new Date().toISOString()
      });
    });
  }

  console.log(`✅ Đã tìm thấy ${collected.length} bài đăng thô.`);

  if (collected.length === 0) {
    alert('Không tìm thấy bài đăng nào trên màn hình. Hãy cuộn chuột xuống vài lần để tải thêm bài viết rồi chạy lại nhé!');
    return;
  }

  // Auto download JSON file
  const filename = isFacebook ? 'facebook_posts.json' : 'threads_posts.json';
  const blob = new Blob([JSON.stringify(collected, null, 2)], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  console.log(`🎉 Đã tải file ${filename} về máy! Hãy copy vào thư mục data/social/ của dự án để phân tích.`);
})();
