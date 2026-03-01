class TechnologyManager {
    constructor(rustGame, i18n) {
        this.rustGame = rustGame;
        this.i18n = i18n;
        this.treeContainer = document.getElementById('technology-tree-container');
        this.detailPanel = document.getElementById('technology-detail');
        this.researchBtn = document.getElementById('research-button');
        this.selectedTechnology = null;
        this.technologies = [];
        
        // Canvas visualization state
        this.canvas = null;
        this.ctx = null;
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.draggedNode = null;
        
        // Zoom/pan state
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Force simulation state
        this.simulationRunning = false;
        this.animationFrame = null;
    }

    initialize() {
        if (!this.rustGame || typeof this.rustGame.get_technologies !== 'function') {
            console.warn('TechnologyManager: rustGame or get_technologies not available');
            this.technologies = [];
            return;
        }

        try {
            const techData = this.rustGame.get_technologies();
            this.technologies = Array.isArray(techData) ? techData : [];
            this.renderTree();
            this.bindEvents();
        } catch (error) {
            console.error('TechnologyManager: Error loading technologies:', error);
            this.technologies = [];
        }
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_technologies !== 'function') {
            this.technologies = [];
            return;
        }

        try {
            const techData = this.rustGame.get_technologies();
            this.technologies = Array.isArray(techData) ? techData : [];
            
            const technologyTab = document.getElementById('tab-technology');
            if (technologyTab && technologyTab.classList.contains('active')) {
                this.renderTree();
                if (this.selectedTechnology) {
                    this.selectTechnology(this.selectedTechnology.id);
                }
            }
        } catch (error) {
            console.error('TechnologyManager: Error updating technologies:', error);
        }
    }

    /**
     * Initialize and render the force-directed graph visualization
     */
    renderForceDirectedGraph() {
        if (!this.treeContainer) return;
        
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        
        if (this.technologies.length === 0) {
            this.treeContainer.innerHTML = `<p class="no-technologies">${t('noTechnologies') || '暂无科技可研究'}</p>`;
            return;
        }

        // Create canvas container
        this.treeContainer.innerHTML = `
            <div class="tech-tree-canvas-container">
                <canvas id="tech-tree-canvas"></canvas>
            </div>
            <div class="tech-tree-controls">
                <button id="tech-zoom-in" class="tech-control-btn">🔍+</button>
                <button id="tech-zoom-out" class="tech-control-btn">🔍-</button>
                <button id="tech-reset-view" class="tech-control-btn">🔄</button>
            </div>
        `;
        
        const canvas = document.getElementById('tech-tree-canvas');
        const container = canvas.parentElement;
        
        // Set canvas size
        canvas.width = Math.max(800, container.clientWidth);
        canvas.height = Math.max(600, this.technologies.length * 60);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Initialize nodes from technologies
        this.nodes = this.technologies.map((tech, index) => {
            const tier = tech.tier || 1;
            const tierWidth = 800;
            const tierHeight = 180;
            const tierY = (tier - 1) * tierHeight + 120;
            const techsInTier = this.technologies.filter(t => (t.tier || 1) === tier).length;
            const tierIndex = this.technologies.filter((t, i) => i < index && (t.tier || 1) === tier).length;
            
            return {
                id: tech.id,
                name: tech.name,
                tier: tier,
                researched: tech.researched || tech.purchased || false,
                canResearch: this.canResearch(tech),
                dependencies: tech.dependencies || [],
                x: (tierWidth / (techsInTier + 1)) * (tierIndex + 1),
                y: tierY,
                vx: 0,
                vy: 0,
                radius: 40,
                selected: false
            };
        });
        
        // Build edges from dependencies
        this.edges = [];
        this.nodes.forEach(node => {
            node.dependencies.forEach(depId => {
                const depNode = this.nodes.find(n => n.id === depId);
                if (depNode) {
                    this.edges.push({
                        from: depNode,
                        to: node
                    });
                }
            });
        });
        
        // Setup event listeners
        this.setupCanvasEvents();
        
        // Start force simulation
        this.startForceSimulation();
    }

    /**
     * Force-directed graph simulation
     */
    startForceSimulation() {
        if (this.simulationRunning) return;
        this.simulationRunning = true;
        
        const animate = () => {
            if (!this.simulationRunning) return;
            
            this.updatePhysics();
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    stopForceSimulation() {
        this.simulationRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    updatePhysics() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const k = 0.5;
        const damping = 0.85;
        const repulsion = 8000;
        const attraction = 0.02;
        const centerForce = 0.0008;
        
        // Apply repulsion between all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                
                if (dist < 250) {
                    const force = repulsion / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    if (!this.draggedNode || this.draggedNode !== nodeA) {
                        nodeA.vx -= fx;
                        nodeA.vy -= fy;
                    }
                    if (!this.draggedNode || this.draggedNode !== nodeB) {
                        nodeB.vx += fx;
                        nodeB.vy += fy;
                    }
                }
            }
        }
        
        // Apply spring forces along edges
        this.edges.forEach(edge => {
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const force = (dist - 180) * attraction;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            if (!this.draggedNode || this.draggedNode !== edge.from) {
                edge.from.vx += fx;
                edge.from.vy += fy;
            }
            if (!this.draggedNode || this.draggedNode !== edge.to) {
                edge.to.vx -= fx;
                edge.to.vy -= fy;
            }
        });
        
        // Apply center gravity
        const centerX = width / 2;
        const centerY = height / 2 - 80;
        
        this.nodes.forEach(node => {
            if (this.draggedNode === node) return;
            
            node.vx += (centerX - node.x) * centerForce;
            node.vy += (centerY - node.y) * centerForce;
            
            // Apply damping
            node.vx *= damping;
            node.vy *= damping;
            
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Boundary constraints
            const margin = node.radius + 15;
            if (node.x < margin) { node.x = margin; node.vx *= -0.5; }
            if (node.x > width - margin) { node.x = width - margin; node.vx *= -0.5; }
            if (node.y < margin) { node.y = margin; node.vy *= -0.5; }
            if (node.y > height - margin) { node.y = height - margin; node.vy *= -0.5; }
        });
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, 'rgba(20, 30, 48, 0.3)');
        bgGradient.addColorStop(1, 'rgba(36, 59, 85, 0.3)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Apply transform
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // Draw edges
        this.edges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
            
            if (edge.from.researched && edge.to.researched) {
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#2ecc71';
                ctx.shadowBlur = 10;
            } else if (edge.from.researched && edge.to.canResearch) {
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 8;
            } else {
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 0;
            }
            
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Draw arrow
            const angle = Math.atan2(edge.to.y - edge.from.y, edge.to.x - edge.from.x);
            const arrowLength = 12;
            const arrowX = edge.to.x - (edge.to.radius + 5) * Math.cos(angle);
            const arrowY = edge.to.y - (edge.to.radius + 5) * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
                arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
                arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
                arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.strokeStyle = ctx.strokeStyle;
            ctx.stroke();
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            // Node glow effect for selected/hovered
            if (node.selected || (this.draggedNode === node)) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 12, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fill();
                
                // Outer ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Node circle with state-based gradient
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            
            let gradient;
            if (node.researched) {
                gradient = ctx.createRadialGradient(node.x - 10, node.y - 10, 0, node.x, node.y, node.radius);
                gradient.addColorStop(0, '#58d68d');
                gradient.addColorStop(0.7, '#2ecc71');
                gradient.addColorStop(1, '#1e8449');
            } else if (node.canResearch) {
                gradient = ctx.createRadialGradient(node.x - 10, node.y - 10, 0, node.x, node.y, node.radius);
                gradient.addColorStop(0, '#f5b041');
                gradient.addColorStop(0.7, '#f39c12');
                gradient.addColorStop(1, '#b9770e');
            } else {
                gradient = ctx.createRadialGradient(node.x - 10, node.y - 10, 0, node.x, node.y, node.radius);
                gradient.addColorStop(0, '#85929e');
                gradient.addColorStop(0.7, '#5d6d7e');
                gradient.addColorStop(1, '#34495e');
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Node border
            ctx.lineWidth = node.selected ? 4 : 2;
            ctx.strokeStyle = node.selected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
            ctx.stroke();
            
            // Node label - split long names
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const maxCharsPerLine = 6;
            if (node.name.length > maxCharsPerLine) {
                const mid = Math.ceil(node.name.length / 2);
                const line1 = node.name.substring(0, mid);
                const line2 = node.name.substring(mid);
                ctx.fillText(line1, node.x, node.y - 8);
                ctx.fillText(line2, node.x, node.y + 10);
            } else {
                ctx.fillText(node.name, node.x, node.y);
            }
            
            // Tier indicator
            ctx.font = '11px "Courier New", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`T${node.tier}`, node.x, node.y + node.radius - 14);
            
            // Status icon
            if (node.researched) {
                ctx.font = '16px Arial';
                ctx.fillText('✓', node.x, node.y - node.radius + 18);
            } else if (node.canResearch) {
                ctx.font = '16px Arial';
                ctx.fillText('⚡', node.x, node.y - node.radius + 18);
            } else {
                ctx.font = '14px Arial';
                ctx.fillText('🔒', node.x, node.y - node.radius + 16);
            }
        });
        
        ctx.restore();
    }

    setupCanvasEvents() {
        const canvas = this.canvas;
        
        // Mouse down
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - this.offsetX) / this.scale;
            const mouseY = (e.clientY - rect.top - this.offsetY) / this.scale;
            
            const clickedNode = this.nodes.find(node => {
                const dx = node.x - mouseX;
                const dy = node.y - mouseY;
                return Math.sqrt(dx * dx + dy * dy) < node.radius;
            });
            
            if (clickedNode) {
                this.draggedNode = clickedNode;
                this.selectNode(clickedNode);
            } else {
                this.isPanning = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        // Mouse move
        canvas.addEventListener('mousemove', (e) => {
            if (this.draggedNode) {
                const rect = canvas.getBoundingClientRect();
                this.draggedNode.x = (e.clientX - rect.left - this.offsetX) / this.scale;
                this.draggedNode.y = (e.clientY - rect.top - this.offsetY) / this.scale;
                this.draggedNode.vx = 0;
                this.draggedNode.vy = 0;
            } else if (this.isPanning) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
            
            // Cursor feedback
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - this.offsetX) / this.scale;
            const mouseY = (e.clientY - rect.top - this.offsetY) / this.scale;
            const hoveredNode = this.nodes.find(node => {
                const dx = node.x - mouseX;
                const dy = node.y - mouseY;
                return Math.sqrt(dx * dx + dy * dy) < node.radius;
            });
            canvas.style.cursor = hoveredNode || this.isPanning ? 'grab' : 'default';
        });
        
        // Mouse up
        canvas.addEventListener('mouseup', () => {
            this.draggedNode = null;
            this.isPanning = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.draggedNode = null;
            this.isPanning = false;
        });
        
        // Mouse wheel - zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.85 : 1.15;
            this.scale *= zoomFactor;
            this.scale = Math.max(0.5, Math.min(3, this.scale));
        }, { passive: false });
        
        // Control buttons
        const zoomInBtn = document.getElementById('tech-zoom-in');
        const zoomOutBtn = document.getElementById('tech-zoom-out');
        const resetBtn = document.getElementById('tech-reset-view');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.scale *= 1.3;
                this.scale = Math.min(3, this.scale);
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.scale *= 0.77;
                this.scale = Math.max(0.5, this.scale);
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.scale = 1;
                this.offsetX = 0;
                this.offsetY = 0;
            });
        }
    }

    selectNode(node) {
        this.nodes.forEach(n => n.selected = false);
        node.selected = true;
        this.selectedNode = node;
        
        const tech = this.technologies.find(t => t.id === node.id);
        if (tech) {
            this.selectTechnology(tech.id);
        }
    }

    renderTree() {
        if (!this.treeContainer) {
            console.warn('TechnologyManager: #technology-tree-container element not found');
            return;
        }
        
        this.stopForceSimulation();
        this.renderTextBasedTree();
    }

    /**
     * Render technology tree using plain text and ASCII art
     */
    renderTextBasedTree() {
        if (!this.treeContainer) return;
        
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        
        if (this.technologies.length === 0) {
            this.treeContainer.innerHTML = `<p class="no-technologies">${t('noTechnologies') || '暂无科技可研究'}</p>`;
            return;
        }
        
        // Group technologies by tier
        const tiers = {};
        this.technologies.forEach(tech => {
            const tier = tech.tier || 1;
            if (!tiers[tier]) tiers[tier] = [];
            tiers[tier].push(tech);
        });
        
        // Build ASCII tree
        let ascii = '';
        const maxTier = Math.max(...Object.keys(tiers).map(Number));
        
        // Header
        ascii += '╔══════════════════════════════════════════════════════════════════╗\n';
        ascii += '║                        科 技 树                                   ║\n';
        ascii += '╚══════════════════════════════════════════════════════════════════╝\n\n';
        
        // Render each tier
        for (let tier = 1; tier <= maxTier; tier++) {
            if (!tiers[tier]) continue;
            
            ascii += `┌─ 第 ${tier} 层 ──────────────────────────────────────────────\n`;
            
            // Render tech boxes for this tier
            tiers[tier].forEach((tech, idx) => {
                const isResearched = tech.researched || tech.purchased || false;
                const canResearch = this.canResearch(tech);
                const status = isResearched ? '✓ 已研究' : (canResearch ? '○ 可研究' : '✗ 锁定');
                const statusIcon = isResearched ? '●' : (canResearch ? '○' : '×');
                
                // Tech box
                const name = this.escapeHtml(tech.name || tech.id);
                const desc = this.escapeHtml(tech.description || '').substring(0, 20);
                
                ascii += `│ ${statusIcon} [${name}]\n`;
                ascii += `│    ${desc}\n`;
                ascii += `│    状态: ${status}\n`;
                
                // Show dependencies
                if (tech.dependencies && tech.dependencies.length > 0) {
                    const deps = tech.dependencies.map(d => {
                        const depTech = this.technologies.find(t => t.id === d);
                        return depTech ? depTech.name || d : d;
                    }).join(', ');
                    ascii += `│    依赖: ${deps}\n`;
                }
                
                // Show costs
                if (tech.costs && Object.keys(tech.costs).length > 0) {
                    const costs = Object.entries(tech.costs)
                        .map(([res, amt]) => `${res}: ${Math.floor(amt)}`)
                        .join(', ');
                    ascii += `│    花费: ${costs}\n`;
                }
                
                ascii += '│\n';
            });
            
            ascii += '│\n';
        }
        
        // Legend
        ascii += '└────────────────────────────────────────────────────────────────\n';
        ascii += '图例: ● 已研究  ○ 可研究  × 锁定\n';
        ascii += '      点击科技查看详情或进行研究\n';
        
        // Render as pre-formatted text
        // Render as two-column layout
        this.treeContainer.innerHTML = `
            <div class="tech-tree-text">
                <pre>${ascii}</pre>
            </div>
            <div class="tech-tree-list">
                <h4>科技列表 (点击选择)</h4>
                ${this.technologies.map(tech => {
                    const isResearched = tech.researched || tech.purchased || false;
                    const canResearch = this.canResearch(tech);
                    const statusClass = isResearched ? 'researched' : (canResearch ? 'available' : 'locked');
                    return `<div class="tech-item ${statusClass}" data-tech-id="${tech.id}" style="cursor:pointer;padding:8px;margin:2px 0;border:1px solid #ccc;${isResearched?'background:#cfc':(canResearch?'background:#ffc':'background:#f0f0f0')}">
                        <span class="tech-status">${isResearched ? '✓' : (canResearch ? '○' : '×')}</span>
                        <span class="tech-name">${this.escapeHtml(tech.name || tech.id)}</span>
                        <span class="tech-tier">[T${tech.tier || 1}]</span>
                    </div>`;
                }).join('')}
            </div>
        `;
        
        // Add click handlers with debugging
        const self = this;
        this.treeContainer.querySelectorAll('.tech-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const techId = this.getAttribute('data-tech-id');
                console.log('Clicked tech:', techId, 'Detail panel:', self.detailPanel ? 'exists' : 'null');
                self.selectTechnology(techId);
                
                // Update visual selection
                self.treeContainer.querySelectorAll('.tech-item').forEach(i => i.style.border = '1px solid #ccc');
                this.style.border = '2px solid #007bff';
            });
        });
            <div class="tech-tree-text">
                <pre>${ascii}</pre>
            </div>
            <div class="tech-tree-list">
                <h4>科技列表</h4>
                ${this.technologies.map(tech => {
                    const isResearched = tech.researched || tech.purchased || false;
                    const canResearch = this.canResearch(tech);
                    const statusClass = isResearched ? 'researched' : (canResearch ? 'available' : 'locked');
                    return `<div class="tech-item ${statusClass}" data-tech-id="${tech.id}">
                        <span class="tech-status">${isResearched ? '●' : (canResearch ? '○' : '×')}</span>
                        <span class="tech-name">${this.escapeHtml(tech.name || tech.id)}</span>
                        <span class="tech-tier">T${tech.tier || 1}</span>
                    </div>`;
                }).join('')}
            </div>
        `;
        
        // Add click handlers
        this.treeContainer.querySelectorAll('.tech-item').forEach(item => {
            item.addEventListener('click', () => {
                const techId = item.getAttribute('data-tech-id');
                this.selectTechnology(techId);
            });
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    selectTechnology(techId) {
        const tech = this.technologies.find(t => t.id === techId);
        if (!tech) {
            console.warn('TechnologyManager: Technology not found:', techId);
            return;
        }

        this.selectedTechnology = tech;

        this.selectedTechnology = tech;

        // If no detail panel exists, show inline
        if (!this.detailPanel) {
            console.log('Detail panel not found, showing inline');
            // Create inline detail in the tree container
            const container = this.treeContainer;
            const isResearched = tech.researched || tech.purchased || false;
            const canResearch = this.canResearch(tech);
            const hasResources = this.hasResources(tech.costs);
            
            // Build costs string
            let costsStr = '';
            if (tech.costs && Object.keys(tech.costs).length > 0) {
                costsStr = Object.entries(tech.costs)
                    .map(([k, v]) => `${k}: ${Math.floor(v)}`)
                    .join(', ');
            }
            
            // Build dependencies string
            let depsStr = '';
            if (tech.dependencies && tech.dependencies.length > 0) {
                depsStr = tech.dependencies.map(d => {
                    const depTech = this.technologies.find(t => t.id === d);
                    return depTech ? depTech.name || d : d;
                }).join(', ');
            }
            
            const status = isResearched ? '已研究' : (canResearch ? '可研究' : '未解锁');
            const canUnlock = canResearch && hasResources;
            
            // Remove any existing inline detail
            const existing = container.querySelector('.tech-inline-detail');
            if (existing) existing.remove();
            
            const detailHtml = `<div class="tech-inline-detail" style="padding:15px;background:#fff;border:2px solid #007bff;margin:10px 0;">
                    <h3>${tech.name || tech.id}</h3>
                    <p><strong>等级:</strong> T${tech.tier || 1}</p>
                    <p><strong>状态:</strong> ${status}</p>
                    ${costsStr ? `<p><strong>花费:</strong> ${costsStr}</p>` : ''}
                    ${depsStr ? `<p><strong>依赖:</strong> ${depsStr}</p>` : ''}
                    ${!isResearched ? `
                        <button id="btn-research-inline" style="padding:10px 20px;background:${canUnlock?'#28a745':'#ccc'};color:#fff;border:none;cursor:${canUnlock?'pointer':'not-allowed'};font-size:14px;">
                            ${canUnlock ? '【研究此科技】' : (hasResources ? '资源不足' : '前置未完成')}
                        </button>
                    ` : '<p><em>✓ 已研究</em></p>'}
                </div>`;
            
            // Insert after the tech-tree-list
            const listEl = container.querySelector('.tech-tree-list');
            if (listEl) {
                listEl.insertAdjacentHTML('afterend', detailHtml);
                
                // Add research button handler
                const btn = document.getElementById('btn-research-inline');
                if (btn && canUnlock) {
                    btn.addEventListener('click', () => {
                        console.log('Researching:', tech.id);
                        this.researchTechnology(tech.id);
                        // Refresh the view
                        this.renderTree();
                    });
                }
            }
            return;
        }
            console.warn('TechnologyManager: #technology-detail element not found');
            return;
        }

        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        const isResearched = tech.researched || tech.purchased || false;
        const canResearch = this.canResearch(tech);
        const hasResources = this.hasResources(tech.costs);

        let costsHtml = '';
        if (tech.costs && Object.keys(tech.costs).length > 0) {
            costsHtml = '<div class="tech-costs">';
            for (const [resource, amount] of Object.entries(tech.costs)) {
                const resourceName = this.getResourceName(resource);
                costsHtml += `<span class="cost-item">${resourceName}: ${Math.floor(amount)}</span>`;
            }
            costsHtml += '</div>';
        } else {
            costsHtml = '<p class="no-costs">免费</p>';
        }

        let depsHtml = '';
        if (tech.dependencies && tech.dependencies.length > 0) {
            depsHtml = '<div class="tech-dependencies"><strong>前置科技:</strong><br>';
            tech.dependencies.forEach(depId => {
                const depTech = this.technologies.find(t => t.id === depId);
                const depName = depTech ? depTech.name : depId;
                const depResearched = depTech && (depTech.researched || depTech.purchased);
                depsHtml += `<span class="dep-item ${depResearched ? 'completed' : ''}">${depName}</span>`;
            });
            depsHtml += '</div>';
        }

        const effectDesc = this.getEffectDescription(tech);

        this.detailPanel.innerHTML = `
            <div class="technology-detail-content">
                <h3 class="tech-detail-name">${tech.name}</h3>
                <div class="tech-detail-tier">等级：T${tech.tier}</div>
                <p class="tech-detail-description">${tech.description || ''}</p>
                ${costsHtml}
                ${depsHtml}
                <div class="tech-detail-effect">
                    <strong>效果:</strong><br>
                    ${effectDesc}
                </div>
                <div class="tech-detail-status">
                    <strong>状态:</strong>
                    <span class="status-badge ${isResearched ? 'researched' : 'locked'}">
                        ${isResearched ? (t('researched') || '已研究') : (canResearch ? (t('available') || '可研究') : (t('locked') || '未解锁'))}
                    </span>
                </div>
                ${!isResearched ? `
                    <button type="button" id="research-button" 
                            class="research-btn ${canResearch && hasResources ? 'can-research' : 'cannot-research'}"
                            ${!canResearch || !hasResources ? 'disabled' : ''}>
                        ${hasResources ? (t('research') || '研究') : (t('insufficientResources') || '资源不足')}
                    </button>
                ` : `
                    <button type="button" disabled class="research-btn researched">
                        ${t('researched') || '已研究'}
                    </button>
                `}
            </div>
        `;

        const researchBtn = this.detailPanel.querySelector('#research-button');
        if (researchBtn) {
            researchBtn.addEventListener('click', () => {
                this.researchTechnology(techId);
            });
        }

        if (this.canvas) {
            this.nodes.forEach(n => {
                n.selected = (n.id === techId);
            });
        }
    }

    researchTechnology(techId) {
        if (!this.rustGame || typeof this.rustGame.research_technology !== 'function') {
            console.warn('TechnologyManager: rustGame or research_technology not available');
            return false;
        }

        try {
            const success = this.rustGame.research_technology(techId);
            if (success) {
                this.update();
                if (this.selectedTechnology && this.selectedTechnology.id === techId) {
                    this.selectTechnology(techId);
                }
                console.log('Technology researched successfully:', techId);
            } else {
                console.warn('Failed to research technology:', techId);
            }
            return success;
        } catch (error) {
            console.error('TechnologyManager: Error researching technology:', error);
            return false;
        }
    }

    canResearch(tech) {
        if (!tech) return false;
        if (tech.researched || tech.purchased) return false;
        if (tech.dependencies && tech.dependencies.length > 0) {
            for (const depId of tech.dependencies) {
                const depTech = this.technologies.find(t => t.id === depId);
                if (!depTech || !(depTech.researched || depTech.purchased)) {
                    return false;
                }
            }
        }
        return true;
    }

    hasResources(costs) {
        if (!costs || Object.keys(costs).length === 0) return true;
        for (const [resource, amount] of Object.entries(costs)) {
            const resourceValue = this.getResourceValue(resource);
            if (resourceValue < amount) {
                return false;
            }
        }
        return true;
    }

    getResourceValue(resourceType) {
        if (!this.rustGame) return 0;
        const resourceMap = {
            'Gold': 'get_coins',
            'Wood': 'get_wood',
            'Stone': 'get_stone',
            'IronOre': 'get_iron_ore',
            'CopperOre': 'get_copper_ore',
            'AluminumOre': 'get_aluminum_ore',
            'Coal': 'get_coal',
            'Oil': 'get_oil',
            'Crystal': 'get_crystal',
            'Food': 'get_food'
        };
        const getter = resourceMap[resourceType];
        if (getter && typeof this.rustGame[getter] === 'function') {
            return this.rustGame[getter]();
        }
        return 0;
    }

    getResourceName(resourceType) {
        const resourceNames = {
            'Gold': '金币',
            'Wood': '木头',
            'Stone': '石头',
            'IronOre': '铁矿石',
            'CopperOre': '铜矿石',
            'AluminumOre': '铝矿石',
            'Coal': '煤炭',
            'Oil': '石油',
            'Crystal': '水晶',
            'Food': '食物'
        };
        if (this.i18n && this.i18n.currentLanguage === 'en') {
            const enNames = {
                'Gold': 'Gold',
                'Wood': 'Wood',
                'Stone': 'Stone',
                'IronOre': 'Iron Ore',
                'CopperOre': 'Copper Ore',
                'AluminumOre': 'Aluminum Ore',
                'Coal': 'Coal',
                'Oil': 'Oil',
                'Crystal': 'Crystal',
                'Food': 'Food'
            };
            return enNames[resourceType] || resourceType;
        }
        return resourceNames[resourceType] || resourceType;
    }

    getEffectDescription(tech) {
        const t = this.i18n ? this.i18n.t.bind(this.i18n) : (key) => key;
        if (tech.effect) {
            switch (tech.effect.type) {
                case 'ProductionBonus':
                    return `提升 ${this.getResourceName(tech.effect.resource)} 产量 ${Math.floor(tech.effect_value * 100)}%`;
                case 'UnlockBuilding':
                    return `解锁建筑：${tech.effect.building_type}`;
                case 'UnlockUI':
                    return '解锁新的游戏界面';
                case 'MechanicChange':
                    return tech.effect.description || tech.effect_value.toString();
                default:
                    return tech.description || t('unknownEffect') || '未知效果';
            }
        }
        return tech.description || t('unknownEffect') || '未知效果';
    }

    bindEvents() {
    }

    renderToPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('TechnologyManager: Container not found:', containerId);
            return;
        }

        this.update();
        
        if (this.treeContainer && this.treeContainer.parentNode === container) {
            return;
        }

        container.innerHTML = `
            <div id="technology-tree-container"></div>
            <div id="technology-detail"></div>
        `;

        this.treeContainer = document.getElementById('technology-tree-container');
        this.detailPanel = document.getElementById('technology-detail');
        this.renderTree();
    }
}

window.TechnologyManager = TechnologyManager;

window.updateTechnologyPanel = function() {
    if (window.technologyManager && typeof window.technologyManager.renderToPanel === 'function') {
        const technologyTab = document.getElementById('tab-technology');
        if (technologyTab && technologyTab.classList.contains('active')) {
            window.technologyManager.update();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('TechnologyManager class loaded');
});
