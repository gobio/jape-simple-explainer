package eu.gobio.jape.simple.explainer;

import javax.json.bind.annotation.JsonbTransient;

public class Stage {
    private int id;
    private Stage parent;
    private long start;
    private long end;
    private String name;
    private String thread;
    private int level;
    private Flow flow;

    public Stage(int id, long start, String name, String thread) {
        this.id = id;
        this.start = start;
        this.name = name;
        this.thread = thread;
    }

    public Flow getFlow() {
        return flow;
    }

    public void setFlow(Flow flow) {
        this.flow = flow;
    }

    public Integer getParentId() {
        return parent != null ? parent.getId() : null;
    }

    public int getId() {
        return id;
    }

    @JsonbTransient
    public Stage getParent() {
        return parent;
    }

    public void setParent(Stage parent) {
        if (parent != null) {
            this.parent = parent;
            this.level = parent.level + 1;
        } else {
            this.level = 0;
        }
    }

    public long getStart() {
        return start;
    }

    public long getEnd() {
        return end;
    }

    public void setEnd(long end) {
        this.end = end;
    }

    public String getName() {
        return name;
    }

    public String getThread() {
        return thread;
    }

    public int getLevel() {
        return level;
    }
}
