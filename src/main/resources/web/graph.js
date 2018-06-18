localTime = miliseconds => new Date(miliseconds).toLocaleTimeString();
fetchJson = url => fetch(url).then(response => response.json());


function color(str) {
    //generated with http://tools.medialab.sciences-po.fr/iwanthue/
    const colors = [
        "#6c85e5",
        "#e6563e",
        "#e6c43d",
        "#64da53",
        "#9a65f0",
        "#b2d93a",
        "#e55876",
        "#d9813a",
        "#af70cb",
        "#5bdca0",
        "#619e41",
        "#e491e2",
        "#d74fd7",
        "#b59835",
        "#b6d36c",
    ];
    const hash = str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    return colors[Math.abs(hash) % colors.length];
}


class DataFlowLink extends joint.shapes.standard.Link {
    constructor(from, to) {
        super({
            source: {id: from},
            target: {id: to},
            attrs: {
                line: {
                    strokeWidth: 1,
                    targetMarker: {
                        type: 'path',
                        d: 'M 4 -2 0 0 4 2 z'
                    }
                }
            }
        });
    }
}

class DataFlow extends joint.shapes.standard.Rectangle {
    constructor(item) {
        super({
            id: 'df' + item.id,
            attrs: {
                body: {
                    strokeWidth: 1,
                    fill: 'gray',
                    stroke: 'darkgray',
                    rx: 5,
                    ry: 5
                },
                label: {
                    text: item.flow.value,
                    fill: 'white',
                    display: 'auto'
                }
            }
        });
    }
}


class Stage extends joint.shapes.standard.Rectangle {
    constructor(item) {
        super({
            id: item.id,
            parent: parent,
            attrs: {
                body: {
                    fill: color(item.name),
                    stroke: '#666666',
                    strokeWidth: 1
                },
                label: {
                    text: item.name,
                    fill: 'white',
                    display: 'auto'
                }
            }
        });

    }

}

class PoolLane extends joint.shapes.standard.Rectangle {
    constructor(lane, color) {
        super({
            attrs: {
                body: {
                    fill: color,
                    strokeWidth: 0
                },
                label: {
                    text: lane.name,
                    fill: '#333333',
                    textVerticalAnchor: 'middle',
                    textAnchor: 'left',
                    refX: '5',
                    refY: '50%'
                }
            }
        });
    }

}

joint.dia.attributes.display = {
    set: function (value, refBBox, node, attrs) {
        if (node.getBBox().width > refBBox.width) {
            V(node).attr("display", "none");
        }
    }
};

class Lane extends Array {


    constructor(trace, name) {
        super();
        this.name = name;
        this.trace = trace;
        this.options = trace.options;
        this.options.margin = 4;
    }

    order() {
        super.sort((a, b) => a.start - b.start);
        this.start = this[0].start;
        this.end = this[this.length - 1].end;
    }

    draw(offset, idx) {
        this._countDataFlows();

        const color = (idx % 2 === 0) ? '#EEEEEE' : '#FFFFFF';
        const height = (this.dataFlows) ? this.options.stripHeight + this.options.dataFlowHeight + 4 * this.options.margin : this.options.stripHeight + 2 * this.options.margin;
        this.poolLane = new PoolLane(this, color);
        this.poolLane.size(this.options.width, height);
        this.poolLane.position(0, offset);
        this.poolLane.addTo(this.trace.model);
        this.forEach(stage => {
            this.drawStage(stage);
            if (stage.flow) {
                this.drawDataFlow(stage);
            }

        });
        return offset + height;
    }

    _countDataFlows(){
        let dataFlows = 0;
        let dataFlowLength = 0;
        this.forEach(item => {
            if (item.flow) {
                dataFlows++;
                dataFlowLength += item.flow.value.length;
            }
        })
        if (dataFlows > 0) {
            this.dataFlows = dataFlows;
            this.dataFlowLength = dataFlowLength;
            this.pixelsPerCharacter = Math.min(9, (this.trace.options.width -  this.trace.options.rightMargin - this.trace.options.leftMargin) / this.dataFlowLength);
        }
    }

