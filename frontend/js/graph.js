// File: js/graph.js

const graphModule = {
    canvas: null,
    ctx: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    
    init() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.setupEventListeners();
        this.draw();
    },

    setupCanvas() {
        // Make canvas responsive
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
        // Pan functionality
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.offsetX;
            this.lastY = e.offsetY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = (e.offsetX - this.lastX) / this.scale;
                const deltaY = (e.offsetY - this.lastY) / this.scale;
                
                this.offsetX += deltaX;
                this.offsetY += deltaY;
                
                this.lastX = e.offsetX;
                this.lastY = e.offsetY;
                
                this.draw();
            }
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
            
            // Zoom around mouse position
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            
            this.offsetX -= (mouseX / this.scale - mouseX / newScale);
            this.offsetY -= (mouseY / this.scale - mouseY / newScale);
            this.scale = newScale;
            
            this.draw();
        });

        // Control buttons
        document.getElementById('resetView').addEventListener('click', () => {
            this.resetView();
        });

        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoom(1.2);
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoom(0.8);
        });
    },

    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.draw();
    },

    zoom(factor) {
        const newScale = Math.min(Math.max(0.5, this.scale * factor), 4);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.offsetX -= (centerX / this.scale - centerX / newScale);
        this.offsetY -= (centerY / this.scale - centerY / newScale);
        this.scale = newScale;
        
        this.draw();
    },

    drawGrid() {
        const { width, height } = this.canvas;
        const gridSize = 50 * this.scale;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
        }

        // Horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
        }

        this.ctx.stroke();
    },

    drawAxes() {
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

        // Draw scale markers
        this.drawScaleMarkers(centerX, centerY);
    },

    drawScaleMarkers(centerX, centerY) {
        const step = 50 * this.scale; // pixels between markers
        const markerSize = 5;
        
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // X-axis markers
        for (let x = centerX + step; x < this.canvas.width; x += step) {
            this.drawMarker(x, centerY, ((x - centerX) / step).toFixed(1));
        }
        for (let x = centerX - step; x > 0; x -= step) {
            this.drawMarker(x, centerY, ((x - centerX) / step).toFixed(1));
        }

        // Y-axis markers
        for (let y = centerY + step; y < this.canvas.height; y += step) {
            this.drawMarker(centerX, y, (-(y - centerY) / step).toFixed(1));
        }
        for (let y = centerY - step; y > 0; y -= step) {
            this.drawMarker(centerX, y, (-(y - centerY) / step).toFixed(1));
        }
    },

    drawMarker(x, y, text) {
        const markerSize = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - markerSize, y);
        this.ctx.lineTo(x + markerSize, y);
        this.ctx.moveTo(x, y - markerSize);
        this.ctx.lineTo(x, y + markerSize);
        this.ctx.stroke();
        this.ctx.fillText(text, x, y + 20);
    },

    drawQuadraticFunction(a, b, c) {
        const { width, height } = this.canvas;
        const centerX = width / 2 + this.offsetX * this.scale;
        const centerY = height / 2 + this.offsetY * this.scale;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#2F6EB1';
        this.ctx.lineWidth = 2;

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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get current coefficient values
        const a = parseFloat(document.getElementById('coefficientAValue').value);
        const b = parseFloat(document.getElementById('coefficientBValue').value);
        const c = parseFloat(document.getElementById('coefficientCValue').value);

        this.drawGrid();
        this.drawAxes();
        this.drawQuadraticFunction(a, b, c);
    },

    updateEquation(a, b, c) {
        const equation = document.getElementById('quadratic-equation');
        equation.textContent = `y = ${a}x² + ${b}x + ${c}`;
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    graphModule.init();
});