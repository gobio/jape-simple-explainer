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
            let currentTrace = currentTraces[i];
            let newTrace =  traces[j];
            if (currentTrace.id !== newTrace.id) {
                traceList.insertBefore(createTraceElement(newTrace), currentTrace);
            } else {
                updateTraceElement(newTrace,currentTrace);
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

function timeDescription(trace) {
    if (trace.end) {
        return `${localTime(trace.start)} [${seconds(trace.end - trace.start)}]`;
    } else {
        return `${localTime(trace.start)} ...`;
    }
}
function updateTraceElement(newTrace,currentTrace){
    currentTrace.querySelector(".time").textContent = timeDescription(newTrace);
    if (newTrace.end && !currentTrace.onclick) {
        currentTrace.onclick = () => drawChart(newTrace.id);
    }

}

function createTraceElement(trace) {
    const traceTemplate = document.getElementById("trace-template");
    const row = traceTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector(".time").textContent = timeDescription(trace);
    row.querySelector(".name").textContent = trace.name;
    row.id = trace.id;
    if (trace.end) {
        row.onclick = () => drawChart(trace.id);
    }
    return row;
}

function deleteChart(transactionId) {
    let row = document.getElementById(transactionId);
    row.querySelector(".chart").firstElementChild.remove();
    row.onclick = () => drawChart(transactionId);
}

function drawChart(transactionId) {
    let row = document.getElementById(transactionId);
    row.onclick = () => deleteChart(transactionId);
    fetchJson("/traces/" + transactionId + "/stages").then(stages => {
        var chart = new google.visualization.Timeline(row.querySelector(".chart"));
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