package eu.gobio.jape.simple.explainer;

import eu.gobio.jape.ExplainerActivator;
import io.undertow.Undertow;
import io.undertow.server.HttpHandler;
import io.undertow.server.HttpServerExchange;
import io.undertow.server.RoutingHandler;
import io.undertow.server.handlers.resource.ClassPathResourceManager;
import io.undertow.server.handlers.resource.ResourceHandler;
import io.undertow.server.handlers.resource.ResourceManager;
import io.undertow.util.Headers;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.LoggerContext;
import org.apache.logging.log4j.core.config.Configuration;
import org.apache.logging.log4j.status.StatusLogger;

import javax.json.bind.Jsonb;
import javax.json.bind.JsonbBuilder;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class SimpleExplainer implements ExplainerActivator {

    private Collector collector;
    private Jsonb jsonb;

    @Override
    public void activate() {
        jsonb = JsonbBuilder.create();
        installLogFilter();
        startServer();
    }

    private void installLogFilter() {
        collector = new Collector();
        StatusLogger.getLogger().setLevel(Level.OFF);

        LoggerContext context = (LoggerContext) LogManager.getContext(false);
        Configuration config = context.getConfiguration();

        config.addFilter(collector);
    }

    private void startServer() {
        ResourceManager resourceManager = new ClassPathResourceManager(this.getClass().getClassLoader(), "web");
        ResourceHandler resourceHandler = new ResourceHandler(resourceManager);

        HttpHandler handler = new RoutingHandler()
                .get("/traces", this::traces)
                .get("/traces/{id}", this::traceById)
                .get("/traces/{id}/stages", this::traceStagesById)
                .get("/*", resourceHandler);


        Undertow server = Undertow.builder().addHttpListener(5005, "localhost", handler).build();
        server.start();
    }

    private void traceById(HttpServerExchange exchange) {
        setResponseType(exchange);
        exchange.getResponseSender()
                .send(jsonb.toJson(getRequestedTrace(exchange)));
    }

    private void setResponseType(HttpServerExchange exchange) {
        exchange.getResponseHeaders()
                .put(Headers.CONTENT_TYPE, "application/json");
    }

    private Trace getRequestedTrace(HttpServerExchange exchange) {
        return collector.getTraceById(exchange
                .getQueryParameters()
                .get("id")
                .pop());
    }

    private void traceStagesById(HttpServerExchange exchange) {
        setResponseType(exchange);
        String transactionId = exchange.getQueryParameters().get("id").pop();
        Trace trace = collector.getTraceById(transactionId);

        exchange.getResponseSender().send(stagesTable(trace));
    }

    private String stagesTable(Trace trace) {
        List<Object[]> stages = trace.getStages().stream().map(stage -> new Object[]{
                String.format("%s (%d)", stage.getThread(), stage.getLevel()),
                stage.getName(),
                stage.getStart() - trace.getStart(),
                stage.getEnd() - trace.getStart()
        }).collect(Collectors.toList());
        return jsonb.toJson(stages);
    }

    private void traces(HttpServerExchange exchange) {
        setResponseType(exchange);
        List<Trace> traces = collector.getTraces();
        traces.sort(Comparator.comparing(Trace::getStart).reversed());
        exchange.getResponseSender().send(jsonb.toJson(traces));
    }
}
