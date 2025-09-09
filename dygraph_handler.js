import init, * as wasm from 'https://holl95.github.io/Pareto_results/biquad_wasm/pkg/biquad_wasm.js';
await init('https://holl95.github.io/Pareto_results/biquad_wasm/pkg/biquad_wasm_bg.wasm');
export function createCellWithDygraph(container, width, height, title, cellIndex, yaxis, dygraphInstances) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            cellDiv.style.width = width + 'px';
            cellDiv.style.height = height + 'px';
            cellDiv.style.display = 'inline-block';
            cellDiv.style.verticalAlign = 'top';
            cellDiv.style.marginRight = '20px';
            cellDiv.style.marginBottom = '20px';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'cell-title';
            titleDiv.textContent = title;
            cellDiv.appendChild(titleDiv);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'cell-content';
            cellDiv.appendChild(contentDiv);

            const graphDiv = document.createElement('div');
            graphDiv.className = 'dygraph-div';
            graphDiv.id = `graph-${cellIndex}`;
            contentDiv.appendChild(graphDiv);

            container.appendChild(cellDiv);

            // Generate initial data for this cell
            //const initialData = generateTimeSeriesData(100, cellIndex * 0.1);
            //initialDataSets[cellIndex] = initialData;
            // Create dygraph instance
            const dygraph = new Dygraph(graphDiv, yaxis, {
                //labels: ['Date', 'Series 1'],
                width: width - 40,
                height: height,
                strokeWidth: 2,
                colors: ['#1f77b4'],
                axes: {
                    x: {
                        drawGrid: false
                    },
                    y: {
                        drawGrid: true
                    }
                },
                gridLineColor: '#f0f0f0',
                axisLabelFontSize: 10,
                titleHeight: 0,
                rightGap: 10
            });

            dygraphInstances[cellIndex] = dygraph;
            return cellDiv;
        }
function colstack(...arrays) {
    return arrays[0].map((row, i) => 
        arrays.reduce((acc, arr) => acc.concat(arr[i]), [])
    );
}

function linspace(start, stop, num, endpoint = true) {
    const div = endpoint ? (num - 1) : num;
    const step = (stop - start) / div;
    let array1= Array.from({length: num}, (_, i) => start + step * i);
    return array1.map(x =>[x])
}
export function updateDataGrid(initialDataSets,dygraphInstances) {
            const container = document.getElementById('data-grid');
            if (!container) return;

            const containerWidth = document.querySelector('.data-grid-container').offsetWidth - 40;
            const ftv_cols = 3;
            const rows = 2;
            const swv_cols = 6;
            const padding = 20;
            const swvcellWidth = (containerWidth - (padding * (swv_cols - 1))) / swv_cols;
            const ftvwidth = (containerWidth - (padding * (ftv_cols - 1))) / ftv_cols;
            const cellHeight = 200;

            // Clear previous content
            container.innerHTML = '';
            dygraphInstances.length = 0;

            let cellIndex = 0;

            // Create first row of cells (FTV)
            const firstRow = document.createElement('div');
            firstRow.style.marginBottom = padding + 'px';
            container.appendChild(firstRow);
            let Freqs=[3, 9, 15]
            let sfreqs=[65, 75, 85, 100, 115, 125, 135, 145, 150, 175, 200, 300, 500]
            for (let col = 0; col < ftv_cols; col++) {
                createCellWithDygraph(
                    firstRow, 
                    ftvwidth - padding, 
                    cellHeight, 
                    `FTV ${Freqs[col]} Hz`, 
                    cellIndex++,
                    colstack(initialDataSets[col].times,initialDataSets[col].data),dygraphInstances
                );
            }

            // Create second row of cells (FTV)
            const secondRow = document.createElement('div');
            secondRow.style.marginBottom = padding + 'px';
            container.appendChild(secondRow);
            const harmheight=cellHeight/3;
            const harmonics_set=initialDataSets.slice(0,3).map((dataset, index) => (wasm.harmonics(
                                                                                    dataset.times,//time
                                                                                    dataset.data,//current
                                                                                    0.0,//input_freq
                                                                                    true,//envelope
                                                                                    10,//truncation_oscillation
                                                                                    [...Array(6).keys()].map(i => i + 2),//harmonics
                                                                                    25, //filter_pc,
                                                                                    1,//decimation_factor
                                                                                    1/(dataset.times[1]-dataset.times[0])//sampling_RATE
                                                                             ).harmonics));

             for (let row=0; row<5; row++)   {
                for (let col = 0; col < ftv_cols; col++){
                    createCellWithDygraph(
                        secondRow, 
                        ftvwidth - padding, 
                        harmheight, 
                         `FTV ${Freqs[col]* (row+4)} Hz`,  
                        cellIndex++,colstack(initialDataSets[col].times,harmonics_set[col][row+2]),dygraphInstances
                    );
                }
            }
            
            // Create third row of cells (SWV)
            const thirdRow = document.createElement('div');
            thirdRow.style.marginBottom = padding + 'px';
            container.appendChild(thirdRow);

            for (let col = 0; col < swv_cols; col++) {
                let xaxis=linspace(0, 1, initialDataSets[col+3].data.length);
                createCellWithDygraph(
                    thirdRow, 
                    swvcellWidth - (padding * 0.8), 
                    cellHeight, 
                    `SWV ${sfreqs[col]} Hz`, 
                    cellIndex++,colstack(xaxis,initialDataSets[3+(col*2)].data, initialDataSets[4+(col*2)].data),dygraphInstances
                );
            }

            // Create fourth row of cells (SWV)
            const fourthRow = document.createElement('div');
            container.appendChild(fourthRow);

            for (let col = 0; col < swv_cols; col++) {
                let xaxis=linspace(0, 1, initialDataSets[col+9].data.length);
                createCellWithDygraph(
                    fourthRow, 
                    swvcellWidth - (padding * 0.8), 
                    cellHeight, 
                    `SWV ${sfreqs[col]+6} Hz`, 
                    cellIndex++,colstack(xaxis,initialDataSets[12+(col*2)].data, initialDataSets[13+(col*2)].data),dygraphInstances
                );
            }
        }
