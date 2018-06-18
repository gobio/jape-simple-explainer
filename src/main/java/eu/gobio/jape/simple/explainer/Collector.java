package eu.gobio.jape.simple.explainer;

import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.Marker;
import org.apache.logging.log4j.core.filter.AbstractFilter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


public class Collector extends AbstractFilter {
    private Map<String, Trace> traces = new ConcurrentHashMap<>();
    public static Collector instance;

    public Collector() {
        Collector.instance = this;
    }

    public void clear(){
        traces.clear();
    }

    @Override
    public Result filter(org.apache.logging.log4j.core.Logger logger, Level level, Marker marker, String msg,
                         Object... params) {
        if (logger.getName().startsWith("jape")) {
            switch (logger.getName()) {
                case "jape.trace":
                    startTrace(params);
                    break;
                case "jape.stage.start":
                    startStage(params);
                    break;
                case "jape.stage.flow":
                    flow(params);
                    break;
                case "jape.stage.end":
                    endStage(params);
                    break;
            }
        }
        return Result.NEUTRAL;
    }

    private void startTrace(Object[] params) {
        Trace trace = new Trace((String) params[0], (long) params[1], (long)params[2]);
        traces.put(trace.getId(), trace);
    }

    private void startStage(Object[] params) {
        Trace trace = traces.get(params[0]);
        Stage stage = new Stage(
                (int) params[1],
                (long) params[3],
                (String) params[4],
                (String) params[5]);

        stage.setParent(trace.getStage((Integer) params[2]));

        trace.addStage(stage);
    }

    private void flow(Object[] params) {
        Trace trace = traces.get(params[0]);
        Stage stage = trace.getStage((Integer) params[1]);
        stage.setFlow(new Flow((Integer) params[3], (String) params[2]));
    }


    private void endStage(Object[] params) {
        Trace trace = traces.get(params[0]);
        trace.getStage((Integer) params[1]).setEnd((long) params[2]);
        trace.updateEnd((long) params[2]);
    }

    public List<Trace> getTraces() {
        return new ArrayList<>(traces.values());
    }

    public Trace getTraceById(String id) {
        return traces.get(id);
    }
}


