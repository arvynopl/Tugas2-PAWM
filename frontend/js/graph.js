// File frontend/js/graph.js

window.graphModule = {
    canvas: null,
    ctx: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    coefficients: {
        a: 1,
        b: 0,
        c: 0
    },
     
    init() {
        console.log('Initializing graph module...');
        this.canvas = document.getElementById('graphCanvas');
        
        if (!this.canvas) {
            console.error('Canvas element not found! Creating canvas...');
            // Create canvas if it doesn't exist
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'graphCanvas';
            const container = document.querySelector('.canvas-container');
            if (container) {
                container.appendChild(this.canvas);
            } else {
                console.error('Canvas container not found!');
                return;
            }
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.setupEventListeners();
        this.draw();
        console.log('Graph module initialized successfully');
    },

    getState() {
        try {
            return {
                scale: this.scale || 1,
                offsetX: this.offsetX || 0,
                offsetY: this.offsetY || 0
            };
        } catch (error) {
            console.error('Error getting graph state:', error);
            return {
                scale: 1,
                offsetX: 0,
                offsetY: 0
            };
        }
    },

    setupCanvas() {
        const resize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.draw();
        };

        window.addEventListener('resize', resize);
        resize();
    },

    setupEventListeners() {
        if (!this.canvas) return;

        // Pan functionality
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.offsetX;
            this.lastY = e.offsetY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = (e.offsetX - this.lastX) / this.scale;
            const deltaY = (e.offsetY - this.lastY) / this.scale;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastX = e.offsetX;
            this.lastY = e.offsetY;
            
            this.draw();
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // Zoom functionality
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.5, this.scale + delta), 4);
            
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            
            this.offsetX -= (mouseX / this.scale - mouseX / newScale);
            this.offsetY -= (mouseY / this.scale - mouseY / newScale);
            this.scale = newScale;
            
            this.draw();
        });

        // Add event listeners for coefficient inputs
        ['a', 'b', 'c'].forEach(coeff => {
            const slider = document.getElementById(`coefficient${coeff.toUpperCase()}`);
            const input = document.getElementById(`coefficient${coeff.toUpperCase()}Value`);
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    console.log(`Slider ${coeff} changed:`, e.target.value);
                    this.coefficients[coeff] = parseFloat(e.target.value);
                    if (input) input.value = e.target.value;
                    this.updateEquation();
                    this.draw();
                });
            }
            
            if (input) {
                input.addEventListener('change', (e) => {
                    console.log(`Input ${coeff} changed:`, e.target.value);
                    const value = Math.min(Math.max(parseFloat(e.target.value) || 0, -5), 5);
                    this.coefficients[coeff] = value;
                    if (slider) slider.value = value;
                    this.updateEquation();
                    this.draw();
                });
            }
        });

        const resetViewButton = document.getElementById('resetView');
        if (resetViewButton) {
            resetViewButton.addEventListener('click', () => {
                this.resetView();
            });
        } else {
            console.error('Reset view button not found');
        }
    },

    updateEquation() {
        const equation = document.getElementById('quadratic-equation');
        if (equation) {
            equation.textContent = `y = ${this.coefficients.a}x² + ${this.coefficients.b}x + ${this.coefficients.c}`;
        }
    },

    drawGrid() {
        if (!this.ctx) return;

        const { width, height } = this.canvas;
        const gridSize = 50 * this.scale;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
        }

        // Draw horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
        }

        this.ctx.stroke();
    },

    drawAxes() {
        if (!this.ctx) return;

        const { width, height } = this.canvas;
        const centerX = width / 2 + this.offsetX * this.scale;
        const centerY = height / 2 + this.offsetY * this.scale;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;

        // X-axis
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(width, centerY);

        // Y-axis
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, height);
        
        this.ctx.stroke();

        this.drawScaleMarkers(centerX, centerY);
    },

    drawScaleMarkers(centerX, centerY) {
        if (!this.ctx) return;

        const step = 50 * this.scale;
        const markerSize = 5;
        
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // X-axis markers
        for (let x = centerX + step; x < this.canvas.width; x += step) {
            this.drawMarker(x, centerY, ((x - centerX) / (50 * this.scale)).toFixed(1));
        }
        for (let x = centerX - step; x > 0; x -= step) {
            this.drawMarker(x, centerY, ((x - centerX) / (50 * this.scale)).toFixed(1));
        }

        // Y-axis markers
        for (let y = centerY + step; y < this.canvas.height; y += step) {
            this.drawMarker(centerX, y, (-(y - centerY) / (50 * this.scale)).toFixed(1));
        }
        for (let y = centerY - step; y > 0; y -= step) {
            this.drawMarker(centerX, y, (-(y - centerY) / (50 * this.scale)).toFixed(1));
        }
    },

    drawMarker(x, y, text) {
        if (!this.ctx) return;

        const markerSize = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - markerSize, y);
        this.ctx.lineTo(x + markerSize, y);
        this.ctx.moveTo(x, y - markerSize);
        this.ctx.lineTo(x, y + markerSize);
        this.ctx.stroke();
        this.ctx.fillText(text, x, y + 20);
    },

    drawQuadraticFunction() {
        if (!this.ctx) return;

        const { width, height } = this.canvas;
        const centerX = width / 2 + this.offsetX * this.scale;
        const centerY = height / 2 + this.offsetY * this.scale;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#2F6EB1';
        this.ctx.lineWidth = 2;

        const { a, b, c } = this.coefficients;

        for (let px = 0; px < width; px++) {
            const x = (px - centerX) / (50 * this.scale);
            const y = a * x * x + b * x + c;
            const py = centerY - y * 50 * this.scale;
            
            if (px === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }

        this.ctx.stroke();
    },

    draw() {
        if (!this.ctx || !this.canvas) return;

        console.log('Drawing graph with coefficients:', this.coefficients);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawAxes();
        this.drawQuadraticFunction();
    },

    setCoefficients(a, b, c) {
        this.coefficients = { a, b, c };
        this.updateEquation();
        this.draw();
    },

    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.draw();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing graph module...');
    graphModule.init();
});