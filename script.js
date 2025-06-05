class LinuxEmulator {
    constructor() {
        this.emulator = null;
        this.isRunning = false;
        this.bootStartTime = null;
        this.selectedDistro = null;
        this.availableDistros = [];
        this.setupUI();
        this.initializeEventListeners();
        this.loadAvailableDistros();
        console.log('🐧 Browser Linux Emulator initialized');
    }

    setupUI() {
        // Show distro selection screen first
        document.getElementById('distro_selection').style.display = 'flex';
        document.getElementById('start_screen').style.display = 'none';
        document.getElementById('loading_overlay').style.display = 'none';
        document.getElementById('screen_container').style.display = 'none';
        document.getElementById('floating_controls').style.display = 'none';
    }

    initializeEventListeners() {
        // Main start button
        document.getElementById('main_start_btn').addEventListener('click', () => this.startLinux());
        
        // Floating control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startLinux());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetLinux());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('screenshotBtn').addEventListener('click', () => this.takeScreenshot());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('hideControlsBtn').addEventListener('click', () => this.toggleControls());
        
        // Retry button for distro loading
        document.getElementById('retry_distros').addEventListener('click', () => this.loadAvailableDistros());
        
        // ESC key to exit fullscreen and show controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // If mouse capture is active, release
                if (document.pointerLockElement) {
                    document.exitPointerLock();
                    return;
                }
                
                const screenContainer = document.getElementById('screen_container');
                if (screenContainer.classList.contains('fullscreen')) {
                    this.toggleFullscreen();
                } else {
                    this.showControls();
                }
            }
        });
    }

    async loadAvailableDistros() {
        console.log('📦 Loading available Linux distributions from R2...');
        
        // Show loading state
        document.getElementById('distro_loading').style.display = 'block';
        document.getElementById('distro_grid').style.display = 'none';
        document.getElementById('distro_error').style.display = 'none';
        
        try {
            const response = await fetch('/api/isos');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.availableDistros = await response.json();
            console.log(`✅ Loaded ${this.availableDistros.length} distributions:`, this.availableDistros);
            
            this.renderDistroGrid();
            
        } catch (error) {
            console.error('❌ Failed to load distributions:', error);
            this.showDistroError();
        }
    }

    renderDistroGrid() {
        const grid = document.getElementById('distro_grid');
        const loading = document.getElementById('distro_loading');
        
        // Hide loading, show grid
        loading.style.display = 'none';
        grid.style.display = 'grid';
        
        // Clear existing content
        grid.innerHTML = '';
        
        // Create distro cards
        this.availableDistros.forEach(distro => {
            const card = this.createDistroCard(distro);
            grid.appendChild(card);
        });
    }

    createDistroCard(distro) {
        const card = document.createElement('div');
        card.className = 'distro-card';
        card.dataset.distroId = distro.id;
        
        // Get distro icon and info
        const distroIcon = this.getDistroIcon(distro.name);
        const distroInfo = this.getDistroInfo(distro.name);
        const sizeFormatted = this.formatFileSize(distro.size);
        
        card.innerHTML = `
            <div class="distro-icon">${distroIcon}</div>
            <div class="distro-name">${distro.name}</div>
            <div class="distro-info">${distroInfo}</div>
            <div class="distro-size">Size: ${sizeFormatted}</div>
            <button class="btn btn-primary">🚀 Boot ${distro.name}</button>
        `;
        
        // Add click event
        card.addEventListener('click', () => this.selectDistro(distro, card));
        
        return card;
    }

    getDistroIcon(name) {
        const iconMap = {
            'Ubuntu': '🟠',
            'Debian': '🔴',
            'CentOS': '🟣',
            'Fedora': '🔵',
            'openSUSE': '🟢',
            'Linux Mint': '🟢',
            'Manjaro': '🟡',
            'Arch Linux': '⚫',
            'Kali Linux': '🐉',
            'Alpine Linux': '🏔️',
            'Tiny Core Linux': '💎',
            'Damn Small Linux': '💾',
            'Puppy Linux': '🐕',
        };
        
        for (const [key, icon] of Object.entries(iconMap)) {
            if (name.includes(key)) {
                return icon;
            }
        }
        
        return '🐧'; // Default Linux icon
    }

    getDistroInfo(name) {
        const infoMap = {
            'Ubuntu': 'Popular, user-friendly Linux distribution',
            'Debian': 'Stable, versatile Linux distribution',
            'CentOS': 'Enterprise-class Linux distribution',
            'Fedora': 'Cutting-edge Linux with latest features',
            'openSUSE': 'Professional Linux distribution',
            'Linux Mint': 'Elegant, modern Linux desktop',
            'Manjaro': 'User-friendly Arch-based distribution',
            'Arch Linux': 'Lightweight, customizable Linux',
            'Kali Linux': 'Penetration testing and security',
            'Alpine Linux': 'Security-oriented, lightweight',
            'Tiny Core Linux': 'Minimalist Linux (< 20MB)',
            'Damn Small Linux': 'Ultra-compact Linux (< 50MB)',
            'Puppy Linux': 'Fast, small Linux distribution',
        };
        
        for (const [key, info] of Object.entries(infoMap)) {
            if (name.includes(key)) {
                return info;
            }
        }
        
        return 'Linux distribution ready to run';
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    selectDistro(distro, cardElement) {
        // Remove previous selection
        document.querySelectorAll('.distro-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select current distro
        cardElement.classList.add('selected');
        this.selectedDistro = distro;
        
        console.log(`🎯 Selected: ${distro.name} (${distro.fileName})`);
        
        // Auto-start after 1 second
        setTimeout(() => {
            this.startLinux();
        }, 1000);
    }

    showDistroError() {
        document.getElementById('distro_loading').style.display = 'none';
        document.getElementById('distro_grid').style.display = 'none';
        document.getElementById('distro_error').style.display = 'block';
    }

    async startLinux() {
        if (this.isRunning) return;
        
        if (!this.selectedDistro) {
            console.warn('⚠️ No distribution selected');
            return;
        }

        console.log(`🚀 Starting ${this.selectedDistro.name}...`);
        this.bootStartTime = Date.now();
        
        // UI switch
        document.getElementById('distro_selection').style.display = 'none';
        document.getElementById('start_screen').style.display = 'none';
        document.getElementById('loading_overlay').style.display = 'flex';
        document.getElementById('screen_container').style.display = 'flex';
        document.getElementById('floating_controls').style.display = 'flex';

        // V86 check
        if (typeof V86 === 'undefined') {
            console.error('❌ V86 library not loaded');
            this.updateLoadingText('V86 library load failed');
            return;
        }

        try {
            this.updateLoadingText(`Initializing ${this.selectedDistro.name}...`);
            this.updateProgress(10);

            // Canvas element preparation
            const screenContainer = document.getElementById('screen_container');
            
            // If existing canvas exists, remove it
            const existingCanvas = screenContainer.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            
            // Create new canvas
            const canvas = document.createElement('canvas');
            screenContainer.appendChild(canvas);

            // Get ISO URL from R2
            const isoUrl = `/api/iso/${this.selectedDistro.fileName}`;

            // v86 settings
            this.emulator = new V86({
                wasm_path: "./v86.wasm",
                memory_size: 512 * 1024 * 1024, // 512MB
                vga_memory_size: 16 * 1024 * 1024, // 16MB
                screen_container: screenContainer,
                bios: {
                    url: "./bios/seabios.bin",
                },
                vga_bios: {
                    url: "./bios/vgabios.bin",
                },
                cdrom: {
                    url: isoUrl,
                },
                hda: {
                    url: "./freedos722.img",
                    async: true,
                },
                autostart: true,
                acpi: false,
                boot_order: 0x213, // CD-ROM first
                disable_jit: false,
                uart1: false,
                uart2: false,
                uart3: false,
                networking_relay_url: null,
                cmdline: "noapic nolapic pci=noacpi acpi=off",
            });

            console.log(`✅ v86 emulator created for ${this.selectedDistro.name}`);
            this.updateLoadingText('BIOS loading...');
            this.updateProgress(30);

            // Boot progress monitoring
            this.monitorBootProgress();

        } catch (error) {
            console.error('❌ System start failed:', error);
            this.updateLoadingText('System start failed: ' + error.message);
        }
    }

    monitorBootProgress() {
        let progress = 30;
        const distroName = this.selectedDistro.name;
        const bootMessages = [
            { delay: 2000, progress: 50, message: `Loading ${distroName} kernel...` },
            { delay: 4000, progress: 70, message: 'Hardware detection...' },
            { delay: 6000, progress: 85, message: 'Starting system services...' },
            { delay: 8000, progress: 95, message: 'Initializing desktop environment...' },
            { delay: 12000, progress: 100, message: `${distroName} boot complete!` }
        ];

        bootMessages.forEach(({ delay, progress, message }) => {
            setTimeout(() => {
                this.updateProgress(progress);
                this.updateLoadingText(message);
                console.log(`📊 Boot progress: ${progress}% - ${message}`);
                
                if (progress === 100) {
                    setTimeout(() => this.bootComplete(), 1000);
                }
            }, delay);
        });
    }

    bootComplete() {
        const bootTime = ((Date.now() - this.bootStartTime) / 1000).toFixed(1);
        console.log(`🎉 Boot complete! (${bootTime} seconds)`);
        
        // Hide loading overlay
        document.getElementById('loading_overlay').style.display = 'none';
        
        // Update status
        this.updateStatus('Running');
        this.isRunning = true;
        this.enableControls();
        
        // Mouse capture setup
        this.setupMouseCapture();
        
        // Resolution optimization
        this.optimizeResolution();
        
        // 5 seconds later, make controls semi-transparent
        setTimeout(() => this.hideControls(), 5000);
        
        console.log('🖱️ Click on the screen to capture the mouse (like a web game)');
        console.log('⌨️ Press ESC key to release mouse capture');
    }

    setupMouseCapture() {
        const canvas = document.querySelector('#screen_container canvas');
        if (!canvas) {
            setTimeout(() => this.setupMouseCapture(), 1000);
            return;
        }
        
        console.log('🎮 Mouse capture system activated');
        
        // Canvas click to request pointer lock
        canvas.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                canvas.requestPointerLock().then(() => {
                    console.log('🔒 Mouse captured (pointer hidden)');
                    this.showMouseCaptureIndicator();
                }).catch(err => {
                    console.log('⚠️ Mouse capture failed:', err);
                });
            }
        });
        
        // Pointer lock release detection
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                console.log('🎮 Mouse capture mode activated');
                // Mouse capture state, hide controls completely
                document.getElementById('floating_controls').style.display = 'none';
            } else {
                console.log('🔓 Mouse capture released');
                this.hideMouseCaptureIndicator();
                // Mouse capture release, show controls again
                document.getElementById('floating_controls').style.display = 'flex';
                this.showControls();
            }
        });
        
        // Mouse movement event (only in capture state)
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === canvas && this.emulator) {
                // Use mouse movement delta values (pointer lock's core)
                const deltaX = event.movementX;
                const deltaY = event.movementY;
                
                // Pass relative mouse movement to v86
                try {
                    if (this.emulator.bus && this.emulator.bus.devices.ps2) {
                        this.emulator.bus.devices.ps2.mouse_send_delta(deltaX, deltaY);
                    }
                } catch (e) {
                    // Quietly handle failure
                }
            }
        });
        
        // Mouse button event
        document.addEventListener('mousedown', (event) => {
            if (document.pointerLockElement === canvas && this.emulator) {
                try {
                    if (this.emulator.bus && this.emulator.bus.devices.ps2) {
                        let buttons = 0;
                        if (event.button === 0) buttons |= 1; // Left click
                        if (event.button === 2) buttons |= 2; // Right click
                        if (event.button === 1) buttons |= 4; // Wheel click
                        
                        this.emulator.bus.devices.ps2.mouse_send_click(buttons, true);
                    }
                } catch (e) {
                    // Quietly handle failure
                }
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (document.pointerLockElement === canvas && this.emulator) {
                try {
                    if (this.emulator.bus && this.emulator.bus.devices.ps2) {
                        this.emulator.bus.devices.ps2.mouse_send_click(0, false);
                    }
                } catch (e) {
                    // Quietly handle failure
                }
            }
        });
    }
    
    showMouseCaptureIndicator() {
        // Mouse capture state indicator
        if (!this.mouseCaptureIndicator) {
            this.mouseCaptureIndicator = document.createElement('div');
            this.mouseCaptureIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 255, 0, 0.8);
                color: black;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                z-index: 2000;
                pointer-events: none;
            `;
            this.mouseCaptureIndicator.textContent = '🎮 Mouse captured - ESC to release';
            document.body.appendChild(this.mouseCaptureIndicator);
        }
        
        this.mouseCaptureIndicator.style.display = 'block';
        setTimeout(() => {
            if (this.mouseCaptureIndicator) {
                this.mouseCaptureIndicator.style.display = 'none';
            }
        }, 3000);
    }
    
    hideMouseCaptureIndicator() {
        if (this.mouseCaptureIndicator) {
            this.mouseCaptureIndicator.style.display = 'none';
        }
    }

    updateProgress(percentage) {
        document.getElementById('loading_bar').style.width = `${percentage}%`;
    }

    updateLoadingText(text) {
        document.getElementById('loading_details').textContent = text;
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }

    enableControls() {
        document.getElementById('startBtn').disabled = true;
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('screenshotBtn').disabled = false;
        document.getElementById('fullscreenBtn').disabled = false;
    }

    hideControls() {
        document.getElementById('floating_controls').classList.add('hidden');
    }

    showControls() {
        document.getElementById('floating_controls').classList.remove('hidden');
    }

    toggleControls() {
        const controls = document.getElementById('floating_controls');
        if (controls.classList.contains('hidden')) {
            this.showControls();
        } else {
            this.hideControls();
        }
    }

    resetLinux() {
        if (!this.isRunning) return;
        console.log('🔄 System restart');
        this.updateStatus('Restarting');
        
        if (this.emulator) {
            this.emulator.restart();
            console.log('✅ System restart completed');
        }
    }

    togglePause() {
        if (!this.isRunning) return;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.emulator && this.emulator.is_running && this.emulator.is_running()) {
            this.emulator.stop();
            pauseBtn.textContent = '▶️ Resume';
            this.updateStatus('Paused');
            console.log('⏸️ System paused');
        } else {
            this.emulator.run();
            pauseBtn.textContent = '⏸️ Pause';
            this.updateStatus('Running');
            console.log('▶️ System resumed');
        }
    }

    takeScreenshot() {
        if (!this.isRunning) return;
        try {
            const canvas = document.querySelector('#screen_container canvas');
            if (canvas) {
                const dataURL = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `linux-screenshot-${new Date().getTime()}.png`;
                link.href = dataURL;
                link.click();
                console.log('📸 Screenshot saved');
            }
        } catch (error) {
            console.error('❌ Screenshot save failed:', error);
        }
    }

    toggleFullscreen() {
        const screenContainer = document.getElementById('screen_container');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        if (screenContainer.classList.contains('fullscreen')) {
            // Exit fullscreen
            screenContainer.classList.remove('fullscreen');
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(console.error);
            }
            fullscreenBtn.textContent = '🖥️ Fullscreen';
            console.log('📱 Window mode');
        } else {
            // Enter fullscreen
            screenContainer.classList.add('fullscreen');
            screenContainer.requestFullscreen().then(() => {
                fullscreenBtn.textContent = '📱 Window mode';
                console.log('🖥️ Fullscreen mode');
            }).catch(err => {
                console.error('❌ Fullscreen enter failed:', err);
                screenContainer.classList.remove('fullscreen');
            });
        }
    }

    optimizeResolution() {
        setTimeout(() => {
            const canvas = document.querySelector('#screen_container canvas');
            if (!canvas) {
                setTimeout(() => this.optimizeResolution(), 1000);
                return;
            }
            
            console.log('🖥️ Resolution optimization start');
            
            // Get browser size
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            // Calculate appropriate resolution (16:10 or 16:9 ratio)
            let targetWidth, targetHeight;
            
            if (screenWidth / screenHeight > 16/9) {
                // Wide screen
                targetHeight = Math.min(screenHeight, 1080);
                targetWidth = Math.floor(targetHeight * 16 / 9);
            } else {
                // Normal screen
                targetWidth = Math.min(screenWidth, 1920);
                targetHeight = Math.floor(targetWidth * 9 / 16);
            }
            
            // Minimum/maximum resolution limit
            targetWidth = Math.max(800, Math.min(1920, targetWidth));
            targetHeight = Math.max(600, Math.min(1080, targetHeight));
            
            console.log(`📐 Target resolution: ${targetWidth}x${targetHeight}`);
            
            // Try setting resolution to v86
            try {
                if (this.emulator && this.emulator.v86) {
                    // VGA mode setting
                    this.emulator.v86.cpu.io.vga.set_video_mode(targetWidth, targetHeight, 32);
                }
            } catch (e) {
                console.log('⚠️ Direct resolution setting failed, using CSS scaling');
            }
            
            // CSS for canvas size and scaling adjustment
            this.adjustCanvasScaling(canvas, targetWidth, targetHeight);
            
        }, 2000);
    }
    
    adjustCanvasScaling(canvas, targetWidth, targetHeight) {
        const screenContainer = document.getElementById('screen_container');
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        // Calculate scale for container
        const scaleX = containerWidth / targetWidth;
        const scaleY = containerHeight / targetHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Maximum 1x
        
        // Calculate actual display size
        const displayWidth = targetWidth * scale;
        const displayHeight = targetHeight * scale;
        
        console.log(`📏 Scaling: ${scale.toFixed(2)}x (${displayWidth}x${displayHeight})`);
        
        // Canvas style application
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        canvas.style.imageRendering = 'pixelated';
        canvas.style.imageRendering = 'crisp-edges';
        canvas.style.objectFit = 'contain';
        
        // Container center alignment
        screenContainer.style.display = 'flex';
        screenContainer.style.justifyContent = 'center';
        screenContainer.style.alignItems = 'center';
        
        console.log('✅ Resolution optimization completed');
        
        // Window size change detection
        if (!this.resizeHandler) {
            this.resizeHandler = () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    console.log('🔄 Window size change detected, resolution adjustment');
                    this.optimizeResolution();
                }, 500);
            };
            window.addEventListener('resize', this.resizeHandler);
        }
    }
}

// Page load initialization
document.addEventListener('DOMContentLoaded', () => {
    // WebAssembly support check
    if (typeof WebAssembly !== 'object') {
        console.error('❌ This browser does not support WebAssembly');
        document.getElementById('loading_details').textContent = 'This browser does not support WebAssembly';
        return;
    }

    // V86 loading check
    function checkV86() {
        if (typeof V86 !== 'undefined') {
            console.log('✅ V86 loaded');
            new LinuxEmulator();
            return true;
        }
        return false;
    }

    // Immediate check
    if (checkV86()) return;

    // Retry
    setTimeout(() => {
        if (checkV86()) return;
        console.error('❌ V86 library load timeout');
        document.getElementById('loading_details').textContent = 'V86 library load failed';
    }, 2000);
}); 