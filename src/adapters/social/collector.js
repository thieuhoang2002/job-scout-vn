/**
 * Job Scout VN - In-Browser 1-Click Threads Post Collector (With Human Jitter)
 * 
 * Tính năng chống phát hiện bot:
 * 1. Cuộn trang từng nấc ngẫu nhiên trên Threads (Smooth Scroll 400px - 750px).
 * 2. Tự động nghỉ ngẫu nhiên (Human Jitter 1.2s - 2.5s) mô phỏng mắt người đang đọc bài.
 * 3. Chống trùng lặp bài viết (Deduplication) và tự động dừng sau 5-6 nhịp.
 * 4. Tải file threads_posts.json về máy.
 * 
 * Hướng dẫn sử dụng:
 * 1. Mở tab Threads tìm kiếm việc làm (threads.net) trên Chrome.
 * 2. Bấm F12 (hoặc Ctrl+Shift+I) -> chọn tab "Console".
 * 3. Dán toàn bộ mã dưới đây và bấm Enter.
 */

(async function runThreadsCollector() {
  if (!window.location.hostname.includes('threads.net')) {
    alert('⚠️ Vui lòng chạy công cụ này trên trang threads.net');
    return;
  }

  console.log('🚀 [Job Scout VN] Bắt đầu quét thông minh trên Threads...');
  console.log('🤖 Đang kích hoạt chế độ "Mô phỏng người lướt" (Human Jitter & Smooth Scroll)...');

  function humanSleep(min = 1200, max = 2500) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(r => setTimeout(r, delay));
  }

  const postMap = new Map();
  const maxScrollSteps = 6;
  const targetMinPosts = 25;

  for (let step = 1; step <= maxScrollSteps; step++) {
    console.log(`[Nhịp ${step}/${maxScrollSteps}] Đang thu thập bài đăng Threads và cuộn trang...`);

    const threadElements = document.querySelectorAll('div[data-pressable-container="true"], article');

    threadElements.forEach((el, idx) => {
      const text = el.innerText || '';
      if (text.length < 40) return;

      const links = Array.from(el.querySelectorAll('a[href*="/post/"]'));
      const postUrl = links.length > 0 ? links[0].href.split('?')[0] : (window.location.href + '#thread_' + idx);

      const authorEl = el.querySelector('span[dir="auto"], h2');
      const author = authorEl ? authorEl.innerText.trim() : 'Threads User';

      if (!postMap.has(postUrl)) {
        postMap.set(postUrl, {
          id: `threads_dom_${Date.now()}_${idx}`,
          author: author,
          text: text,
          url: postUrl,
          time: 'Vừa quét từ trình duyệt (< 24h)',
          created_at: new Date().toISOString()
        });
      }
    });

    if (postMap.size >= targetMinPosts) {
      console.log(`🎯 Đã thu thập đủ ${postMap.size} bài đăng mục tiêu. Dừng cuộn trang.`);
      break;
    }

    // Human-like smooth scroll
    const scrollAmount = Math.floor(Math.random() * (750 - 450 + 1)) + 450;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });

    // Randomized human jitter pause
    await humanSleep(1200, 2400);
  }

  const collected = Array.from(postMap.values());
  console.log(`✅ Đã bóc tách thành công ${collected.length} bài đăng Threads duy nhất.`);

  if (collected.length === 0) {
    alert('Không tìm thấy bài đăng nào trên màn hình. Hãy thử cuộn trang và chạy lại nhé!');
    return;
  }

  // Auto download JSON file
  const filename = 'threads_posts.json';
  const blob = new Blob([JSON.stringify(collected, null, 2)], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  console.log(`🎉 HOÀN TẤT! File ${filename} đã được tải về máy an toàn.`);
  console.log(`👉 Bạn chỉ cần copy file ${filename} này vào thư mục data/social/ trong dự án job-scout-vn để phân tích.`);
})();