export function addSimulationTrace(dygraphInstance, simulationData, flag, traceLabel = 'Simulation',) {
    if (!dygraphInstance || !simulationData) return;
    
    // Get current data from the dygraph
    const currentData = dygraphInstance.rawData_;
    const currentLabels = dygraphInstance.getLabels();
    
    // Check if simulation trace already exists
    const simTraceIndex = currentLabels.indexOf(traceLabel);
    let newData, newLabels;
    
    if (simTraceIndex !== -1) {
        // Replace existing simulation trace
        newData = currentData.map((row, i) => {
            const newRow = [...row];
            if (i < simulationData.length) {
                newRow[simTraceIndex] = simulationData[i];
            } else {
                newRow[simTraceIndex] = null;
            }
            return newRow;
        });
        newLabels = currentLabels;
    } else {
        // Add new simulation trace
        newLabels = [...currentLabels, traceLabel];
        newData = currentData.map((row, i) => {
            const newRow = [...row];
            if (i < simulationData.length) {
                newRow.push(simulationData[i]);
            } else {
                newRow.push(null);
            }
            return newRow;
        });


    }
    
    // Update the dygraph with new data and colors
    const colors = generateColors(newLabels.length - 1, flag); // -1 for x-axis label
    
    dygraphInstance.updateOptions({
        file: newData,
        labels: newLabels,
        colors: colors
    });
}


// Function to add simulation trace to multiple dygraph instances by index or all
export async function addSimulationTraceToCharts(simulation_map, file_list, dygraphInstances, strdx) {
    let instance;
    
    for (let i=0; i<3; i++){

            instance=dygraphInstances[i];
            addSimulationTrace(instance, simulation_map[file_list[i]].data, "FTACV", `Simulation ${strdx}`);
            for (let j=0; j<6; j++){
                instance=dygraphInstances[i+3+(j*3)];
                addSimulationTrace(instance, simulation_map[file_list[i]].harmonics[j+2], "FTACV",  `Simulation ${strdx}`)     
        }
    }
     for (let i=0; i<12; i++){
        instance=dygraphInstances[i+18];
        let swv_data=colstack(simulation_map[file_list[(i*2)+3]].data,  simulation_map[file_list[(i*2)+4]].data)
        addSimulationTrace(instance, simulation_map[file_list[(i*2)+3]].data, "SWV", `Anodic ${strdx}`);
        addSimulationTrace(instance, simulation_map[file_list[(i*2)+4]].data, "SWV",`Cathodic ${strdx}`);
    }
}


// Helper function to generate colors for traces
function generateColors(numTraces, flag) {
    const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    const colors = [];
    if (flag=="FTACV"){
        for (let i = 0; i < numTraces; i++) {
            colors.push(defaultColors[i]);
        }
    }else{
        for (let i = 0; i < numTraces; i++) {
            colors.push(defaultColors[Math.floor(i/2)]);
        }
    }
    
    
    return colors;
}

