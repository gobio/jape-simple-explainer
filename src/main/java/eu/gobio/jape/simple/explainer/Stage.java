package eu.gobio.jape.simple.explainer;

public class Stage {
    private int id;
    private Stage parent;
    private long start;
    private long end;
    private String name;
    private String thread;
    private int level;

    public Stage(int id, long start, String name, String thread) {
        this.id = id;
        this.start = start;
        this.name = name;
        this.thread = thread;
    }

    public Stage getParent() {
        return parent;
    }

    public void setParent(Stage parent) {
        this.parent = parent;
        this.level = parent.level + 1;
    }

    public int getId() {
        return id;
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
