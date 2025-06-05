# Browser Linux Emulator

웹 브라우저에서 실행되는 Linux 에뮬레이터입니다. v86을 기반으로 하며, Cloudflare Pages와 R2 버킷을 활용하여 다양한 Linux 배포판을 선택하고 실행할 수 있습니다.

## 🚀 기능

- **다양한 Linux 배포판 지원**: R2 버킷에서 동적으로 ISO 파일을 불러와 선택 가능
- **브라우저 내 완전한 Linux 환경**: GUI 데스크톱 환경 지원
- **실시간 부팅 진행률**: 아름다운 UI로 부팅 과정 시각화
- **마우스 캡처**: 게임처럼 마우스를 캡처하여 자연스러운 조작
- **스크린샷 기능**: 현재 화면을 이미지로 저장
- **전체화면 모드**: 몰입감 있는 Linux 경험

## 📋 지원 배포판

R2 버킷의 루트 디렉토리에 ISO 파일을 업로드하면 자동으로 인식됩니다:

- Ubuntu
- Debian  
- CentOS
- Fedora
- openSUSE
- Linux Mint
- Manjaro
- Arch Linux
- Kali Linux
- Alpine Linux
- Tiny Core Linux
- Damn Small Linux
- Puppy Linux

## 🛠️ Cloudflare Pages 배포

### 1. R2 버킷 설정

1. Cloudflare 대시보드에서 R2 버킷을 생성합니다.
2. 버킷 이름: `linux-iso`
3. 버킷의 루트 디렉토리에 Linux ISO 파일들을 직접 업로드합니다.

### 2. Cloudflare Pages 설정

1. GitHub/GitLab 저장소를 Cloudflare Pages에 연결합니다.
2. 빌드 설정:
   - **Build command**: 비워둠 (정적 파일)
   - **Build output directory**: `/` (루트)
   - **Root directory**: `/` (루트)

### 3. Environment Variables 설정

Pages 설정에서 다음 환경 변수를 추가하지 않습니다 (Worker에서 바인딩 사용).

### 4. R2 버킷 바인딩

Pages Functions 설정에서 R2 바인딩을 추가합니다:

1. Cloudflare Pages 대시보드 → 해당 사이트 → Settings → Functions
2. **R2 bucket bindings** 섹션에서 바인딩 추가:
   - **Variable name**: `LINUX_ISO`
   - **R2 bucket**: `linux-iso` (생성한 버킷 이름 선택)

### 5. 배포 확인

배포 후 다음 엔드포인트들이 작동하는지 확인:

- `/api/isos` - 사용 가능한 ISO 목록
- `/api/iso/[filename]` - 특정 ISO 파일 스트리밍

## 🖥️ 로컬 개발

로컬에서 테스트하려면:

```bash
# Python 간단 서버 (기본 기능만)
python3 -m http.server 8000

# 또는 Node.js 서버
npx serve .
```

**주의**: 로컬 개발에서는 R2 기능이 작동하지 않으므로, 배포된 환경에서만 전체 기능을 테스트할 수 있습니다.

## 📁 파일 구조

```
├── index.html          # 메인 HTML 페이지
├── script.js           # JavaScript 로직
├── style.css           # 스타일시트
├── _worker.js          # Cloudflare Workers (R2 API)
├── libv86.js           # v86 에뮬레이터 라이브러리
├── v86.wasm           # v86 WebAssembly
├── bios/              # BIOS 파일들
├── freedos722.img     # FreeDOS 이미지 (하드디스크)
└── buildroot-bzimage.bin # Buildroot 커널 (선택사항)
```

## 📁 R2 버킷 구조

`linux-iso` 버킷의 루트 디렉토리에 ISO 파일들을 직접 저장:

```
linux-iso/
├── ubuntu-22.04-desktop-amd64.iso
├── debian-12.0.0-amd64-netinst.iso
├── fedora-38-x86_64-netinst.iso
└── ... (기타 ISO 파일들)
```

## 🔧 커스터마이징

### 새로운 Linux 배포판 추가

1. ISO 파일을 R2 버킷의 루트 디렉토리에 업로드
2. `script.js`의 `getDistroIcon()`과 `getDistroInfo()` 함수에 새 배포판 정보 추가

### 메모리 및 성능 조정

`script.js`의 v86 설정에서 다음을 조정할 수 있습니다:

- `memory_size`: 에뮬레이터 메모리 (기본: 512MB)
- `vga_memory_size`: 비디오 메모리 (기본: 16MB)

## ⚠️ 참고 사항

- 큰 ISO 파일(>1GB)은 로딩에 시간이 걸릴 수 있습니다
- 모바일 브라우저에서는 성능이 제한적일 수 있습니다
- 일부 최신 Linux 배포판은 v86의 하드웨어 제약으로 인해 완전히 호환되지 않을 수 있습니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 크레딧

- [v86](https://github.com/copy/v86) - JavaScript x86 에뮬레이터
- [Cloudflare Pages](https://pages.cloudflare.com/) - 정적 사이트 호스팅
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - 오브젝트 스토리지 