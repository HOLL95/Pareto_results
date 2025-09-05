export async function loadDataFile(filename = 'data.txt') {
    try {
        const response = await fetch(filename);
        const text = await response.text();
        return parseData(text);
    } catch (error) {
        console.error('Error loading file:', error);
        throw error;
    }
}

export function parseData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Detect separator (comma, tab, or multiple spaces)
    const firstLine = lines[0];
    let separator;
    if (firstLine.includes('\t')) {
        separator = '\t';
    } else if (firstLine.includes(',')) {
        separator = ',';
    } else {
        separator = /\s+/;
    }
    let init_assignment=firstLine.split(separator);
    init_assignment[0].replace("#", "")
    const headers = init_assignment;
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/\s+/).map(val => parseFloat(val.trim()));
        data.push(values);
    }
    
    return { headers, data };
}
export function getCol(array, col){
    let column = new Array(array.length); 
    for (let i = 0; i < array.length; i++) {
     column[i] = array[i][col];
    }
return column   ;
}