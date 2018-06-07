package eu.gobio.jape.simple.explainer;

import javax.json.bind.annotation.JsonbTransient;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@SuppressWarnings({"unused", "WeakerAccess"})
public class Trace {
    private String id;
    private long start;
    private Stage root;
    private long asyncEnd = 0;
    private String name;

    private Map<Integer, Stage> stages = new ConcurrentHashMap<>();

    public Trace(String id, long start) {
        this.id = id;
        this.start = start;
    }

    public long getEnd() {
        return root!=null?root.getEnd():0;
    }

    public long getAsyncEnd() {
        return asyncEnd;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void addStage(Stage stage) {
        stages.put(stage.getId(), stage);
        if (stage.getParent() == null) {
            name = stage.getName();
            root = stage;
        }
        asyncEnd = Math.max(asyncEnd, stage.getEnd());
    }

    @JsonbTransient
    public Stage getStage(int id) {
        return stages.get(id);
    }

    @JsonbTransient
    public Collection<Stage> getStages() {
        return stages.values();
    }

    public long getStart() {
        return start;
    }

    public void updateEnd(long end) {
        this.asyncEnd = Math.max(asyncEnd,end);
    }
}
