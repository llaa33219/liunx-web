export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API 경로 처리
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }
    
    // 정적 파일 서빙 (Pages와 통합)
    return env.ASSETS.fetch(request);
  },
};

async function handleApiRequest(request, env, url) {
  const pathname = url.pathname;
  
  // ISO 목록 가져오기
  if (pathname === '/api/isos') {
    try {
      const objects = await env.LINUX_ISO.list({
        // 루트 디렉토리에서 가져오기 (prefix 제거)
      });
      
      // .iso 파일만 필터링
      const isoFiles = objects.objects.filter(obj => obj.key.toLowerCase().endsWith('.iso'));
      
      const isos = isoFiles.map(obj => {
        const fileName = obj.key;
        const name = fileName.replace('.iso', '');
        return {
          id: fileName.replace(/[^a-zA-Z0-9]/g, '_'),
          name: formatDistroName(name),
          fileName: fileName,
          size: obj.size,
          modified: obj.uploaded,
        };
      });
      
      return new Response(JSON.stringify(isos), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch ISO list' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
  
  // 특정 ISO 파일 스트리밍
  if (pathname.startsWith('/api/iso/')) {
    const isoName = pathname.replace('/api/iso/', '');
    
    try {
      const object = await env.LINUX_ISO.get(isoName);
      
      if (!object) {
        return new Response('ISO not found', { status: 404 });
      }
      
      // Range 요청 지원 (v86에서 필요할 수 있음)
      const range = request.headers.get('Range');
      if (range) {
        const [start, end] = parseRange(range, object.size);
        const slice = object.slice(start, end + 1);
        
        return new Response(slice, {
          status: 206,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${start}-${end}/${object.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': (end - start + 1).toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Range',
          },
        });
      }
      
      // 전체 파일 응답
      return new Response(object.body, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': object.size.toString(),
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response('Failed to fetch ISO', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}

function parseRange(rangeHeader, fileSize) {
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  return [start, end];
}

function formatDistroName(fileName) {
  // 파일명을 사용자 친화적인 배포판 이름으로 변환
  const distroMap = {
    'ubuntu': 'Ubuntu',
    'debian': 'Debian',
    'centos': 'CentOS',
    'fedora': 'Fedora',
    'opensuse': 'openSUSE',
    'mint': 'Linux Mint',
    'manjaro': 'Manjaro',
    'arch': 'Arch Linux',
    'kali': 'Kali Linux',
    'alpine': 'Alpine Linux',
    'tinycore': 'Tiny Core Linux',
    'dsl': 'Damn Small Linux',
    'puppy': 'Puppy Linux',
  };
  
  const lowerName = fileName.toLowerCase();
  
  for (const [key, value] of Object.entries(distroMap)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  
  // 파일명을 Title Case로 변환
  return fileName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
} 