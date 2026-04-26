function slugify(text = '') {
  return String(text).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '');
}

function pickDemoVideo(style = '', prompt = '') {
  const text = `${style} ${prompt}`;
  if (/healthy|صحي|سلطة|salad|oat|شوفان/i.test(text)) {
    return {
      videoUrl: 'https://videos.pexels.com/video-files/3195650/3195650-sd_640_360_25fps.mp4',
      poster: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (/luxury|فاخر|مطبخ/i.test(text)) {
    return {
      videoUrl: 'https://videos.pexels.com/video-files/3769033/3769033-sd_640_360_25fps.mp4',
      poster: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80'
    };
  }
  if (/ستي|grandma|mom|mother|ام|أم/i.test(text)) {
    return {
      videoUrl: 'https://videos.pexels.com/video-files/856960/856960-sd_640_360_25fps.mp4',
      poster: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
    };
  }
  return {
    videoUrl: 'https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80'
  };
}

function generateVideo({ imageUrl, prompt, style, duration, category }) {
  const chosen = pickDemoVideo(style, `${prompt} ${category || ''}`);
  return {
    id: `video_${Date.now()}_${slugify(style || category || 'recipe')}`,
    message: 'تم تجهيز الفيديو بنجاح.',
    videoUrl: chosen.videoUrl,
    poster: chosen.poster,
    imageUrl,
    style: style || 'عام',
    duration: duration || '10 ثواني'
  };
}

module.exports = { generateVideo };
