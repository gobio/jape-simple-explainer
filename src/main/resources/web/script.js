localTime = miliseconds => new Date(miliseconds).toLocaleTimeString();

timeUnits = ['ns', '\u00B5s', 'ms', 's']
maxTimeSpan = 0;

function formatTime(nanoseconds) {
    let i = 0;
    while (nanoseconds > 1000 && i < 3) {
        i++;
        nanoseconds /= 1000;
    }
    return nanoseconds.toPrecision(3) + timeUnits[i];
}

function start() {
    updateTraces();
    setInterval(updateTraces, 1000);
}

function updateTraces() {
    fetchJson("traces").then(_updateTraces);
}

function _updateTraces(traces) {
    const traceList = document.getElementById("trace-list");

    let currentTraces = traceList.children;
    let i = 0;
    let j = 0;
    while (i < currentTraces.length && j < traces.length) {
        let currentTrace = currentTraces[i];
        let newTrace = traces[j];
        if (currentTrace.id !== newTrace.id) {
            traceList.insertBefore(createTraceElement(newTrace), currentTrace);
        } else {
            updateTraceElement(newTrace, currentTrace);
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
    maxTimeSpan=0;
    traces.forEach(trace=>maxTimeSpan = Math.max(maxTimeSpan,trace.asyncEnd-trace.start));
}

function timeDescription(trace) {
    if (trace.end) {
        return `${localTime(trace.wallTime)} [${formatTime(trace.end - trace.start)}]`;
    } else {
        return `${localTime(trace.wallTime)} ...`;
    }
}

function updateTraceElement(newTrace, currentTrace) {
    currentTrace.querySelector(".time").textContent = timeDescription(newTrace);
    $(currentTrace).data("trace",newTrace);
}


function createTraceElement(trace) {
    const traceTemplate = document.getElementById("trace-template");
    const row = traceTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector(".time").textContent = timeDescription(trace);
    row.querySelector(".name").textContent = trace.name;
    row.id = trace.id;
    const $row = $(row);
    $row.data("trace", trace);
    row.querySelector(".name").onclick = () => toggleChart($row);
    return row;
}

function toggleChart($row) {
    const trace = $row.data("trace");
    if (trace.end) {
        if ($row.data("hidden")) {
            drawChart($row);
            $row.data("hidden", false);
        } else {
            deleteChart($row);
            $row.data("hidden", true);
        }
    }
}

function deleteChart($row) {
    $row.find(".toolbar").hide();
    $row.find(".chart-board").remove();
}

function drawChart($row) {
    const chartBoardTemplate = document.getElementById("chart-board-template")
        .content.firstElementChild.cloneNode(true);
    $row.find(".toolbar").show();
    $row.append(chartBoardTemplate);

    fetchJson("/traces/" + $row[0].id + "/stages").then(stages => {
        _drawChart($row, stages);
    });
}


function _drawChart($row, stages) {
    const chartElement = $row.find(".chart")[0];
    let graphData = new Graph(chartElement.offsetWidth, chartElement, $row.find(".stage-details")[0]);
    graphData.draw(stages);
}

function fetchJson(resource) {
    let relativeUrl = location.pathname.split('/').slice(0, -1).join('/');
    relativeUrl = (relativeUrl ? relativeUrl + "/" + resource : resource) + location.search;
    return fetch(relativeUrl).then(response => response.json());
}

