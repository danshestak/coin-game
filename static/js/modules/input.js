const res = await fetch("static/csv/input.csv", {method: "get", headers: {"content-type": "text/csv;charset=UTF-8",}});
if (!res.ok) {
    throw new Error(`HTTP error! status: `);
}

let csv = await res.text();
csv = csv.replace(/\r/g, "");
csv = csv.split(/\n/g);

let offset = 0
for (let i = 0; i < csv.length; i++) {
    if (!csv[i]) {
        offset++;
        continue;
    }

    csv[i-offset] = csv[i].split(/,/g);;
}
csv = csv.slice(0, -offset);

const valueTypesMap = new Map();
for (let i = 0; i < csv[0].length; i++) {
    valueTypesMap.set(csv[0][i].replace(/[.]/g, ""), i);
}

export function getValue(round, valueType) {
    const line = csv[round]
    if (!line) {
        return undefined;
    }
    
    const index = valueTypesMap.get(valueType);
    if (!index) {
        return undefined;
    }

    return line[index];
}

export function getLength() {
    return csv.length;
}