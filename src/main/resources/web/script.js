localTime = miliseconds => new Date(miliseconds).toLocaleTimeString();
fetchJson = url => fetch(url).then(response => response.json());
seconds = miliseconds => (miliseconds / 1000.0).toFixed(3) + "s";

function start() {
    updateTraces();
    setInterval(updateTraces, 1000);
}

function updateTraces() {
    fetchJson("/traces").then(traces => {
        const traceList = document.getElementById("trace-list");

        let currentTraces = traceList.children;
        let i = 0;
        let j = 0;
        while (i < currentTraces.length && j < traces.length) {
            if (currentTraces[i].id !== traces[j].id) {
                traceList.insertBefore(createTraceElement(traces[j]), currentTraces[i]);
            } else {
                currentTraces[i].firstElementChild.innerHTML = traceDescription(traces[j]);
            }
            i++;
            j++;
        }
        while (i < currentTraces.length) {
            traceList.removeChild(currentTraces[i++]);
        }
        while (j < traces.length) {
            traceList.appendChild(createTraceElement(traces[j++]));
        }
    });
}

function computeChartHeight(chartData) {
    let uniqueRows = new Set();
    chartData.forEach(row => uniqueRows.add(row[0]));
    return Math.min((uniqueRows.size * 41) + 50, 500);
}

function traceDescription(trace) {
    if (trace.end) {
        return `<b class="name">${trace.name}</b> <i>${localTime(trace.start)} [${seconds(trace.asyncEnd - trace.start)}]</i>`;
    } else {
        return `<b>${trace.name}</b>  <i>${localTime(trace.start)}</i>`;
    }
}

function createTraceElement(trace) {
    const traceTemplate = document.getElementById("trace-template");
    const row = traceTemplate.content.firstElementChild.cloneNode(true);
    row.firstElementChild.innerHTML = traceDescription(trace);
    row.id = trace.id;
    row.onclick = () => drawChart(trace.id);
    return row;
}

function deleteChart(transactionId) {
    let row = document.getElementById(transactionId);
    row.children[1].firstElementChild.remove();
    row.onclick = () => drawChart(transactionId);
}

function drawChart(transactionId) {
    let row = document.getElementById(transactionId);
    row.onclick = () => deleteChart(transactionId);
    fetchJson("/traces/" + transactionId + "/stages").then(stages => {
        var chart = new google.visualization.Timeline(row.children[1]);
        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn({type: 'string', id: 'Thread (level)'});
        dataTable.addColumn({type: 'string', id: 'Name'});
        dataTable.addColumn({type: 'number', id: 'Start'});
        dataTable.addColumn({type: 'number', id: 'End'});
        dataTable.addRows(stages);

        var options = {
            tooltip: {isHtml: true},
            height: computeChartHeight(stages)
        };

        chart.draw(dataTable, options);
    });
}