    drawStage(item) {
        const stage = new Stage(item);
        stage.parent(this.poolLane);
        const {start, end} = this.trace.relativize(item);
        stage.size(Math.max((end - start) * this.trace.timescale,this.options.margin), this.options.stripHeight);
        stage.addTo(this.trace.model);
        //parentRealtive works only on elements added to graph
        const y = (this.dataFlows) ? 3 * this.options.margin + this.options.dataFlowHeight : this.options.margin;
        stage.position(start * this.trace.timescale + this.options.leftMargin, y, {parentRelative: true});
    }

    drawDataFlow(stage) {
        const value = new DataFlow(stage);
        value.parent(this.poolLane);
        const width = stage.flow.value.length * this.pixelsPerCharacter+2*this.options.margin;
        value.size(width, this.options.dataFlowHeight);
        value.addTo(this.trace.model);
        this.trace.links.push(new DataFlowLink(value.id, stage.id));
        if (stage.flow.from) {
            this.trace.links.push(new DataFlowLink(stage.flow.from, value.id));
        }
        this._positionDataFlow(stage,value);
    }

    _positionDataFlow(stage,dataFlow){
        const {start, end} = this.trace.relativize(stage);
        let position = (start + end) / 2;
        if (stage.flow.from) {
            const {start: fromStart, end: fromEnd} = this.trace.relativize(this.trace.stages[stage.flow.from]);
            position = (position + (fromStart + fromEnd) / 2) / 2;
        }
        position = position * this.trace.timescale;
        position = position - dataFlow.size().width / 2.0;

        dataFlow.position(Math.max(0,position) + this.options.leftMargin, this.options.margin, {parentRelative: true});
    }

}


class Graph extends Array {
    constructor(width, element, description) {
        super();
        this.options = {
            width: width,
            stripHeight: 20,
            dataFlowHeight: 15,
            separatorHeight: 30,
            leftMargin: 200,
            rightMargin: 10
        };
        this.stages = {};
        this.chartWidth = this.options.width - this.options.rightMargin - this.options.leftMargin;
        this.model = new joint.dia.Graph();
        this.paper = new joint.dia.Paper({
            el: element,
            model: this.model,
            gridSize: 1
        });
        this.paper.setInteractivity(false);
        this.paper.on('cell:mouseenter', (cellview, evt) => this._highlight(cellview, evt))
        this.paper.on('cell:mouseleave', this._unhighlight)
        this.descElement = description;
    }

    _orderLanes() {
        this.end = 0;
        super.forEach(lane => {
            lane.order();
            this.end = Math.max(this.end, lane.end);
        });
        super.sort((a, b) => a.start - b.start);
        this.start = this[0].start;
        this.timescale = this.chartWidth / maxTimeSpan;//(this.end - this.start);
    }

    relativize(item) {
        return {
            start: item.start - this.start,
            end: item.end - this.start
        }
    }


    lane(name) {
        if (!this[name]) {
            const lane = new Lane(this, name);
            this[name] = lane;
            super.push(lane);
        }
        return this[name];
    }

    draw(data) {
        data.forEach(item => {
            this.stages[item.id] = item;
            this.lane(this._laneName(item)).push(item);
        })
        this._orderLanes();
        this._draw();
    }

    _unhighlight(cellview, evt) {
        if (cellview.model instanceof Stage) {
            cellview.unhighlight(null, {
                highlighter: {
                    name: 'opacity'
                }
            });
        }
    }

    _highlight(cellview, evt) {
        if (cellview.model instanceof Stage) {
            this._updateDescription(this.stages[cellview.model.id]);
            cellview.highlight(null, {
                highlighter: {
                    name: 'opacity'
                }
            });
        }
    }

    _updateDescription(stage) {
        this.descElement.querySelector(".stage-name").textContent = stage.name;
        this.descElement.querySelector(".stage-time").textContent = formatTime(stage.end - stage.start);
    }


    _draw() {
        this.links = [];
        let offset = 0;
        for (let i = 0; i < this.length; i++) {
            const lane = this[i];
            offset = lane.draw(offset, i);
        }
        this.paper.setDimensions(this.options.width,offset );
        this.model.addCells(this.links);
    }


    _laneName(item) {
        return item.thread + " (" + (item.level + 1) + ")";
    }

}
