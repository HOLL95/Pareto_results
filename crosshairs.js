export function createCrosshairs(subplotG, xScale, yScale, point, color, pointIndex) {
    const x = xScale(point.objectives[parseInt(subplotG.attr("data-col"))]);
    const y = yScale(point.objectives[parseInt(subplotG.attr("data-row"))]);
    
    // Create crosshair group
    const crosshairG = subplotG.append("g")
        .attr("class", `crosshair crosshair-${pointIndex}`)
        .style("pointer-events", "none");
    
    // Vertical line
    crosshairG.append("line")
        .attr("x1", x)
        .attr("y1", 20)
        .attr("x2", x)
        .attr("y2", subplotSize - 20)
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.8);
    
    // Horizontal line
    crosshairG.append("line")
        .attr("x1", 20)
        .attr("y1", y)
        .attr("x2", subplotSize - 20)
        .attr("y2", y)
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.8);
}

// Add this new function to update crosshairs
export function updateCrosshairs() {
    // Remove existing crosshairs
    d3.selectAll(".crosshair").remove();
    
    if (selectedPointIds.length === 0) return;
    
    const colors = ['#ff7f0e', '#2ca02c']; // Orange and green
    
    // Add crosshairs for each selected point
    selectedPointIds.forEach((pointId, index) => {
        const selectedPoint = paretoPoints.find(p => p.id === pointId);
        if (!selectedPoint) return;
        
        // Add crosshairs to each subplot
        d3.selectAll(".subplot").each(function() {
            const subplotG = d3.select(this);
            const row = parseInt(subplotG.attr("data-row"));
            const col = parseInt(subplotG.attr("data-col"));
            
            // Recreate scales for this subplot (same logic as in createSubplot)
            const xData = paretoPoints.map(d => d.objectives[col]);
            const yData = paretoPoints.map(d => d.objectives[row]);
            
            const xScale = d3.scaleLinear()
                .domain(d3.extent(xData))
                .range([20, subplotSize - 20])
                .nice();
                
            const yScale = d3.scaleLinear()
                .domain(d3.extent(yData))
                .range([subplotSize - 20, 20])
                .nice();
            
            createCrosshairs(subplotG, xScale, yScale, selectedPoint, colors[index], index);
        });
    });
}